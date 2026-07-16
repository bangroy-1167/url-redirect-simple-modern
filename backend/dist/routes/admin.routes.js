"use strict";
/**
 * routes/admin.routes.ts
 *
 * Admin routes - requires admin role.
 * User management and global stats.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const response_helper_1 = require("../helpers/response.helper");
const pagination_helper_1 = require("../helpers/pagination.helper");
const query_helper_1 = require("../helpers/query.helper");
async function adminRoutes(app) {
    /**
     * GET /admin/urls - List ALL URLs (admin only)
     */
    app.get('/urls', async (request, reply) => {
        const pg = (0, pagination_helper_1.parsePagination)(request.query, {
            defaultSortBy: 'createdAt',
            defaultSortDir: 'desc',
        });
        const where = (0, query_helper_1.buildWhere)({
            search: pg.search ? { term: pg.search, fields: ['shortUrl', 'title', 'keterangan'] } : undefined,
            filters: pg.filters,
            allowedFilters: ['isActive', 'userId'],
        });
        const [urls, total] = await database_1.default.$transaction([
            database_1.default.url8.findMany({
                where,
                orderBy: pg.orderBy,
                skip: pg.skip,
                take: pg.take,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            }),
            database_1.default.url8.count({ where }),
        ]);
        return reply.send((0, response_helper_1.ok)(urls, 'Success', (0, pagination_helper_1.buildMeta)(pg, total)));
    });
    /**
     * GET /admin/users - List all users
     */
    app.get('/users', async (request, reply) => {
        const pg = (0, pagination_helper_1.parsePagination)(request.query, {
            defaultSortBy: 'createdAt',
            defaultSortDir: 'desc',
        });
        const where = (0, query_helper_1.buildWhere)({
            search: pg.search ? { term: pg.search, fields: ['username', 'email'] } : undefined,
            filters: pg.filters,
            allowedFilters: ['isActive', 'role'],
        });
        const [users, total] = await database_1.default.$transaction([
            database_1.default.user.findMany({
                where,
                orderBy: pg.orderBy,
                skip: pg.skip,
                take: pg.take,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: { urls: true },
                    },
                },
            }),
            database_1.default.user.count({ where }),
        ]);
        return reply.send((0, response_helper_1.ok)(users, 'Success', (0, pagination_helper_1.buildMeta)(pg, total)));
    });
    /**
     * POST /admin/users - Create new user
     */
    app.post('/users', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                    username: { type: 'string', minLength: 3, maxLength: 50 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['ADMIN', 'USER'] },
                },
            },
        },
    }, async (request, reply) => {
        const { username, email, password, role } = request.body;
        // Check if user exists
        const existing = await database_1.default.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existing) {
            return reply.status(400).send((0, response_helper_1.validationFail)({
                [existing.email === email ? 'email' : 'username']: ['User already exists'],
            }));
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        // Create user
        const user = await database_1.default.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role || 'USER',
            },
        });
        return reply.status(201).send((0, response_helper_1.ok)({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
        }, 'User created successfully'));
    });
    /**
     * GET /admin/users/:id - Get user details
     */
    app.get('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await database_1.default.user.findUnique({
            where: { id: parseInt(id, 10) },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { urls: true, sessions: true },
                },
            },
        });
        if (!user) {
            return reply.status(404).send((0, response_helper_1.fail)('User not found'));
        }
        return reply.send((0, response_helper_1.ok)(user, 'Success'));
    });
    /**
     * PUT /admin/users/:id - Update user
     */
    app.put('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        // Check if user exists
        const existing = await database_1.default.user.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!existing) {
            return reply.status(404).send((0, response_helper_1.fail)('User not found'));
        }
        // Hash password if provided
        let hashedPassword;
        if (data.password) {
            hashedPassword = await bcrypt_1.default.hash(data.password, 12);
        }
        // Update user
        const user = await database_1.default.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...(data.username && { username: data.username }),
                ...(data.email && { email: data.email }),
                ...(hashedPassword && { password: hashedPassword }),
                ...(data.role && { role: data.role }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
        return reply.send((0, response_helper_1.ok)({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        }, 'User updated successfully'));
    });
    /**
     * DELETE /admin/users/:id - Delete user
     */
    app.delete('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const currentUser = request.user;
        // Can't delete yourself
        if (currentUser.userId === parseInt(id, 10)) {
            return reply.status(400).send((0, response_helper_1.fail)('Cannot delete your own account'));
        }
        // Check if user exists
        const existing = await database_1.default.user.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!existing) {
            return reply.status(404).send((0, response_helper_1.fail)('User not found'));
        }
        // Delete user (cascade deletes sessions and URLs)
        await database_1.default.user.delete({
            where: { id: parseInt(id, 10) },
        });
        return reply.send((0, response_helper_1.ok)(null, 'User deleted successfully'));
    });
    /**
     * GET /admin/stats - Global statistics
     */
    app.get('/stats', async (_request, reply) => {
        const [totalUrls, totalUsers, totalHits, activeUrls, urlsByDay] = await Promise.all([
            database_1.default.url8.count(),
            database_1.default.user.count(),
            database_1.default.urlHit.count(),
            database_1.default.url8.count({ where: { isActive: true } }),
            // Get hits by day for last 7 days
            database_1.default.$queryRaw `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM url_hits
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
        ]);
        // Get top URLs by hits
        const topUrls = await database_1.default.url8.findMany({
            orderBy: { hitCounter: 'desc' },
            take: 10,
            select: {
                id: true,
                shortUrl: true,
                title: true,
                hitCounter: true,
            },
        });
        // Convert BigInt to Number for JSON serialization
        const recentActivity = urlsByDay.map(row => ({
            date: row.date,
            count: Number(row.count)
        }));
        return reply.send((0, response_helper_1.ok)({
            totalUrls: Number(totalUrls),
            totalUsers: Number(totalUsers),
            totalHits: Number(totalHits),
            activeUrls: Number(activeUrls),
            inactiveUrls: Number(totalUrls) - Number(activeUrls),
            topUrls,
            recentActivity,
        }, 'Success'));
    });
}
//# sourceMappingURL=admin.routes.js.map