import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';
import { ok, fail } from '../helpers/response.helper';

export async function backupRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/urls', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    let urls;
    if (user.role === 'ADMIN') {
      urls = await prisma.url8.findMany();
    } else {
      urls = await prisma.url8.findMany({ where: { userId: user.userId } });
    }
    return reply.send(ok(urls, 'URLs exported successfully'));
  });

  app.post('/urls', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { data, strategy = 'upsert', invalidUserAction = 'skip' } = request.body as {
      data: any[];
      strategy: 'replace' | 'insert_unique' | 'upsert';
      invalidUserAction: string;
    };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    if (strategy === 'replace') {
      if (user.role === 'ADMIN') {
        await prisma.url8.deleteMany();
      } else {
        await prisma.url8.deleteMany({ where: { userId: user.userId } });
      }
    }

    // cache users to validate userId
    const validUsers = await prisma.user.findMany({ select: { id: true, email: true, username: true } });
    const validUserIds = new Set(validUsers.map(u => u.id));

    for (const item of data) {
      if (!item.shortUrl) {
        skipped++;
        continue;
      }
      try {
        let targetUserId = user.role === 'ADMIN' ? (item.userId || user.userId) : user.userId;

        if (user.role === 'ADMIN' && targetUserId !== null && !validUserIds.has(targetUserId)) {
          if (invalidUserAction === 'skip') {
            skipped++;
            continue;
          } else if (invalidUserAction === 'assign_to_me') {
            targetUserId = user.userId;
          } else if (invalidUserAction === 'create_inactive') {
            const newUser = await prisma.user.create({
              data: {
                username: `restored_user_\${targetUserId}_\${Date.now()}`,
                email: `restored_\${targetUserId}_\${Date.now()}@example.com`,
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
          expDate: item.expDate ? new Date(item.expDate) : null,
          userId: targetUserId,
        };

        const existing = await prisma.url8.findUnique({ where: { shortUrl: item.shortUrl } });

        if (strategy === 'insert_unique' || strategy === 'replace') {
          if (!existing) {
            await prisma.url8.create({ data: urlData });
            inserted++;
          } else {
            skipped++;
          }
        } else if (strategy === 'upsert') {
          if (existing) {
            await prisma.url8.update({ where: { shortUrl: item.shortUrl }, data: urlData });
            updated++;
          } else {
            await prisma.url8.create({ data: urlData });
            inserted++;
          }
        }
      } catch (err) {
        console.error('Failed to import URL:', item.shortUrl, err);
        skipped++;
      }
    }

    return reply.send(ok({ total: data.length, inserted, updated, skipped }, `Successfully restored URLs`));
  });

  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send(fail('Forbidden: Admin access required'));
    }
  };

  app.get('/users', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany();
    return reply.send(ok(users, 'Users exported successfully'));
  });

  app.post('/users', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, strategy = 'upsert' } = request.body as {
      data: any[];
      strategy: 'replace' | 'insert_unique' | 'upsert';
    };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    if (strategy === 'replace') {
      await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
    }

    for (const item of data) {
      if (!item.email || !item.username) {
        skipped++;
        continue;
      }
      try {
        const userData = {
          username: item.username,
          email: item.email,
          password: item.password,
          role: item.role,
          isActive: item.isActive !== undefined ? item.isActive : true,
        };

        const existing = await prisma.user.findUnique({ where: { email: item.email } });

        if (strategy === 'insert_unique' || strategy === 'replace') {
          if (!existing) {
            await prisma.user.create({ data: userData });
            inserted++;
          } else {
            skipped++;
          }
        } else if (strategy === 'upsert') {
          if (existing) {
            await prisma.user.update({ where: { email: item.email }, data: userData });
            updated++;
          } else {
            await prisma.user.create({ data: userData });
            inserted++;
          }
        }
      } catch (err) {
        console.error('Failed to import user:', item.email, err);
        skipped++;
      }
    }

    return reply.send(ok({ total: data.length, inserted, updated, skipped }, `Successfully restored users`));
  });

  app.get('/settings', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const settings = await prisma.urRedirectSet.findMany();
    return reply.send(ok(settings, 'Settings exported successfully'));
  });

  app.post('/settings', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, strategy = 'upsert' } = request.body as {
      data: any[];
      strategy: 'replace' | 'insert_unique' | 'upsert';
    };

    if (!Array.isArray(data)) {
      return reply.status(400).send(fail('Invalid data format. Expected an array.'));
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    if (strategy === 'replace') {
      await prisma.urRedirectSet.deleteMany();
    }

    for (const item of data) {
      if (!item.key) {
        skipped++;
        continue;
      }
      try {
        const existing = await prisma.urRedirectSet.findUnique({ where: { key: item.key } });

        if (strategy === 'insert_unique' || strategy === 'replace') {
          if (!existing) {
            await prisma.urRedirectSet.create({ data: { key: item.key, value: String(item.value) } });
            inserted++;
          } else {
            skipped++;
          }
        } else if (strategy === 'upsert') {
          if (existing) {
            await prisma.urRedirectSet.update({ where: { key: item.key }, data: { value: String(item.value) } });
            updated++;
          } else {
            await prisma.urRedirectSet.create({ data: { key: item.key, value: String(item.value) } });
            inserted++;
          }
        }
      } catch (err) {
        console.error('Failed to import setting:', item.key, err);
        skipped++;
      }
    }

    return reply.send(ok({ total: data.length, inserted, updated, skipped }, `Successfully restored settings`));
  });
}
