/**
 * routes/admin.routes.ts
 *
 * Admin routes - requires admin role.
 * User management and global stats.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { ok, fail, validationFail } from '../helpers/response.helper';
import { parsePagination, buildMeta } from '../helpers/pagination.helper';
import { buildWhere } from '../helpers/query.helper';

// Types
interface UserParams {
  id: string;
}

interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  role?: string;
}

interface UpdateUserBody {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export async function adminRoutes(app: FastifyInstance) {
  
  /**
   * GET /admin/urls - List ALL URLs (admin only)
   */
  app.get('/urls', async (request: FastifyRequest, reply: FastifyReply) => {
    const pg = parsePagination(request.query as Record<string, unknown>, {
      defaultSortBy: 'createdAt',
      defaultSortDir: 'desc',
    });
    
    const where = buildWhere({
      search: pg.search ? { term: pg.search, fields: ['shortUrl', 'title', 'keterangan'] } : undefined,
      filters: pg.filters,
      allowedFilters: ['isActive', 'userId'],
    });
    
    const [urls, total] = await prisma.$transaction([
      prisma.url8.findMany({
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
      prisma.url8.count({ where }),
    ]);
    
    return reply.send(ok(urls, 'Success', buildMeta(pg, total)));
  });
  
  /**
   * GET /admin/users - List all users
   */
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const pg = parsePagination(request.query as Record<string, unknown>, {
      defaultSortBy: 'createdAt',
      defaultSortDir: 'desc',
    });
    
    const where = buildWhere({
      search: pg.search ? { term: pg.search, fields: ['username', 'email'] } : undefined,
      filters: pg.filters,
      allowedFilters: ['isActive', 'role'],
    });
    
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
    ]);
    
    return reply.send(ok(users, 'Success', buildMeta(pg, total)));
  });
  
  /**
   * POST /admin/users - Create new user
   */
  app.post<{ Body: CreateUserBody }>(
    '/users',
    {
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
    },
    async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
      const { username, email, password, role } = request.body;
      
      // Check if user exists
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      
      if (existing) {
        return reply.status(400).send(
          validationFail({
            [existing.email === email ? 'email' : 'username']: ['User already exists'],
          })
        );
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: (role as any) || 'USER',
        },
      });
      
      return reply.status(201).send(ok({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }, 'User created successfully'));
    }
  );
  
  /**
   * GET /admin/users/:id - Get user details
   */
  app.get<{ Params: UserParams }>(
    '/users/:id',
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      const user = await prisma.user.findUnique({
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
        return reply.status(404).send(fail('User not found'));
      }
      
      return reply.send(ok(user, 'Success'));
    }
  );
  
  /**
   * PUT /admin/users/:id - Update user
   */
  app.put<{ Params: UserParams; Body: UpdateUserBody }>(
    '/users/:id',
    async (request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const data = request.body;
      
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!existing) {
        return reply.status(404).send(fail('User not found'));
      }
      
      // Hash password if provided
      let hashedPassword: string | undefined;
      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 12);
      }
      
      // Update user
      const user = await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data: {
          ...(data.username && { username: data.username }),
          ...(data.email && { email: data.email }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(data.role && { role: data.role as any }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
      
      return reply.send(ok({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      }, 'User updated successfully'));
    }
  );
  
  /**
   * DELETE /admin/users/:id - Delete user
   */
  app.delete<{ Params: UserParams }>(
    '/users/:id',
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const currentUser = (request as any).user;
      
      // Can't delete yourself
      if (currentUser.userId === parseInt(id, 10)) {
        return reply.status(400).send(fail('Cannot delete your own account'));
      }
      
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!existing) {
        return reply.status(404).send(fail('User not found'));
      }
      
      // Delete user (cascade deletes sessions and URLs)
      await prisma.user.delete({
        where: { id: parseInt(id, 10) },
      });
      
      return reply.send(ok(null, 'User deleted successfully'));
    }
  );
  
  /**
   * GET /admin/stats - Global statistics
   */
  app.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [totalUrls, totalUsers, totalHits, activeUrls, urlsByDay] = await Promise.all([
      prisma.url8.count(),
      prisma.user.count(),
      prisma.urlHit.count(),
      prisma.url8.count({ where: { isActive: true } }),
      // Get hits by day for last 7 days
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM url_hits
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);
    
    // Get top URLs by hits
    const topUrls = await prisma.url8.findMany({
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
    const recentActivity = (urlsByDay as unknown as Array<{ date: Date; count: bigint }>).map(row => ({
      date: row.date,
      count: Number(row.count)
    }));
    
    return reply.send(ok({
      totalUrls: Number(totalUrls),
      totalUsers: Number(totalUsers),
      totalHits: Number(totalHits),
      activeUrls: Number(activeUrls),
      inactiveUrls: Number(totalUrls) - Number(activeUrls),
      topUrls,
      recentActivity,
    }, 'Success'));
  });

  /**
   * GET /admin/settings - Get all settings
   */
  app.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    // Get all settings from database
    const settings = await prisma.urRedirectSet.findMany();
    
    // Convert to key-value object
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    
    // Get defaults from .env for rate limits
    const result = {
      appName: settingsMap['app_name'] || 'modernURL8',
      appSubtitle: settingsMap['app_subtitle'] || 'URL Redirection Service',
      appVersion: settingsMap['app_version'] || 'v.2.09',
      autoRedirect: settingsMap['auto_redirect'] !== 'false',
      autoRedirectDelay: parseInt(settingsMap['auto_redirect_delay'] || '2', 10),
      rateLimitPublic: parseInt(settingsMap['rate_limit_public'] || process.env.RATE_LIMIT_PUBLIC || '20', 10),
      rateLimitAuth: parseInt(settingsMap['rate_limit_auth'] || process.env.RATE_LIMIT_AUTH || '100', 10),
    };
    
    return reply.send(ok(result, 'Success'));
  });

  /**
   * PUT /admin/settings - Update settings
   */
  app.put('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as Record<string, unknown>;
    
    const settingsToUpdate = [
      { key: 'app_name', value: String(data.appName || 'modernURL8') },
      { key: 'app_subtitle', value: String(data.appSubtitle || 'URL Redirection Service') },
      { key: 'app_version', value: String(data.appVersion || 'v.2.09') },
      { key: 'auto_redirect', value: String(data.autoRedirect !== false) },
      { key: 'auto_redirect_delay', value: String(data.autoRedirectDelay || 2) },
      { key: 'rate_limit_public', value: String(data.rateLimitPublic || 20) },
      { key: 'rate_limit_auth', value: String(data.rateLimitAuth || 100) },
    ];
    
    // Upsert each setting
    for (const setting of settingsToUpdate) {
      await prisma.urRedirectSet.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      });
    }
    
    return reply.send(ok(null, 'Settings updated successfully'));
  });
}
