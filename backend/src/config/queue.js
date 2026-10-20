const { Queue } = require('bullmq');
const { connection } = require('./redis');

const QUEUE_NAME = 'image-processing-queue';

const imageQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

module.exports = { QUEUE_NAME, imageQueue };
