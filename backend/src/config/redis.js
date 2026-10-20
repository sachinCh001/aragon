const config = require('./env');

// BullMQ needs its own connection options; ioredis clients are created where needed.
module.exports = {
  connection: { host: config.redis.host, port: config.redis.port },
};
