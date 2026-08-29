"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRoutes = backupRoutes;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const response_helper_1 = require("../helpers/response.helper");
// Helper to check admin role
function isAdmin(user) {
    return user && (user.role === 'ADMIN' || user.role === 'admin');
}
async function backupRoutes(app) {
    // Helper to authenticate and get user from request
    const authenticate = async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            reply.status(401).send({ success: false, message: 'Unauthorized: No token provided' });
            return null;
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            return decoded;
        }
        catch (err) {
            reply.status(401).send({ success: false, message: 'Unauthorized: Invalid or expired token' });
            return null;
        }
    };
    /**
     * GET /backup/urls - Export URLs
     */
    app.get('/urls', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        let urls;
        if (isAdmin(user)) {
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
        const user = await authenticate(request, reply);
        if (!user)
            return;
        const { data } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
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
                    userId: isAdmin(user) ? (item.userId || user.userId) : user.userId,
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
    /**
     * GET /backup/users - Export Users (ADMIN ONLY)
     */
    app.get('/users', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (!isAdmin(user)) {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const users = await database_1.default.user.findMany();
        return reply.send((0, response_helper_1.ok)(users, 'Users exported successfully'));
    });
    /**
     * POST /backup/users - Import Users (ADMIN ONLY)
     */
    app.post('/users', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (!isAdmin(user)) {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const { data } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        let importedCount = 0;
        for (const item of data) {
            try {
                await database_1.default.user.upsert({
                    where: { email: item.email },
                    update: {
                        username: item.username,
                        password: item.password,
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
    app.get('/settings', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (!isAdmin(user)) {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const settings = await database_1.default.urRedirectSet.findMany();
        return reply.send((0, response_helper_1.ok)(settings, 'Settings exported successfully'));
    });
    /**
     * POST /backup/settings - Import Settings (ADMIN ONLY)
     */
    app.post('/settings', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (!isAdmin(user)) {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
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