/**
 * routes/public.routes.ts
 *
 * Public routes - no authentication required.
 * Handles URL redirect (GET only - Google Drive compatible).
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import QRCode from 'qrcode';
import prisma from '../config/database';

interface RedirectParams {
  shortUrl: string;
}

interface InfoParams {
  shortUrl: string;
}

export async function publicRoutes(app: FastifyInstance) {
  
  /**
   * GET /:shortUrl - Redirect to target URL
   * CRITICAL: Uses GET redirect only - works with Google Drive!
   */
  app.get<{ Params: RedirectParams }>(
    '/:shortUrl',
    { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } },
    async (request: FastifyRequest<{ Params: RedirectParams }>, reply: FastifyReply) => {
      const { shortUrl } = request.params;
      
      // Handle QR code request
      if (shortUrl.endsWith('+qr')) {
        const actualShortUrl = shortUrl.replace('+qr', '');
        const qrUrl = `${request.protocol}://${request.hostname}/api8url/${actualShortUrl}`;
        
        try {
          const qrImage = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });
          return reply.header('Content-Type', 'image/png').send(Buffer.from(qrImage.split(',')[1], 'base64'));
        } catch (err) {
          return reply.status(500).send({ success: false, message: 'Failed to generate QR code' });
        }
      }
      
      // Find URL in database
      const url = await prisma.url8.findUnique({
        where: { shortUrl },
      });
      
      if (!url || !url.isActive) {
        return reply.status(404).send({
          success: false,
          message: 'URL not found',
        });
      }
      
      // Check expiration
      if (url.expDate && new Date(url.expDate) < new Date()) {
        return reply.status(410).send({
          success: false,
          message: 'URL has expired',
        });
      }
      
      // Check password protection
      if (url.password) {
        const providedPassword = request.query.pwd as string || request.headers['x-url-password'] as string;
        if (!providedPassword) {
          return reply.status(401).send({
            success: false,
            message: 'Password required',
            passwordProtected: true,
          });
        }
        // Note: In production, compare bcrypt hashes
        // For now, simple comparison (will be enhanced)
        if (providedPassword !== url.password) {
          return reply.status(401).send({
            success: false,
            message: 'Invalid password',
            passwordProtected: true,
          });
        }
      }
      
      // Increment hit counter
      await prisma.url8.update({
        where: { id: url.id },
        data: { hitCounter: { increment: 1 } },
      });
      
      // Log hit for analytics
      try {
        await prisma.urlHit.create({
          data: {
            urlId: url.id,
            shortUrl: url.shortUrl,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] || null,
            referer: request.headers['referer'] || null,
          },
        });
      } catch (err) {
        // Don't fail redirect if analytics logging fails
        console.error('Failed to log hit:', err);
      }
      
      // Redirect with 302 (Temporary Redirect) - works with Google Drive
      return reply.redirect(302, url.targetUrl);
    }
  );
  
  /**
   * GET /:shortUrl/info - Get public URL info
   */
  app.get<{ Params: InfoParams }>(
    '/:shortUrl/info',
    { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } },
    async (request: FastifyRequest<{ Params: InfoParams }>, reply: FastifyReply) => {
      const { shortUrl } = request.params;
      
      const url = await prisma.url8.findUnique({
        where: { shortUrl },
        select: {
          id: true,
          shortUrl: true,
          title: true,
          keterangan: true,
          hitCounter: true,
          expDate: true,
          isActive: true,
          createdAt: true,
        },
      });
      
      if (!url) {
        return reply.status(404).send({
          success: false,
          message: 'URL not found',
        });
      }
      
      const isExpired = url.expDate ? new Date(url.expDate) < new Date() : false;
      
      return reply.send({
        success: true,
        data: {
          ...url,
          isExpired,
          isAvailable: url.isActive && !isExpired,
        },
      });
    }
  );
}
