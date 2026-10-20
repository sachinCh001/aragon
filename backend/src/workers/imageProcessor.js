const config = require('../config/env');
const { Worker } = require('bullmq');
const sharp = require('sharp');
const { QUEUE_NAME } = require('../config/queue');
const { connection } = require('../config/redis');
const sequelize = require('../config/database');
const S3Service = require('../services/S3Service');
const ImageRepository = require('../repositories/ImageRepository');
const ImageValidator = require('../services/ImageValidator');
const ResolutionStrategy = require('../strategies/ResolutionStrategy');
const BlurDetectionStrategy = require('../strategies/BlurDetectionStrategy');
const FaceDetectionStrategy = require('../strategies/FaceDetectionStrategy');
const SimilarityStrategy = require('../strategies/SimilarityStrategy');
const socketService = require('../services/SocketService');

socketService.initEmitter(); // worker publishes to the API's sockets through Redis

const imageRepo = new ImageRepository();

class UnreadableImageError extends Error {}

// HEIC -> JPEG (sharp's prebuilt binaries can't decode HEVC), EXIF rotation applied once.
async function normalise(raw) {
  try {
    let input = raw;
    const { format } = await sharp(raw).metadata();
    if (format === 'heif' || format === 'heic') {
      const heicDecode = require('heic-decode');
      const { data, width, height } = await heicDecode({ buffer: raw });
      input = await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
        .jpeg({ quality: 92 })
        .toBuffer();
    }
    const buffer = await sharp(input).rotate().jpeg({ quality: 92 }).toBuffer();
    const meta = await sharp(buffer).metadata();
    const analysis = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    return { buffer, analysis, width: meta.width, height: meta.height };
  } catch (err) {
    throw new UnreadableImageError(err.message);
  }
}

function notify(userId, payload) {
  try {
    socketService.notifyUser(userId, 'imageStatus', payload);
  } catch (err) {
    console.error('Socket notify failed:', err.message); // never fail a job over a notification
  }
}

async function reject(imageId, userId, tempS3Key, reason) {
  await imageRepo.markAsRejected(imageId, reason);
  await S3Service.delete(tempS3Key).catch((e) => console.error('Temp delete failed:', e.message));
  notify(userId, { imageId, status: 'REJECTED', reason });
}

async function processImage(job) {
  const { imageId, userId, tempS3Key } = job.data;

  const raw = await S3Service.download(tempS3Key);

  let image;
  try {
    image = await normalise(raw);
  } catch (err) {
    if (err instanceof UnreadableImageError) {
      return reject(imageId, userId, tempS3Key, 'File is corrupted or is not a valid image.');
    }
    throw err;
  }

  const validator = new ImageValidator()
    .addStrategy(new ResolutionStrategy(config.validation))                 // cheapest first
    .addStrategy(new BlurDetectionStrategy(config.validation.blurThreshold))
    .addStrategy(new FaceDetectionStrategy({ minFaceRatio: config.validation.minFaceRatio }))
    .addStrategy(new SimilarityStrategy(userId, { maxDistance: config.validation.similarityDistance }));

  const result = await validator.validateAll(image);
  if (!result.isValid) {
    return reject(imageId, userId, tempS3Key, result.reason);
  }

  const finalBuffer = await sharp(image.buffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const finalKey = `processed/${userId}/${imageId}.jpg`;
  await S3Service.upload(finalBuffer, finalKey, 'image/jpeg');

  await imageRepo.markAsAccepted(imageId, finalKey, result.metadata.pHash);
  await S3Service.delete(tempS3Key).catch((e) => console.error('Temp delete failed:', e.message));
  notify(userId, { imageId, status: 'ACCEPTED' });
}

const worker = new Worker(QUEUE_NAME, async (job) => {
  try {
    await processImage(job);
  } catch (error) {
    // Infrastructure errors (S3/DB/model) are retried by BullMQ. Only after the
    // final attempt do we surface a failure to the user, so a Redis/S3 blip
    // doesn't permanently reject a good photo.
    console.error(`Processing failed for image ${job.data.imageId} (attempt ${job.attemptsMade + 1}):`, error);
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
    if (isLastAttempt) {
      await reject(job.data.imageId, job.data.userId, job.data.tempS3Key,
        'We could not process this photo. Please try uploading it again.').catch(() => {});
    }
    throw error;
  }
}, { connection, concurrency: config.workerConcurrency });

worker.on('ready', () => console.log(`Worker listening on ${QUEUE_NAME} (concurrency ${config.workerConcurrency})`));
worker.on('error', (err) => console.error('Worker error:', err));

async function shutdown() {
  await worker.close();
  await sequelize.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
