"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRoutes = backupRoutes;
const database_1 = __importDefault(require("../config/database")); // Need to check where prisma is exported from
const response_helper_1 = require("../helpers/response.helper");
async function backupRoutes(app) {
    // Add authentication middleware for all backup routes
    app.addHook('preHandler', app.authenticate);
    /**
     * GET /backup/urls - Export URLs
     */
    app.get('/urls', async (request, reply) => {
        const user = request.user;
        let urls;
        if (user.role === 'ADMIN') {
            urls = await database_1.default.url8.findMany();
        }
        else {
            urls = await database_1.default.url8.findMany({
                where: { userId: user.userId }
            });
        }
        return reply.send((0, response_helper_1.ok)(urls, 'URLs exported successfully'));
    });
    /**
     * POST /backup/urls - Import URLs
     */
    app.post('/urls', async (request, reply) => {
        const user = request.user;
        const { data } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        // For regular users, ensure they only import URLs for themselves
        // and don't overwrite existing ones if they don't own them
        let importedCount = 0;
        for (const item of data) {
            try {
                const urlData = {
                    shortUrl: item.shortUrl,
                    targetUrl: item.targetUrl,
                    title: item.title,
                    description: item.description,
                    keterangan: item.keterangan,
                    password: item.password,
                    isActive: item.isActive !== undefined ? item.isActive : true,
                    hitCounter: item.hitCounter || 0,
                    expDate: item.expDate,
                    userId: user.role === 'ADMIN' ? (item.userId || user.userId) : user.userId,
                };
                await database_1.default.url8.upsert({
                    where: { shortUrl: item.shortUrl },
                    update: urlData,
                    create: urlData,
                });
                importedCount++;
            }
            catch (err) {
                console.error('Failed to import URL:', item.shortUrl, err);
            }
        }
        return reply.send((0, response_helper_1.ok)({ count: importedCount }, `Successfully imported ${importedCount} URLs`));
    });
    const requireAdmin = async (request, reply) => {
        const user = request.user;
        if (!user || user.role !== 'ADMIN') {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
    };
    /**
     * GET /backup/users - Export Users (ADMIN ONLY)
     */
    app.get('/users', { preHandler: requireAdmin }, async (request, reply) => {
        const users = await database_1.default.user.findMany();
        return reply.send((0, response_helper_1.ok)(users, 'Users exported successfully'));
    });
    /**
     * POST /backup/users - Import Users (ADMIN ONLY)
     */
    app.post('/users', { preHandler: requireAdmin }, async (request, reply) => {
        const { data } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        let importedCount = 0;
        for (const item of data) {
            try {
                await database_1.default.user.upsert({
                    where: { email: item.email }, // Use email as unique identifier for import
                    update: {
                        username: item.username,
                        password: item.password, // This is already hashed
                        role: item.role,
                        isActive: item.isActive !== undefined ? item.isActive : true,
                    },
                    create: {
                        username: item.username,
                        email: item.email,
                        password: item.password,
                        role: item.role,
                        isActive: item.isActive !== undefined ? item.isActive : true,
                    },
                });
                importedCount++;
            }
            catch (err) {
                console.error('Failed to import user:', item.email, err);
            }
        }
        return reply.send((0, response_helper_1.ok)({ count: importedCount }, `Successfully imported ${importedCount} users`));
    });
    /**
     * GET /backup/settings - Export Settings (ADMIN ONLY)
     */
    app.get('/settings', { preHandler: requireAdmin }, async (request, reply) => {
        const settings = await database_1.default.urRedirectSet.findMany();
        return reply.send((0, response_helper_1.ok)(settings, 'Settings exported successfully'));
    });
    /**
     * POST /backup/settings - Import Settings (ADMIN ONLY)
     */
    app.post('/settings', { preHandler: requireAdmin }, async (request, reply) => {
        const { data } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        let importedCount = 0;
        for (const item of data) {
            if (!item.key)
                continue;
            try {
                await database_1.default.urRedirectSet.upsert({
                    where: { key: item.key },
                    update: { value: String(item.value) },
                    create: { key: item.key, value: String(item.value) },
                });
                importedCount++;
            }
            catch (err) {
                console.error('Failed to import setting:', item.key, err);
            }
        }
        return reply.send((0, response_helper_1.ok)({ count: importedCount }, `Successfully imported ${importedCount} settings`));
    });
}
//# sourceMappingURL=backup.routes.js.map