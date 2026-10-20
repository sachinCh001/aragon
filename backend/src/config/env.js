// Must be the first require in every entrypoint (API + worker) so that
// modules that read process.env at import time see the .env values.
require('dotenv').config();

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

module.exports = {
  port: int(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: int(process.env.REDIS_PORT, 6379),
  },
  upload: {
    maxFiles: 10,
    maxFileBytes: int(process.env.MAX_FILE_MB, 25) * 1024 * 1024,
    minFileBytes: int(process.env.MIN_FILE_KB, 30) * 1024,
  },
  validation: {
    minWidth: int(process.env.MIN_WIDTH, 512),
    minHeight: int(process.env.MIN_HEIGHT, 512),
    blurThreshold: int(process.env.BLUR_THRESHOLD, 100),
    minFaceRatio: parseFloat(process.env.MIN_FACE_RATIO) || 0.05,
    // max Hamming distance (out of 256 bits) at which two photos count as duplicates
    similarityDistance: int(process.env.SIMILARITY_DISTANCE, 24),
  },
  // Kept at 1 on purpose: the similarity check compares against ACCEPTED rows,
  // so concurrent jobs for the same user could accept two near-duplicates.
  workerConcurrency: int(process.env.WORKER_CONCURRENCY, 1),
};
