const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const { imageQueue } = require('../config/queue');
const ImageRepository = require('../repositories/ImageRepository');
const S3Service = require('../services/S3Service');
const { detectImageType } = require('../utils/fileType');

const imageRepo = new ImageRepository();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const toDto = (image) => ({
  id: image.id,
  status: image.status,
  rejectionReason: image.rejectionReason,
  originalName: image.originalName,
  createdAt: image.createdAt,
});

// Never store the client's filename in a storage key or trust it elsewhere; keep it as display text only.
const displayName = (name) => String(name || 'image').replace(/[\u0000-\u001f]/g, '').slice(0, 255);

async function rejectAtUpload(userId, file, reason) {
  const record = await imageRepo.create({
    userId, status: 'REJECTED', rejectionReason: reason, originalName: displayName(file.originalname),
  });
  return { imageId: record.id, status: 'REJECTED', reason, originalname: file.originalname };
}

async function handleFile(userId, file) {
  // Cheap, synchronous rejections: recorded as REJECTED rows so the client gets an id back.
  const type = detectImageType(file.buffer);
  if (!type) {
    return rejectAtUpload(userId, file, 'Unsupported file type. Only JPEG, PNG and HEIC are allowed.');
  }
  if (file.size < config.upload.minFileBytes) {
    return rejectAtUpload(userId, file,
      `File is too small (${Math.round(file.size / 1024)}KB). Minimum is ${Math.round(config.upload.minFileBytes / 1024)}KB.`);
  }

  const tempKey = `temp/${userId}/${uuidv4()}.${type.ext}`;
  await S3Service.upload(file.buffer, tempKey, type.mime);

  try {
    const record = await imageRepo.create({
      userId, tempS3Key: tempKey, status: 'PENDING', originalName: displayName(file.originalname),
    });
    await imageQueue.add('process-image', { imageId: record.id, userId, tempS3Key: tempKey });
    return { imageId: record.id, status: 'PENDING', originalname: file.originalname };
  } catch (err) {
    await S3Service.delete(tempKey).catch(() => {});
    throw err;
  }
}

exports.uploadImage = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!UUID_RE.test(userId || '')) throw httpError(400, 'A valid userId is required');
    if (!req.files || req.files.length === 0) throw httpError(400, 'No images provided');

    // Files are independent: handle them concurrently, keep response order = request order.
    const settled = await Promise.allSettled(req.files.map((file) => handleFile(userId, file)));
    const images = settled.map((s, i) => s.status === 'fulfilled'
      ? s.value
      : { status: 'FAILED', error: 'Upload failed, please retry', originalname: req.files[i].originalname });
    settled.forEach((s) => s.status === 'rejected' && console.error('Upload failed:', s.reason));

    return res.status(202).json({ images });
  } catch (error) {
    next(error);
  }
};

async function loadImage(req) {
  if (!UUID_RE.test(req.params.id)) throw httpError(404, 'Image not found');
  const image = await imageRepo.findById(req.params.id);
  if (!image) throw httpError(404, 'Image not found');
  return image;
}

exports.getImageStatus = async (req, res, next) => {
  try {
    const image = await loadImage(req);
    return res.json(toDto(image));
  } catch (error) {
    next(error);
  }
};

exports.getImageFile = async (req, res, next) => {
  try {
    const image = await loadImage(req);
    if (image.status !== 'ACCEPTED') throw httpError(409, 'Image not accepted');
    return res.json({ url: await S3Service.getSignedUrl(image.finalS3Key) });
  } catch (error) {
    next(error);
  }
};

exports.getUserImages = async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.userId)) throw httpError(400, 'Invalid userId');
    const images = await imageRepo.findByUserId(req.params.userId);
    return res.json(images.map(toDto));
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await loadImage(req);
    await Promise.all([S3Service.delete(image.tempS3Key), S3Service.delete(image.finalS3Key)]);
    await imageRepo.delete(image.id);
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
};
