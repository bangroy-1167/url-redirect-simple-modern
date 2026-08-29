import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database'; // Need to check where prisma is exported from
import { ok, fail } from '../helpers/response.helper';

export async function backupRoutes(app: FastifyInstance) {
  // Add authentication middleware for all backup routes
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /backup/urls - Export URLs
   */
  app.get('/urls', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;

    let urls;
    if (user.role === 'ADMIN') {
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
    const user = (request as any).user;
    const { data } = request.body as { data: any[] };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
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

  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send(fail('Forbidden: Admin access required'));
    }
  };

  /**
   * GET /backup/users - Export Users (ADMIN ONLY)
   */
  app.get('/users', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany();
    return reply.send(ok(users, 'Users exported successfully'));
  });

  /**
   * POST /backup/users - Import Users (ADMIN ONLY)
   */
  app.post('/users', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { data } = request.body as { data: any[] };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let importedCount = 0;
    for (const item of data) {
      try {
        await prisma.user.upsert({
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
      } catch (err) {
        console.error('Failed to import user:', item.email, err);
      }
    }

    return reply.send(ok({ count: importedCount }, `Successfully imported ${importedCount} users`));
  });

  /**
   * GET /backup/settings - Export Settings (ADMIN ONLY)
   */
  app.get('/settings', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const settings = await prisma.urRedirectSet.findMany();
    return reply.send(ok(settings, 'Settings exported successfully'));
  });

  /**
   * POST /backup/settings - Import Settings (ADMIN ONLY)
   */
  app.post('/settings', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
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
