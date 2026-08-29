import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { ok, fail } from '../helpers/response.helper';

// Helper to check admin role
function isAdmin(user: any): boolean {
  return user && (user.role === 'ADMIN' || user.role === 'admin');
}

export async function backupRoutes(app: FastifyInstance) {

  // Helper to authenticate and get user from request
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ success: false, message: 'Unauthorized: No token provided' });
      return null;
    }
    
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string; role: string };
      return decoded;
    } catch (err) {
      reply.status(401).send({ success: false, message: 'Unauthorized: Invalid or expired token' });
      return null;
    }
  };

  /**
   * GET /backup/urls - Export URLs
   */
  app.get('/urls', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    let urls;
    if (isAdmin(user)) {
      urls = await prisma.url8.findMany();
    } else {
      urls = await prisma.url8.findMany({
        where: { userId: user.userId }
      });
    }

    return reply.send(ok(urls, 'URLs exported successfully'));
  });

  /**
   * POST /backup/urls - Import URLs
   */
  app.post('/urls', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { data } = request.body as { data: any[] };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let importedCount = 0;

    for (const item of data) {
      try {
        const urlData: any = {
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

        await prisma.url8.upsert({
          where: { shortUrl: item.shortUrl },
          update: urlData,
          create: urlData,
        });
        importedCount++;
      } catch (err) {
        console.error('Failed to import URL:', item.shortUrl, err);
      }
    }

    return reply.send(ok({ count: importedCount }, `Successfully imported ${importedCount} URLs`));
  });

  /**
   * GET /backup/users - Export Users (ADMIN ONLY)
   */
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    if (!isAdmin(user)) {
      return reply.status(403).send(fail('Forbidden: Admin access required'));
    }

    const users = await prisma.user.findMany();
    return reply.send(ok(users, 'Users exported successfully'));
  });

  /**
   * POST /backup/users - Import Users (ADMIN ONLY)
   */
  app.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    if (!isAdmin(user)) {
      return reply.status(403).send(fail('Forbidden: Admin access required'));
    }

    const { data } = request.body as { data: any[] };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let importedCount = 0;
    for (const item of data) {
      try {
        await prisma.user.upsert({
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
      } catch (err) {
        console.error('Failed to import user:', item.email, err);
      }
    }

    return reply.send(ok({ count: importedCount }, `Successfully imported ${importedCount} users`));
  });

  /**
   * GET /backup/settings - Export Settings (ADMIN ONLY)
   */
  app.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    if (!isAdmin(user)) {
      return reply.status(403).send(fail('Forbidden: Admin access required'));
    }

    const settings = await prisma.urRedirectSet.findMany();
    return reply.send(ok(settings, 'Settings exported successfully'));
  });

  /**
   * POST /backup/settings - Import Settings (ADMIN ONLY)
   */
  app.post('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    if (!isAdmin(user)) {
      return reply.status(403).send(fail('Forbidden: Admin access required'));
    }

    const { data } = request.body as { data: any[] };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let importedCount = 0;
    for (const item of data) {
      if (!item.key) continue;

      try {
        await prisma.urRedirectSet.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: { key: item.key, value: String(item.value) },
        });
        importedCount++;
      } catch (err) {
        console.error('Failed to import setting:', item.key, err);
      }
    }

    return reply.send(ok({ count: importedCount }, `Successfully imported ${importedCount} settings`));
  });
}
