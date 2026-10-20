const { Server } = require('socket.io');
const { Emitter } = require('@socket.io/redis-emitter');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const config = require('../config/env');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The API and the worker are separate processes, so the worker cannot hold the
 * socket connections. API: real Socket.io server with the Redis adapter.
 * Worker: a Redis emitter that publishes into the same adapter channel.
 */
class SocketService {
  constructor() {
    this.io = null;
    this.emitter = null;
  }

  init(server) {
    const pub = new Redis(config.redis);
    const sub = pub.duplicate();

    this.io = new Server(server, {
      cors: { origin: config.corsOrigin },
      adapter: createAdapter(pub, sub),
    });

    this.io.on('connection', (socket) => {
      const join = (userId) => {
        if (typeof userId === 'string' && UUID_RE.test(userId)) socket.join(userId);
      };
      join(socket.handshake.query.userId);
      socket.on('subscribe', join);
    });
  }

  initEmitter() {
    this.emitter = new Emitter(new Redis(config.redis));
  }

  notifyUser(userId, event, data) {
    if (this.io) this.io.to(userId).emit(event, data);
    else if (this.emitter) this.emitter.to(userId).emit(event, data);
    else console.warn('SocketService not initialised; dropping', event);
  }
}

module.exports = new SocketService();
