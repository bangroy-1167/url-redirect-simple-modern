"use strict";
/**
 * routes/url.routes.ts
 *
 * URL management routes (authenticated users).
 * CRUD operations for URLs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlRoutes = urlRoutes;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const response_helper_1 = require("../helpers/response.helper");
const pagination_helper_1 = require("../helpers/pagination.helper");
const query_helper_1 = require("../helpers/query.helper");
// Generate random short URL
function generateShortUrl(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
async function urlRoutes(app) {
    /**
     * GET /urls - List user's URLs (paginated)
     */
    app.get('/', async (request, reply) => {
        // Check authentication
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ success: false, message: 'Unauthorized: No token' });
        }
        let userId = null;
        try {
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'change-this-in-production');
            userId = decoded.userId || decoded.id;
            request.user = decoded;
        }
        catch {
            return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid token' });
        }
        if (!userId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid token payload' });
        }
        const pg = (0, pagination_helper_1.parsePagination)(request.query, {
            defaultSortBy: 'createdAt',
            defaultSortDir: 'desc',
        });
        const where = (0, query_helper_1.buildWhere)({
            search: pg.search ? { term: pg.search, fields: ['shortUrl', 'title', 'keterangan'] } : undefined,
            filters: pg.filters,
            extra: { userId: userId },
            allowedFilters: ['isActive'],
        });
        const [urls, total] = await database_1.default.$transaction([
            database_1.default.url8.findMany({
                where,
                orderBy: pg.orderBy,
                skip: pg.skip,
                take: pg.take,
                select: {
                    id: true,
                    shortUrl: true,
                    targetUrl: true,
                    title: true,
                    keterangan: true,
                    hitCounter: true,
                    expDate: true,
                    isActive: true,
                    password: false, // Don't expose password
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            database_1.default.url8.count({ where }),
        ]);
        return reply.send((0, response_helper_1.ok)(urls, 'Success', (0, pagination_helper_1.buildMeta)(pg, total)));
    });
    /**
     * POST /urls - Create new URL
     */
    app.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['targetUrl'],
                properties: {
                    shortUrl: { type: 'string', minLength: 3, maxLength: 50 },
                    targetUrl: { type: 'string', minLength: 1, maxLength: 2048 },
                    title: { type: 'string', maxLength: 255 },
                    description: { type: 'string' },
                    password: { type: 'string' },
                    expiresAt: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        // Check authentication
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send((0, response_helper_1.fail)('Unauthorized: No token provided'));
        }
        let userId = null;
        try {
            const token = authHeader.substring(7);
            const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            userId = decoded.userId || decoded.id;
        }
        catch {
            return reply.status(401).send((0, response_helper_1.fail)('Unauthorized: Invalid or expired token'));
        }
        if (!userId) {
            return reply.status(401).send((0, response_helper_1.fail)('Unauthorized: Invalid token payload'));
        }
        const { shortUrl, targetUrl, title, description, password, expiresAt } = request.body;
        // Generate short URL if not provided
        let finalShortUrl = shortUrl;
        if (!finalShortUrl) {
            // Generate until unique
            let attempts = 0;
            while (attempts < 10) {
                const generated = generateShortUrl();
                const exists = await database_1.default.url8.findUnique({ where: { shortUrl: generated } });
                if (!exists) {
                    finalShortUrl = generated;
                    break;
                }
                attempts++;
            }
            if (!finalShortUrl) {
                return reply.status(500).send((0, response_helper_1.fail)('Failed to generate unique short URL'));
            }
        }
        // Check if short URL already exists
        const existing = await database_1.default.url8.findUnique({ where: { shortUrl: finalShortUrl } });
        if (existing) {
            return reply.status(400).send((0, response_helper_1.validationFail)({ shortUrl: ['Short URL already exists'] }));
        }
        // Hash password if provided
        let hashedPassword = null;
        if (password) {
            const bcrypt = await import('bcrypt');
            hashedPassword = await bcrypt.hash(password, 12);
        }
        // Create URL
        const url = await database_1.default.url8.create({
            data: {
                shortUrl: finalShortUrl,
                targetUrl,
                title,
                description,
                password: hashedPassword,
                expDate: expiresAt ? new Date(expiresAt) : null,
                userId: userId,
            },
        });
        return reply.status(201).send((0, response_helper_1.ok)({
            id: url.id,
            shortUrl: url.shortUrl,
            targetUrl: url.targetUrl,
            title: url.title,
            hitCounter: url.hitCounter,
            isActive: url.isActive,
        }, 'URL created successfully'));
    });
    /**
     * GET /urls/:id - Get URL details
     */
    app.get('/:id', async (request, reply) => {
        const { id } = request.params;
        const url = await database_1.default.url8.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!url) {
            return reply.status(404).send((0, response_helper_1.fail)('URL not found'));
        }
        return reply.send((0, response_helper_1.ok)(url, 'Success'));
    });
    /**
     * PUT /urls/:id - Update URL
     */
    app.put('/:id', async (request, reply) => {
        console.log('[DEBUG PUT /urls/:id] Route matched! id:', request.params.id, 'body:', JSON.stringify(request.body));
        const { id } = request.params;
        const data = request.body;
        const url = await database_1.default.url8.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!url) {
            return reply.status(404).send((0, response_helper_1.fail)('URL not found'));
        }
        // Hash password if provided
        let hashedPassword;
        if (data.password !== undefined) {
            if (data.password) {
                const bcrypt = await import('bcrypt');
                hashedPassword = await bcrypt.hash(data.password, 12);
            }
            else {
                hashedPassword = null;
            }
        }
        const updated = await database_1.default.url8.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...(data.shortUrl && { shortUrl: data.shortUrl }),
                ...(data.targetUrl && { targetUrl: data.targetUrl }),
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(hashedPassword !== undefined && { password: hashedPassword }),
                ...(data.expiresAt !== undefined && { expDate: data.expiresAt ? new Date(data.expiresAt) : null }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
        return reply.send((0, response_helper_1.ok)(updated, 'URL updated successfully'));
    });
    /**
     * DELETE /urls/:id - Delete URL
     */
    app.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        const url = await database_1.default.url8.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!url) {
            return reply.status(404).send((0, response_helper_1.fail)('URL not found'));
        }
        await database_1.default.url8.delete({
            where: { id: parseInt(id, 10) },
        });
        return reply.send((0, response_helper_1.ok)(null, 'URL deleted successfully'));
    });
    /**
     * POST /urls/:id/reset-counter - Reset hit counter
     */
    app.post('/:id/reset-counter', async (request, reply) => {
        const { id } = request.params;
        const url = await database_1.default.url8.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!url) {
            return reply.status(404).send((0, response_helper_1.fail)('URL not found'));
        }
        await database_1.default.url8.update({
            where: { id: parseInt(id, 10) },
            data: {
                hitCounter: 0,
                tglReset: new Date(),
            },
        });
        return reply.send((0, response_helper_1.ok)(null, 'Counter reset successfully'));
    });
}
//# sourceMappingURL=url.routes.js.map