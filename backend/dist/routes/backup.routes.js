"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRoutes = backupRoutes;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const response_helper_1 = require("../helpers/response.helper");
// Inline authentication helper
async function authenticate(request, reply) {
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
    catch {
        reply.status(401).send({ success: false, message: 'Unauthorized: Invalid or expired token' });
        return null;
    }
}
async function backupRoutes(app) {
    app.get('/urls', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        let urls;
        if (user.role === 'ADMIN' || user.role === 'admin') {
            urls = await database_1.default.url8.findMany({ orderBy: { createdAt: 'desc' } });
        }
        else {
            urls = await database_1.default.url8.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' } });
        }
        return reply.send((0, response_helper_1.ok)(urls, 'URLs exported successfully'));
    });
    app.post('/urls', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        const { data, strategy = 'upsert', invalidUserAction = 'skip' } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        let inserted = 0, updated = 0, skipped = 0;
        // Strategy: replace (truncate + insert)
        if (strategy === 'replace') {
            if (user.role === 'ADMIN' || user.role === 'admin') {
                await database_1.default.urlHit.deleteMany({});
                await database_1.default.url8.deleteMany({});
            }
            else {
                await database_1.default.url8.deleteMany({ where: { userId: user.userId } });
            }
        }
        // Cache valid users to validate userId
        const validUsers = await database_1.default.user.findMany({ select: { id: true, email: true, username: true } });
        const validUserIds = new Set(validUsers.map(u => u.id));
        for (const item of data) {
            if (!item.shortUrl) {
                skipped++;
                continue;
            }
            try {
                let targetUserId = (user.role === 'ADMIN' || user.role === 'admin') ? (item.userId || user.userId) : user.userId;
                // Handle invalid userId
                if ((user.role === 'ADMIN' || user.role === 'admin') && targetUserId !== null && !validUserIds.has(targetUserId)) {
                    if (invalidUserAction === 'skip') {
                        skipped++;
                        continue;
                    }
                    else if (invalidUserAction === 'assign_to_me') {
                        targetUserId = user.userId;
                    }
                    else if (invalidUserAction === 'create_inactive') {
                        const newUser = await database_1.default.user.create({
                            data: {
                                username: `restored_user_${targetUserId}_${Date.now()}`,
                                email: `restored_${targetUserId}_${Date.now()}@example.com`,
                                password: '',
                                isActive: false,
                                role: 'USER'
                            }
                        });
                        validUserIds.add(newUser.id);
                        targetUserId = newUser.id;
                    }
                }
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
                    userId: targetUserId,
                };
                const existing = await database_1.default.url8.findUnique({ where: { shortUrl: item.shortUrl } });
                if (strategy === 'insert_unique') {
                    if (existing) {
                        skipped++;
                        continue;
                    }
                    await database_1.default.url8.create({ data: urlData });
                    inserted++;
                }
                else if (existing) {
                    await database_1.default.url8.update({ where: { shortUrl: item.shortUrl }, data: urlData });
                    updated++;
                }
                else {
                    await database_1.default.url8.create({ data: urlData });
                    inserted++;
                }
            }
            catch (err) {
                console.error('Failed to restore URL:', item.shortUrl, err);
                skipped++;
            }
        }
        console.log(`[Backup] URLs restored: strategy=${strategy}, inserted=${inserted}, updated=${updated}, skipped=${skipped}`);
        return reply.send((0, response_helper_1.ok)({ total: data.length, strategy, inserted, updated, skipped }, `Restored URLs`));
    });
    app.get('/users', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (user.role !== 'ADMIN' && user.role !== 'admin') {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const users = await database_1.default.user.findMany({
            select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }
        });
        return reply.send((0, response_helper_1.ok)(users, 'Users exported successfully'));
    });
    app.post('/users', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (user.role !== 'ADMIN' && user.role !== 'admin') {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const { data, strategy = 'upsert' } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        let inserted = 0, updated = 0, skipped = 0;
        for (const item of data) {
            try {
                const existing = await database_1.default.user.findUnique({ where: { email: item.email } });
                if (strategy === 'insert_unique' && existing) {
                    skipped++;
                    continue;
                }
                if (existing) {
                    await database_1.default.user.update({ where: { email: item.email }, data: { username: item.username, password: item.password, role: item.role, isActive: item.isActive !== undefined ? item.isActive : true } });
                    updated++;
                }
                else {
                    await database_1.default.user.create({ data: { username: item.username, email: item.email, password: item.password, role: item.role || 'USER', isActive: item.isActive !== undefined ? item.isActive : true } });
                    inserted++;
                }
            }
            catch (err) {
                console.error('Failed to restore user:', item.email, err);
                skipped++;
            }
        }
        return reply.send((0, response_helper_1.ok)({ total: data.length, inserted, updated, skipped }, `Restored users`));
    });
    app.get('/settings', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (user.role !== 'ADMIN' && user.role !== 'admin') {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const settings = await database_1.default.urRedirectSet.findMany();
        return reply.send((0, response_helper_1.ok)(settings, 'Settings exported successfully'));
    });
    app.post('/settings', async (request, reply) => {
        const user = await authenticate(request, reply);
        if (!user)
            return;
        if (user.role !== 'ADMIN' && user.role !== 'admin') {
            return reply.status(403).send((0, response_helper_1.fail)('Forbidden: Admin access required'));
        }
        const { data, strategy = 'upsert' } = request.body;
        if (!Array.isArray(data)) {
            return reply.status(400).send((0, response_helper_1.fail)('Invalid data format. Expected an array.'));
        }
        let inserted = 0, updated = 0, skipped = 0;
        if (strategy === 'replace') {
            await database_1.default.urRedirectSet.deleteMany({});
        }
        for (const item of data) {
            if (!item.key) {
                skipped++;
                continue;
            }
            try {
                const existing = await database_1.default.urRedirectSet.findUnique({ where: { key: item.key } });
                if (existing) {
                    if (strategy === 'upsert') {
                        await database_1.default.urRedirectSet.update({ where: { key: item.key }, data: { value: String(item.value) } });
                        updated++;
                    }
                    else {
                        skipped++;
                    }
                }
                else {
                    await database_1.default.urRedirectSet.create({ data: { key: item.key, value: String(item.value), category: item.category } });
                    inserted++;
                }
            }
            catch (err) {
                console.error('Failed to restore setting:', item.key, err);
                skipped++;
            }
        }
        return reply.send((0, response_helper_1.ok)({ total: data.length, inserted, updated, skipped }, `Restored settings`));
    });
}
//# sourceMappingURL=backup.routes.js.map