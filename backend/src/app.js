const config = require('./config/env');
const express = require('express');
const cors = require('cors');
const http = require('http');
const sequelize = require('./config/database');
const imageRoutes = require('./routes/imageRoutes');
const errorHandler = require('./middleware/errorHandler');
const socketService = require('./services/SocketService');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/images', imageRoutes);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

socketService.init(server);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');
    // No migrations in this exercise: alter-sync in dev, plain create-if-missing in production.
    await sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true });
    server.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
