/**
 * routes/public.routes.ts
 *
 * Public routes - no authentication required.
 * Handles URL redirect (GET only - Google Drive compatible).
 * Clean URLs without /api8url/ prefix.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import QRCode from 'qrcode';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

const API_PREFIX = process.env.API_PREFIX || '/api8url';

interface RedirectParams {
  shortUrl: string;
}

interface InfoParams {
  shortUrl: string;
}

// Default messages (fallback if not in database)
const DEFAULT_MESSAGES = {
  welcomeTitle: 'Welcome to modernURL8',
  welcomeMessage: 'This is a URL redirection service. Please use a valid short URL to be redirected.',
  welcomeButtonText: 'Go to Homepage',
  welcomeHomeUrl: '/',
  notFoundTitle: 'Link Not Found',
  notFoundMessage: 'The short URL you entered does not exist or has been removed. Please check the URL and try again.',
  notFoundButtonText: 'Go to Homepage',
  expiredTitle: 'Link Expired',
  expiredMessage: 'This short URL has expired and is no longer available.',
};

// Helper to get setting from database
async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const setting = await prisma.urRedirectSet.findUnique({ where: { key } });
    return setting?.value || fallback;
  } catch {
    return fallback;
  }
}

// Helper to render HTML page
function renderHtml(title: string, message: string, buttonText?: string, buttonUrl?: string): string {
  const button = buttonText && buttonUrl
    ? `<a href="${buttonUrl}" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">${buttonText}</a>`
    : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
        <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-4">${title}</h1>
      <p class="text-lg text-gray-600 mb-8">${message}</p>
      ${button}
    </div>
    <div class="text-center text-sm text-gray-400">
      modernURL8 - URL Redirection Service
    </div>
  </div>
</body>
</html>`;
}

export async function publicRoutes(app: FastifyInstance) {
  
  /**
   * GET / - Welcome page (root URL)
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const [title, message, buttonText, buttonUrl] = await Promise.all([
      getSetting('welcome_title', DEFAULT_MESSAGES.welcomeTitle),
      getSetting('welcome_message', DEFAULT_MESSAGES.welcomeMessage),
      getSetting('welcome_button_text', DEFAULT_MESSAGES.welcomeButtonText),
      getSetting('welcome_home_url', DEFAULT_MESSAGES.welcomeHomeUrl),
    ]);
    
    return reply.type('text/html').send(renderHtml(title, message, buttonText, buttonUrl));
  });

  /**
   * GET /:shortUrl - Show URL Found page, then redirect
   * This shows a preview page before redirecting
   */
  app.get<{ Params: RedirectParams }>(
    '/:shortUrl',
    { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } },
    async (request: FastifyRequest<{ Params: RedirectParams }>, reply: FastifyReply) => {
      const { shortUrl } = request.params;
      
      // Skip if it's an API route pattern
      if (shortUrl.startsWith('api') || shortUrl.startsWith('auth') || shortUrl.startsWith('kelola') || shortUrl.startsWith('f/')) {
        return reply.status(404).send({ success: false, message: 'Not found' });
      }
      
      // Handle QR code request
      if (shortUrl.endsWith('+qr')) {
        const actualShortUrl = shortUrl.replace('+qr', '');
        const qrUrl = `${request.protocol}://${request.hostname}/${actualShortUrl}`;
        
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
      
      // URL not found - show friendly page
      if (!url || !url.isActive) {
        const [title, message, buttonText, buttonUrl] = await Promise.all([
          getSetting('notfound_title', DEFAULT_MESSAGES.notFoundTitle),
          getSetting('notfound_message', DEFAULT_MESSAGES.notFoundMessage),
          getSetting('notfound_button_text', DEFAULT_MESSAGES.notFoundButtonText),
          getSetting('notfound_home_url', DEFAULT_MESSAGES.welcomeHomeUrl),
        ]);
        
        return reply.status(404).type('text/html').send(renderHtml(title, message, buttonText, buttonUrl));
      }
      
      // Check expiration
      if (url.expDate && new Date(url.expDate) < new Date()) {
        const [title, message, buttonText, buttonUrl] = await Promise.all([
          getSetting('expired_title', DEFAULT_MESSAGES.expiredTitle),
          getSetting('expired_message', DEFAULT_MESSAGES.expiredMessage),
          getSetting('expired_button_text', DEFAULT_MESSAGES.notFoundButtonText),
          getSetting('expired_home_url', DEFAULT_MESSAGES.welcomeHomeUrl),
        ]);
        
        return reply.status(410).type('text/html').send(renderHtml(title, message, buttonText, buttonUrl));
      }
      
      // Check password protection
      if (url.password) {
        const providedPassword = (request.query as { pwd?: string }).pwd || request.headers['x-url-password'] as string;
        if (!providedPassword) {
          return reply.status(401).send({
            success: false,
            message: 'Password required',
            passwordProtected: true,
          });
        }
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
        console.error('Failed to log hit:', err);
      }
      
      // REDIRECT to URL Found page instead of direct redirect
      // This allows user to see info before being redirected
      const baseUrl = `${request.protocol}://${request.hostname}`;
      return reply.redirect(302, `${baseUrl}/f/${shortUrl}`);
    }
  );
  
  /**
  /**
   * GET /f/:shortUrl - Serve SPA for URL Found page
   * This serves the React SPA so frontend can handle routing
   */
  app.get<{ Params: RedirectParams }>(
    '/f/:shortUrl',
    async (request: FastifyRequest<{ Params: RedirectParams }>, reply: FastifyReply) => {
      // Redirect to the SPA index - React Router will handle the route
      const indexPath = path.join(process.cwd(), 'public', 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf-8');
        return reply.type('text/html').send(html);
      }
      return reply.status(404).send('Not found');
    }
  );
  
  /**
   * GET /api8url/f/:shortUrl - URL Found page info (for frontend redirect page)
   * Returns URL info as JSON
   */
  app.get<{ Params: RedirectParams }>(
    `${API_PREFIX}/f/:shortUrl`,
    { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } },
    async (request: FastifyRequest<{ Params: RedirectParams }>, reply: FastifyReply) => {
      const { shortUrl } = request.params;
      
      const url = await prisma.url8.findUnique({
        where: { shortUrl },
        select: {
          id: true,
          shortUrl: true,
          targetUrl: true,
          title: true,
          keterangan: true,
          description: true,
          password: true,
          expDate: true,
          isActive: true,
        },
      });
      
      if (!url) {
        return reply.status(404).send({
          success: false,
          message: 'URL tidak ditemukan',
        });
      }
      
      // Check if URL is available
      const isExpired = url.expDate ? new Date(url.expDate) < new Date() : false;
      const isAvailable = url.isActive && !isExpired;
      
      if (!isAvailable) {
        return reply.status(410).send({
          success: false,
          message: isExpired ? 'URL telah kadaluarsa' : 'URL tidak aktif',
          data: {
            shortUrl: url.shortUrl,
            title: url.title,
            isExpired,
            isActive: url.isActive,
          },
        });
      }
      
      return reply.send({
        success: true,
        data: {
          id: url.id,
          shortUrl: url.shortUrl,
          targetUrl: url.targetUrl,
          title: url.title,
          keterangan: url.keterangan,
          description: url.description,
          isExpired: false,
          isAvailable: true,
        },
      });
    }
  );

  /**
   * GET /settings - Get public settings (no auth required)
   */
  app.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await prisma.urRedirectSet.findMany();
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });

      return reply.send({
        success: true,
        data: {
          appName: settingsMap['app_name'] || 'modernURL8',
          appSubtitle: settingsMap['app_subtitle'] || 'URL Redirection Service',
          autoRedirect: settingsMap['auto_redirect'] !== 'false',
          autoRedirectDelay: parseInt(settingsMap['auto_redirect_delay'] || '2', 10),
          rateLimitPublic: parseInt(settingsMap['rate_limit_public'] || '20', 10),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to load settings',
      });
    }
  });
  
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
          targetUrl: true,
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
