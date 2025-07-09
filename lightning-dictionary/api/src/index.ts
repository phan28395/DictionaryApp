import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { loadDictionary } from './services/dictionary';
import { defineRoutes } from './routes';
import { config } from './config';
import { initDatabase, closeDatabase } from './database/init';
import cacheManager from './utils/cache-manager';
import { connectionPool } from './database/db';

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function start() {
  try {
    // Register plugins
    await server.register(helmet, {
      contentSecurityPolicy: false,
    });

    await server.register(cors, {
      origin: true,
      credentials: true,
    });

    await server.register(compress, {
      global: true,
      encodings: ['gzip', 'deflate', 'br'],
    });

    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });
    
    // Initialize database
    await initDatabase();
    server.log.info('Database initialized successfully');

    // Load dictionary data into memory
    const startTime = Date.now();
    await loadDictionary();
    server.log.info(`Dictionary loaded in ${Date.now() - startTime}ms`);

    // Register routes
    await defineRoutes(server);

    // Start server
    await server.listen({
      port: config.port,
      host: config.host,
    });

    server.log.info(`Server listening on ${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Handle shutdown gracefully
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, shutting down gracefully`);
    await server.close();
    await cacheManager.close();
    await connectionPool.closePool();
    await closeDatabase();
    process.exit(0);
  });
});

start();