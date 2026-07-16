/**
 * src/index.ts
 *
 * Main entry point untuk modernURL8 API.
 * Fastify server dengan route registration.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { urlRoutes } from './routes/url.routes';
import { adminRoutes } from './routes/admin.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { publicRoutes } from './routes/public.routes';

const API_PREFIX = process.env.API_PREFIX || '/api8url';

async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // ========================
  // PLUGINS
  // ========================

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8002').split(',');
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed'), false);
    },
    credentials: true,
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_PUBLIC || '20', 10),
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      message: 'Too many requests, please try again later.',
    }),
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register auth middleware
  await app.register(authMiddleware);

  // ========================
  // ROUTES
  // ========================

  // Public routes (no auth required)
  await app.register(publicRoutes, { prefix: API_PREFIX });

  // Auth routes
  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });

  // URL management routes (auth required)
  await app.register(urlRoutes, { prefix: `${API_PREFIX}/urls` });

  // Analytics routes (auth required)
  await app.register(analyticsRoutes, { prefix: `${API_PREFIX}/analytics` });

  // Admin routes (admin role required)
  await app.register(adminRoutes, { prefix: `${API_PREFIX}/admin` });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    const port = parseInt(process.env.PORT || '8002', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`\n🚀 modernURL8 API running at http://${host}:${port}${API_PREFIX}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🔗 Redirect: http://${host}:${port}${API_PREFIX}/{shortUrl}`);
    console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📤 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📤 Shutting down gracefully...');
  process.exit(0);
});

start();

export { buildApp };
