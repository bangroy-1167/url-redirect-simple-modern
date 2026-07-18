/**
 * routes/url.routes.ts
 *
 * URL management routes (authenticated users).
 * CRUD operations for URLs.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
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
  removePassword?: boolean;
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
    // Check authentication
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, message: 'Unauthorized: No token' });
    }
    
    let userId: number | null = null;
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-in-production') as { userId: number; id: number; email: string; role: string };
      userId = decoded.userId || decoded.id;
      (request as any).user = decoded;
    } catch {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid token' });
    }
    
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid token payload' });
    }
    
    const pg = parsePagination(request.query as Record<string, unknown>, {
      defaultSortBy: 'createdAt',
      defaultSortDir: 'desc',
    });
    
    const where = buildWhere({
      search: pg.search ? { term: pg.search, fields: ['shortUrl', 'title', 'keterangan'] } : undefined,
      filters: pg.filters,
      extra: { userId: userId },
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
      // Check authentication
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send(fail('Unauthorized: No token provided'));
      }
      
      let userId: number | null = null;
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
        const decoded = jwt.verify(token, jwtSecret) as { userId: number; id: number; email: string; role: string };
        userId = decoded.userId || decoded.id;
      } catch {
        return reply.status(401).send(fail('Unauthorized: Invalid or expired token'));
      }
      
      if (!userId) {
        return reply.status(401).send(fail('Unauthorized: Invalid token payload'));
      }
      
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
          userId: userId,
        },
      });
      
      return reply.status(201).send(ok({
        id: url.id,
        shortUrl: url.shortUrl,
        targetUrl: url.targetUrl,
        title: url.title,
        hitCounter: url.hitCounter,
        isActive: url.isActive,
      }, 'URL created successfully'));
    }
  );
  
  /**
   * GET /urls/:id - Get URL details
   */
  app.get<{ Params: URLParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: URLParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      const url = await prisma.url8.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!url) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      return reply.send(ok(url, 'Success'));
    }
  );
  
  /**
   * PUT /urls/:id - Update URL
   */
  app.put<{ Params: URLParams; Body: UpdateUrlBody }>(
    '/:id',
    async (request: FastifyRequest<{ Params: URLParams; Body: UpdateUrlBody }>, reply: FastifyReply) => {
      console.log('[DEBUG PUT /urls/:id] Route matched! id:', request.params.id, 'body:', JSON.stringify(request.body));
      
      const { id } = request.params;
      const data = request.body;
      
      const url = await prisma.url8.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!url) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      // Hash password if provided
      let hashedPassword: string | null | undefined;
      if (data.removePassword === true) {
        // Explicitly remove password
        hashedPassword = null;
      } else if (data.password !== undefined) {
        if (data.password) {
          const bcrypt = await import('bcrypt');
          hashedPassword = await bcrypt.hash(data.password, 12);
        } else {
          hashedPassword = null;
        }
      }
      
      const updated = await prisma.url8.update({
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
      
      return reply.send(ok(updated, 'URL updated successfully'));
    }
  );
  
  /**
   * DELETE /urls/:id - Delete URL
   */
  app.delete<{ Params: URLParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: URLParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      const url = await prisma.url8.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!url) {
        return reply.status(404).send(fail('URL not found'));
      }
      
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
      const { id } = request.params;
      
      const url = await prisma.url8.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!url) {
        return reply.status(404).send(fail('URL not found'));
      }
      
      await prisma.url8.update({
        where: { id: parseInt(id, 10) },
        data: {
          hitCounter: 0,
          tglReset: new Date(),
        },
      });
      
      return reply.send(ok(null, 'Counter reset successfully'));
    }
  );
}
