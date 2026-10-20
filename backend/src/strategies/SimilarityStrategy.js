const ValidationStrategy = require('./ValidationStrategy');
const sharp = require('sharp');
const ImageRepository = require('../repositories/ImageRepository');

// Difference hash (dHash): 17x16 greyscale, one bit per horizontal gradient => 256 bits.
// More robust to brightness/contrast changes than an average hash.
async function generateDHash(imageBuffer) {
  const { data } = await sharp(imageBuffer)
    .greyscale()
    .resize(17, 16, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = '';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      bits += data[y * 17 + x] > data[y * 17 + x + 1] ? '1' : '0';
    }
  }
  return bits;
}

function hammingDistance(a, b) {
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance++;
  }
  return distance;
}

class SimilarityStrategy extends ValidationStrategy {
  constructor(userId, { maxDistance = 24, repo = new ImageRepository() } = {}) {
    super();
    this.userId = userId;
    this.maxDistance = maxDistance;
    this.repo = repo;
  }

  async execute({ analysis }) {
    const hash = await generateDHash(analysis);
    const existing = await this.repo.findAcceptedHashes(this.userId);

    for (const other of existing) {
      if (hammingDistance(hash, other) <= this.maxDistance) {
        return { isValid: false, reason: 'Too similar to a photo you already uploaded.' };
      }
    }
    // Returned so the worker can store it with the accepted image.
    return { isValid: true, metadata: { pHash: hash } };
  }
}

module.exports = SimilarityStrategy;
module.exports.generateDHash = generateDHash;
module.exports.hammingDistance = hammingDistance;
