"use strict";
/**
 * src/index.ts
 *
 * Main entry point untuk modernURL8 API.
 * Fastify server dengan route registration.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const static_1 = __importDefault(require("@fastify/static"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Import middleware
const auth_middleware_1 = require("./middleware/auth.middleware");
// Import routes
const auth_routes_1 = require("./routes/auth.routes");
const url_routes_1 = require("./routes/url.routes");
const admin_routes_1 = require("./routes/admin.routes");
const analytics_routes_1 = require("./routes/analytics.routes");
const public_routes_1 = require("./routes/public.routes");
const API_PREFIX = process.env.API_PREFIX || '/api8url';
const publicPath = path_1.default.join(process.cwd(), 'public');
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: {
            level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
        },
    });
    // CORS
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8002').split(',');
            if (!origin)
                return cb(null, true);
            if (allowedOrigins.includes(origin))
                return cb(null, true);
            return cb(new Error('Not allowed'), false);
        },
        credentials: true,
    });
    // Rate Limiting
    await app.register(rate_limit_1.default, {
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
    await app.register(static_1.default, {
        root: publicPath,
        prefix: '/',
        decorateReply: false,
    });
    // Helper to send SPA index.html
    const sendSpaIndex = async (_request, reply) => {
        const indexPath = path_1.default.join(publicPath, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            const html = fs_1.default.readFileSync(indexPath, 'utf-8');
            return reply.type('text/html').send(html);
        }
        return reply.status(404).send('Not found');
    };
    // Health check
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    // SPA routes for /kelola/*
    app.get('/kelola', async (request, reply) => sendSpaIndex(request, reply));
    app.get('/kelola/', async (request, reply) => sendSpaIndex(request, reply));
    app.get('/kelola/login', async (request, reply) => sendSpaIndex(request, reply));
    app.get('/kelola/logout', async (request, reply) => sendSpaIndex(request, reply));
    app.get('/kelola/urls', async (request, reply) => sendSpaIndex(request, reply));
    app.get('/kelola/users', async (request, reply) => sendSpaIndex(request, reply));
    // Public routes (clean URL redirect)
    await app.register(public_routes_1.publicRoutes);
    // Register auth middleware
    await app.register(auth_middleware_1.authMiddleware);
    // API routes
    await app.register(auth_routes_1.authRoutes, { prefix: `${API_PREFIX}/auth` });
    await app.register(url_routes_1.urlRoutes, { prefix: `${API_PREFIX}/urls` });
    await app.register(analytics_routes_1.analyticsRoutes, { prefix: `${API_PREFIX}/analytics` });
    await app.register(admin_routes_1.adminRoutes, { prefix: `${API_PREFIX}/admin` });
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
    }
    catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
start();
//# sourceMappingURL=index.js.map