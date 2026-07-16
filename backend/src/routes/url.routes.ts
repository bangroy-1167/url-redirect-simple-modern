/**
 * routes/url.routes.ts
 *
 * URL management routes (authenticated users).
 * CRUD operations for URLs.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';
import { ok, fail, validationFail } from '../helpers/response.helper';
import { parsePagination, buildMeta } from '../helpers/pagination.helper';
import { buildWhere } from '../helpers/query.helper';

// Types
interface URLParams {
  id: string;
}

interface CreateUrlBody {
  shortUrl?: string;
  targetUrl: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
}

interface UpdateUrlBody {
  shortUrl?: string;
  targetUrl?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
  isActive?: boolean;
}

// Generate random short URL
function generateShortUrl(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function urlRoutes(app: FastifyInstance) {
  
  /**
   * GET /urls - List user's URLs (paginated)
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const pg = parsePagination(request.query as Record<string, unknown>, {
      defaultSortBy: 'createdAt',
      defaultSortDir: 'desc',
    });
    
    const where = buildWhere({
      search: pg.search ? { term: pg.search, fields: ['shortUrl', 'title', 'keterangan'] } : undefined,
      filters: pg.filters,
      extra: { userId: user.userId },
      allowedFilters: ['isActive'],
    });
    
    const [urls, total] = await prisma.$transaction([
      prisma.url8.findMany({
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
      prisma.url8.count({ where }),
    ]);
    
    return reply.send(ok(urls, 'Success', buildMeta(pg, total)));
  });
  
  /**
   * POST /urls - Create new URL
   */
  app.post<{ Body: CreateUrlBody }>(
    '/',
    {
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
    },
    async (request: FastifyRequest<{ Body: CreateUrlBody }>, reply: FastifyReply) => {
      const user = (request as any).user;
      const { shortUrl, targetUrl, title, description, password, expiresAt } = request.body;
      
      // Generate short URL if not provided
      let finalShortUrl = shortUrl;
      if (!finalShortUrl) {
        // Generate until unique
        let attempts = 0;
        while (attempts < 10) {
          const generated = generateShortUrl();
          const exists = await prisma.url8.findUnique({ where: { shortUrl: generated } });
          if (!exists) {
            finalShortUrl = generated;
            break;
          }
          attempts++;
        }
        if (!finalShortUrl) {
          return reply.status(500).send(fail('Failed to generate unique short URL'));
        }
      }
      
      // Check if short URL already exists
      const existing = await prisma.url8.findUnique({ where: { shortUrl: finalShortUrl } });
      if (existing) {
        return reply.status(400).send(
          validationFail({ shortUrl: ['Short URL already exists'] })
        );
      }
      
      // Hash password if provided
      let hashedPassword: string | null = null;
      if (password) {
        const bcrypt = await import('bcrypt');
        hashedPassword = await bcrypt.hash(password, 12);
      }
      
      // Create URL
      const url = await prisma.url8.create({
        data: {
          shortUrl: finalShortUrl,
          targetUrl,
          title,
          description,
          password: hashedPassword,
          expDate: expiresAt ? new Date(expiresAt) : null,
          userId: user.userId,
        },
      });
      
      return reply.status(201).send(ok({
        id: url.id,
        shortUrl: url.shortUrl,
        targetUrl: url.targetUrl,
        title: url.title,
        description: url.description,
        expDate: url.expDate,
        isActive: url.isActive,
        createdAt: url.createdAt,
      }, 'URL created successfully'));
    }
  );
  
  /**
   * GET /urls/:id - Get URL details
   */
  app.get<{ Params: URLParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: URLParams }>, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params;
      
      const url = await prisma.url8.findFirst({
        where: {
          id: parseInt(id, 10),
          userId: user.userId,
        },
      });
      
      if (!url) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      return reply.send(ok({
        ...url,
        password: undefined, // Don't expose password
      }, 'Success'));
    }
  );
  
  /**
   * PUT /urls/:id - Update URL
   */
  app.put<{ Params: URLParams; Body: UpdateUrlBody }>(
    '/:id',
    async (request: FastifyRequest<{ Params: URLParams; Body: UpdateUrlBody }>, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params;
      const data = request.body;
      
      // Check ownership
      const existing = await prisma.url8.findFirst({
        where: {
          id: parseInt(id, 10),
          userId: user.userId,
        },
      });
      
      if (!existing) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      // Hash password if provided and changed
      let hashedPassword: string | null | undefined = undefined;
      if (data.password !== undefined) {
        if (data.password) {
          const bcrypt = await import('bcrypt');
          hashedPassword = await bcrypt.hash(data.password, 12);
        } else {
          hashedPassword = null; // Remove password
        }
      }
      
      // Update URL
      const url = await prisma.url8.update({
        where: { id: parseInt(id, 10) },
        data: {
          ...(data.targetUrl && { targetUrl: data.targetUrl }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(hashedPassword !== undefined && { password: hashedPassword }),
          ...(data.expiresAt !== undefined && { expDate: data.expiresAt ? new Date(data.expiresAt) : null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
      
      return reply.send(ok({
        ...url,
        password: undefined,
      }, 'URL updated successfully'));
    }
  );
  
  /**
   * DELETE /urls/:id - Delete URL
   */
  app.delete<{ Params: URLParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: URLParams }>, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params;
      
      // Check ownership
      const existing = await prisma.url8.findFirst({
        where: {
          id: parseInt(id, 10),
          userId: user.userId,
        },
      });
      
      if (!existing) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      // Delete URL (cascade deletes hits)
      await prisma.url8.delete({
        where: { id: parseInt(id, 10) },
      });
      
      return reply.send(ok(null, 'URL deleted successfully'));
    }
  );
  
  /**
   * POST /urls/:id/reset-counter - Reset hit counter
   */
  app.post<{ Params: URLParams }>(
    '/:id/reset-counter',
    async (request: FastifyRequest<{ Params: URLParams }>, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params;
      
      // Check ownership
      const existing = await prisma.url8.findFirst({
        where: {
          id: parseInt(id, 10),
          userId: user.userId,
        },
      });
      
      if (!existing) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      // Reset counter
      const url = await prisma.url8.update({
        where: { id: parseInt(id, 10) },
        data: {
          hitCounter: 0,
          tglReset: new Date(),
        },
      });
      
      return reply.send(ok({ hitCounter: url.hitCounter }, 'Counter reset successfully'));
    }
  );
}
