/**
 * src/index.ts
 *
 * Main entry point untuk modernURL8 API.
 * Fastify server dengan route registration.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { urlRoutes } from './routes/url.routes';
import { adminRoutes } from './routes/admin.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { publicRoutes } from './routes/public.routes';

const API_PREFIX = process.env.API_PREFIX || '/api8url';

const publicPath = path.join(process.cwd(), 'public');

async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // CORS - Allow all for development, static assets don't need CORS preflight
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8002').split(',');
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests without origin (same-origin, curl, etc.)
      if (!origin) return cb(null, true);
      // Allow if origin matches whitelist
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // In development, allow all origins (safer for dev)
      if (process.env.NODE_ENV === 'development') return cb(null, true);
      // Otherwise reject
      return cb(new Error('Not allowed'), false);
    },
    credentials: true,
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_AUTH || '100', 10),
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => {
      const retryAfter = Math.ceil(context.ttl / 1000);
      return {
        success: false,
        message: 'Too many requests',
        error: 'rate_limit_exceeded',
        retryAfter,
        retryIn: `${retryAfter} seconds`,
      };
    },
  });

  // Serve static files
  await app.register(fastifyStatic, {
    root: publicPath,
    prefix: '/',
    decorateReply: false,
  });

  // Helper to send SPA index.html
  const sendSpaIndex = async (_request: any, reply: any) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      return reply.type('text/html').send(html);
    }
    return reply.status(404).send('Not found');
  };

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Public routes FIRST (clean URL redirect) - must be before SPA routes
  await app.register(publicRoutes);

  // SPA routes for /kelola/* - registered AFTER public routes
  app.get('/kelola', async (request, reply) => sendSpaIndex(request, reply));
  app.get('/kelola/', async (request, reply) => sendSpaIndex(request, reply));
  app.get('/kelola/login', async (request, reply) => sendSpaIndex(request, reply));
  app.get('/kelola/logout', async (request, reply) => sendSpaIndex(request, reply));
  app.get('/kelola/urls', async (request, reply) => sendSpaIndex(request, reply));
  app.get('/kelola/users', async (request, reply) => sendSpaIndex(request, reply));
  app.get('/kelola/settings', async (request, reply) => sendSpaIndex(request, reply));

  // Register auth middleware
  await app.register(authMiddleware);

  // API routes
  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  await app.register(urlRoutes, { prefix: `${API_PREFIX}/urls` });
  await app.register(analyticsRoutes, { prefix: `${API_PREFIX}/analytics` });
  await app.register(adminRoutes, { prefix: `${API_PREFIX}/admin` });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    const port = parseInt(process.env.PORT || '8002', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`\n🚀 modernURL8 running at http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🔗 Clean URL redirect: http://${host}:${port}/{shortUrl}`);
    console.log(`📦 API: http://${host}:${port}${API_PREFIX}`);
    console.log(`🎛️  Admin Panel: http://${host}:${port}/kelola`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

start();

export { buildApp };
