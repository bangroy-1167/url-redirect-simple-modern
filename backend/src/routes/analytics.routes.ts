/**
 * routes/analytics.routes.ts
 *
 * Analytics routes - for authenticated users.
 * URL-specific analytics and overview.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';
import { ok, fail } from '../helpers/response.helper';

interface AnalyticsParams {
  id: string;
}

export async function analyticsRoutes(app: FastifyInstance) {
  
  /**
   * GET /analytics/overview - Dashboard overview
   */
  app.get('/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    
    // Get user's URLs stats
    const [urls, totalHits, urlsByDay] = await Promise.all([
      prisma.url8.findMany({
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
      prisma.url8.aggregate({
        where: { userId: user.userId },
        _sum: { hitCounter: true },
      }),
      // Get hits by day for last 7 days
      prisma.$queryRaw`
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
    const deviceBreakdown = await prisma.$queryRaw`
      SELECT device_type, COUNT(*) as count
      FROM url_hits uh
      JOIN url8 u ON uh.url_id = u.id
      WHERE u.user_id = ${user.userId}
      GROUP BY device_type
    `;
    
    // Get browser breakdown
    const browserBreakdown = await prisma.$queryRaw`
      SELECT browser, COUNT(*) as count
      FROM url_hits uh
      JOIN url8 u ON uh.url_id = u.id
      WHERE u.user_id = ${user.userId}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 5
    `;
    
    return reply.send(ok({
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
  app.get<{ Params: AnalyticsParams }>(
    '/urls/:id',
    async (request: FastifyRequest<{ Params: AnalyticsParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      // Get URL (no ownership check - admin/owner can view)
      const url = await prisma.url8.findUnique({
        where: {
          id: parseInt(id, 10),
        },
      });
      
      if (!url) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      // Get detailed stats with comprehensive analytics
      const [hitsByDay, topReferrers, deviceBreakdown, browserBreakdown, osBreakdown, hourlyDist, recentHits] = await Promise.all([
        // Hits by day (last 30 days)
        prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
        // Top referrers
        prisma.$queryRaw`
          SELECT referer, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          AND referer IS NOT NULL
          GROUP BY referer
          ORDER BY count DESC
          LIMIT 10
        `,
        // Device breakdown with counts
        prisma.$queryRaw`
          SELECT device_type, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          GROUP BY device_type
        `,
        // Browser breakdown
        prisma.$queryRaw`
          SELECT browser, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          AND browser IS NOT NULL
          GROUP BY browser
          ORDER BY count DESC
        `,
        // OS breakdown
        prisma.$queryRaw`
          SELECT os, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          AND os IS NOT NULL
          GROUP BY os
          ORDER BY count DESC
        `,
        // Hourly distribution
        prisma.$queryRaw`
          SELECT HOUR(created_at) as hour, COUNT(*) as count
          FROM url_hits
          WHERE url_id = ${url.id}
          GROUP BY HOUR(created_at)
          ORDER BY hour ASC
        `,
        // Recent hits (last 50)
        prisma.urlHit.findMany({
          where: { urlId: url.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            ipAddress: true,
            referer: true,
            deviceType: true,
            browser: true,
            os: true,
            country: true,
            createdAt: true,
          },
        }),
      ]);
      
      // Calculate unique visitors
      const uniqueVisitors = await prisma.urlHit.groupBy({
        by: ['ipAddress'],
        where: { urlId: url.id },
        _count: true,
      });
      
      // Format device breakdown
      const byDevice: Record<string, number> = {};
      if (Array.isArray(deviceBreakdown)) {
        deviceBreakdown.forEach((d: any) => {
          byDevice[d.device_type?.toLowerCase() || 'other'] = Number(d.count);
        });
      }
      
      // Format browser breakdown
      const byBrowser: Record<string, number> = {};
      if (Array.isArray(browserBreakdown)) {
        browserBreakdown.forEach((b: any) => {
          if (b.browser) byBrowser[b.browser] = Number(b.count);
        });
      }
      
      // Format OS breakdown
      const byOs: Record<string, number> = {};
      if (Array.isArray(osBreakdown)) {
        osBreakdown.forEach((o: any) => {
          if (o.os) byOs[o.os] = Number(o.count);
        });
      }
      
      // Format referrers
      const byReferer: Record<string, number> = {};
      if (Array.isArray(topReferrers)) {
        topReferrers.forEach((r: any) => {
          byReferer[r.referer || '(Direct)'] = Number(r.count);
        });
      }
      
      // Format hourly distribution
      const byHour: Record<number, number> = {};
      if (Array.isArray(hourlyDist)) {
        hourlyDist.forEach((h: any) => {
          byHour[Number(h.hour)] = Number(h.count);
        });
      }
      
      return reply.send(ok({
        url: {
          id: url.id,
          shortUrl: url.shortUrl,
          title: url.title,
          targetUrl: url.targetUrl,
          hitCounter: url.hitCounter,
          createdAt: url.createdAt,
        },
        stats: {
          totalHits: url.hitCounter,
          uniqueVisitors: uniqueVisitors.length,
          avgHitsPerDay: url.hitCounter / 30,
        },
        byDevice,
        byBrowser,
        byOs,
        byReferer,
        byHour,
        recentHits,
      }, 'Success'));
    }
  );
}
