"use strict";
/**
 * routes/analytics.routes.ts
 *
 * Analytics routes - for authenticated users.
 * URL-specific analytics and overview.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = analyticsRoutes;
const database_1 = __importDefault(require("../config/database"));
const response_helper_1 = require("../helpers/response.helper");
async function analyticsRoutes(app) {
    /**
     * GET /analytics/overview - Dashboard overview
     */
    app.get('/overview', async (request, reply) => {
        const user = request.user;
        // Get user's URLs stats
        const [urls, totalHits, urlsByDay] = await Promise.all([
            database_1.default.url8.findMany({
                where: { userId: user.userId },
                select: {
                    id: true,
                    shortUrl: true,
                    title: true,
                    hitCounter: true,
                    createdAt: true,
                },
                orderBy: { hitCounter: 'desc' },
                take: 10,
            }),
            database_1.default.url8.aggregate({
                where: { userId: user.userId },
                _sum: { hitCounter: true },
            }),
            // Get hits by day for last 7 days
            database_1.default.$queryRaw `
        SELECT DATE(uh.created_at) as date, COUNT(*) as count
        FROM url_hits uh
        JOIN url8 u ON uh.url_id = u.id
        WHERE u.user_id = ${user.userId}
        AND uh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(uh.created_at)
        ORDER BY date DESC
      `,
        ]);
        // Get device breakdown
        const deviceBreakdown = await database_1.default.$queryRaw `
      SELECT device_type, COUNT(*) as count
      FROM url_hits uh
      JOIN url8 u ON uh.url_id = u.id
      WHERE u.user_id = ${user.userId}
      GROUP BY device_type
    `;
        // Get browser breakdown
        const browserBreakdown = await database_1.default.$queryRaw `
      SELECT browser, COUNT(*) as count
      FROM url_hits uh
      JOIN url8 u ON uh.url_id = u.id
      WHERE u.user_id = ${user.userId}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 5
    `;
        return reply.send((0, response_helper_1.ok)({
            totalUrls: urls.length,
            totalHits: totalHits._sum.hitCounter || 0,
            topUrls: urls,
            recentActivity: urlsByDay,
            deviceBreakdown,
            browserBreakdown,
        }, 'Success'));
    });
    /**
     * GET /analytics/urls/:id - Detailed URL analytics
     */
    app.get('/urls/:id', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        // Get URL (verify ownership)
        const url = await database_1.default.url8.findFirst({
            where: {
                id: parseInt(id, 10),
                userId: user.userId,
            },
        });
        if (!url) {
            return reply.status(404).send((0, response_helper_1.fail)('URL not found'));
        }
        // Get detailed stats
        const [hitsByDay, topReferrers, deviceBreakdown, recentHits] = await Promise.all([
            // Hits by day (last 30 days)
            database_1.default.$queryRaw `
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
            // Top referrers
            database_1.default.$queryRaw `
          SELECT referer, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          AND referer IS NOT NULL
          GROUP BY referer
          ORDER BY count DESC
          LIMIT 10
        `,
            // Device breakdown
            database_1.default.$queryRaw `
          SELECT device_type, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          GROUP BY device_type
        `,
            // Recent hits (last 20)
            database_1.default.urlHit.findMany({
                where: { urlId: url.id },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    ipAddress: true,
                    referer: true,
                    deviceType: true,
                    browser: true,
                    os: true,
                    createdAt: true,
                },
            }),
        ]);
        // Calculate unique visitors
        const uniqueVisitors = await database_1.default.urlHit.groupBy({
            by: ['ipAddress'],
            where: { urlId: url.id },
            _count: true,
        });
        return reply.send((0, response_helper_1.ok)({
            url: {
                id: url.id,
                shortUrl: url.shortUrl,
                title: url.title,
                hitCounter: url.hitCounter,
            },
            stats: {
                totalHits: url.hitCounter,
                uniqueVisitors: uniqueVisitors.length,
                avgHitsPerDay: url.hitCounter / 30,
            },
            hitsByDay,
            topReferrers,
            deviceBreakdown,
            recentHits,
        }, 'Success'));
    });
}
//# sourceMappingURL=analytics.routes.js.map