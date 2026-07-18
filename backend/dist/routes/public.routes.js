"use strict";
/**
 * routes/public.routes.ts
 *
 * Public routes - no authentication required.
 * Handles URL redirect (GET only - Google Drive compatible).
 * Clean URLs without /api8url/ prefix.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoutes = publicRoutes;
const qrcode_1 = __importDefault(require("qrcode"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const API_PREFIX = process.env.API_PREFIX || '/api8url';
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
async function getSetting(key, fallback) {
    try {
        const setting = await database_1.default.urRedirectSet.findUnique({ where: { key } });
        return setting?.value || fallback;
    }
    catch {
        return fallback;
    }
}
// Helper to render HTML page
function renderHtml(title, message, buttonText, buttonUrl) {
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
// Helper function to mask password keywords in description
function maskPasswordKeywords(text) {
    if (!text)
        return '';
    const passwordKeywords = [
        'password', 'passwd', 'pwd', 'pass', 'pw', 'pswd',
        'keyword', 'key', 'kunci', 'kata sandi', 'sandinya',
        'secret', 'token', 'access', 'code', 'pin'
    ];
    // Create regex pattern to find keyword (case insensitive)
    const pattern = new RegExp(`\\b(${passwordKeywords.join('|')})\\b`, 'gi');
    // Find the first occurrence of a password keyword
    const match = text.match(pattern);
    if (match) {
        // Find the position of the keyword
        const keywordIndex = text.toLowerCase().indexOf(match[0].toLowerCase());
        // Return text up to (but not including) the keyword
        return text.substring(0, keywordIndex).trim();
    }
    // No password keyword found, return full text
    return text;
}
// Helper to render HTML page with OG meta tags for URL sharing
function renderHtmlWithOg(ogUrl, ogTitle, ogDescription, appName, appSubtitle) {
    const fullOgTitle = ogTitle ? `${ogTitle} | ${appName}` : appName;
    const fullOgDescription = ogDescription ? `${ogDescription}` : appSubtitle;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Social Media Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:title" content="${fullOgTitle}">
  <meta property="og:description" content="${fullOgDescription}">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${ogUrl}">
  <meta name="twitter:title" content="${fullOgTitle}">
  <meta name="twitter:description" content="${fullOgDescription}">
  
  <title>${fullOgTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
  <div class="max-w-lg w-full">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-4">URL Ditemukan!</h1>
      <p class="text-lg text-gray-600 mb-2">Tautan ditemukan dan siap diakses.</p>
      <p class="text-sm text-gray-500">Anda akan dialihkan dalam beberapa detik...</p>
    </div>
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="mb-4">
        <span class="text-sm text-gray-500 block mb-1">URL Pendek</span>
        <code class="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-2 rounded block">${ogUrl}</code>
      </div>
      ${ogTitle ? `<div class="mb-4">
        <span class="text-sm text-gray-500 block mb-1">Judul</span>
        <p class="text-gray-900">${ogTitle}</p>
      </div>` : ''}
      ${ogDescription ? `<div class="mb-4">
        <span class="text-sm text-gray-500 block mb-1">Deskripsi</span>
        <p class="text-gray-900">${ogDescription}</p>
      </div>` : ''}
    </div>
    <div class="text-center text-sm text-gray-500">
      ${appSubtitle}
    </div>
  </div>
  <script>
    // Auto redirect after delay
    setTimeout(function() {
      window.location.href = "${ogUrl.replace('/f/', '/')}"; // Redirect to actual short URL for redirect
    }, 2000);
  </script>
</body>
</html>`;
}
async function publicRoutes(app) {
    /**
     * GET / - Welcome page (root URL)
     */
    app.get('/', async (request, reply) => {
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
    app.get('/:shortUrl', { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } }, async (request, reply) => {
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
                const qrImage = await qrcode_1.default.toDataURL(qrUrl, { width: 300, margin: 2 });
                return reply.header('Content-Type', 'image/png').send(Buffer.from(qrImage.split(',')[1], 'base64'));
            }
            catch (err) {
                return reply.status(500).send({ success: false, message: 'Failed to generate QR code' });
            }
        }
        // Find URL in database
        const url = await database_1.default.url8.findUnique({
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
        // Check password protection - redirect to SPA if password required
        if (url.password) {
            // Always redirect to SPA for password-protected URLs
            // The SPA will handle password challenge
            const baseUrl = `${request.protocol}://${request.hostname}`;
            return reply.redirect(302, `${baseUrl}/f/${shortUrl}`);
        }
        // Increment hit counter
        await database_1.default.url8.update({
            where: { id: url.id },
            data: { hitCounter: { increment: 1 } },
        });
        // Log hit for analytics
        try {
            await database_1.default.urlHit.create({
                data: {
                    urlId: url.id,
                    shortUrl: url.shortUrl,
                    ipAddress: request.ip,
                    userAgent: request.headers['user-agent'] || null,
                    referer: request.headers['referer'] || null,
                },
            });
        }
        catch (err) {
            console.error('Failed to log hit:', err);
        }
        // REDIRECT to URL Found page instead of direct redirect
        // This allows user to see info before being redirected
        const baseUrl = `${request.protocol}://${request.hostname}`;
        return reply.redirect(302, `${baseUrl}/f/${shortUrl}`);
    });
    /**
     * GET /f/:shortUrl - Serve SPA with OG meta tags for social sharing
     * Returns HTML with Open Graph meta tags for proper social media preview
     */
    app.get('/f/:shortUrl', async (request, reply) => {
        const { shortUrl } = request.params;
        const baseUrl = `${request.protocol}://${request.hostname}`;
        const fullShortUrl = `${baseUrl}/${shortUrl.replace('f/', '')}`;
        // Fetch URL info from database
        const url = await database_1.default.url8.findUnique({
            where: { shortUrl: shortUrl.replace('f/', '') },
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
        // Get app settings
        const [appName, appSubtitle] = await Promise.all([
            getSetting('app_name', 'modernURL8'),
            getSetting('app_subtitle', 'URL Redirection Service'),
        ]);
        // If URL not found or inactive
        if (!url || !url.isActive) {
            return reply.type('text/html').send(renderHtml('URL Tidak Ditemukan', 'Tautan yang Anda cari tidak ditemukan atau telah dihapus.', 'Kembali ke Beranda', baseUrl));
        }
        // Check expiration
        if (url.expDate && new Date(url.expDate) < new Date()) {
            return reply.type('text/html').send(renderHtml('URL Kadaluarsa', 'Tautan yang Anda cari telah kadaluarsa.', 'Kembali ke Beranda', baseUrl));
        }
        // If password protected, serve SPA (SPA handles password challenge)
        if (url.password) {
            const indexPath = path_1.default.join(process.cwd(), 'public', 'index.html');
            if (fs_1.default.existsSync(indexPath)) {
                const html = fs_1.default.readFileSync(indexPath, 'utf-8');
                return reply.type('text/html').send(html);
            }
            return reply.status(404).send('Not found');
        }
        // Generate OG meta tags
        const ogTitle = url.title || url.keterangan || 'Tautan';
        const ogDescription = maskPasswordKeywords(url.description || url.keterangan || '');
        const finalOgDescription = ogDescription ? `${ogDescription} | ${appSubtitle}` : appSubtitle;
        // Serve HTML with OG meta tags
        const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Social Media Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${fullShortUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${finalOgDescription}">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullShortUrl}">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${finalOgDescription}">
  
  <title>${ogTitle} | ${appName}</title>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      max-width: 32rem;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 5rem;
      height: 5rem;
      background: #d1fae5;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .icon svg {
      width: 2.5rem;
      height: 2.5rem;
      color: #059669;
    }
    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .url-box {
      background: #f3f4f6;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .url-label {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 0.25rem;
    }
    .url-value {
      font-family: ui-monospace, monospace;
      color: #4f46e5;
      font-weight: 500;
      word-break: break-all;
    }
    .description {
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .footer {
      color: #9ca3af;
      font-size: 0.75rem;
    }
    .auto-redirect {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 1rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #4f46e5;
      color: white;
      border-radius: 0.5rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }
    .btn-secondary:hover {
      background: #d1d5db;
    }
    .buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
    </div>
    
    <h1>Tautan Ditemukan!</h1>
    <p class="subtitle">Anda akan dialihkan dalam beberapa detik...</p>
    
    <div class="url-box">
      <div class="url-label">URL Pendek</div>
      <div class="url-value">${fullShortUrl}</div>
    </div>
    
    ${url.title || url.keterangan ? `
    <div class="description">
      <strong>Judul:</strong> ${url.title || url.keterangan}
    </div>
    ` : ''}
    
    <div class="buttons">
      <a href="${url.targetUrl}" class="btn">
        Buka Tautan
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
      <a href="${baseUrl}" class="btn btn-secondary">Kembali</a>
    </div>
    
    <p class="footer">${appSubtitle}</p>
    
    <p class="auto-redirect">Mengalihkan otomatis...</p>
  </div>
  
  <script>
    // Auto redirect after delay
    setTimeout(function() {
      window.location.href = "${url.targetUrl}";
    }, 3000);
  </script>
</body>
</html>`;
        return reply.type('text/html').send(htmlContent);
    });
    /**
     * GET /api8url/f/:shortUrl - URL Found page info (for frontend redirect page)
     * Returns URL info as JSON
     */
    app.get(`${API_PREFIX}/f/:shortUrl`, { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } }, async (request, reply) => {
        const { shortUrl } = request.params;
        const url = await database_1.default.url8.findUnique({
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
        // Check if URL has password
        const hasPassword = !!url.password;
        // Remove password from response for security
        const { password: _, ...urlData } = url;
        return reply.send({
            success: true,
            data: {
                ...urlData,
                hasPassword,
                isExpired: false,
                isAvailable: true,
            },
        });
    });
    /**
     * POST /api8url/f/:shortUrl/verify - Verify password for protected URL
     */
    app.post(`${API_PREFIX}/f/:shortUrl/verify`, {
        schema: {
            params: { type: 'object', properties: { shortUrl: { type: 'string' } } },
            body: { type: 'object', properties: { password: { type: 'string' } }, required: ['password'] }
        }
    }, async (request, reply) => {
        const { shortUrl } = request.params;
        const { password } = request.body;
        console.log('[DEBUG verifyPassword] Request for shortUrl:', shortUrl);
        if (!password) {
            return reply.status(400).send({
                success: false,
                message: 'Password diperlukan',
            });
        }
        try {
            const url = await database_1.default.url8.findUnique({
                where: { shortUrl },
                select: {
                    id: true,
                    shortUrl: true,
                    password: true,
                    isActive: true,
                    expDate: true,
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
            if (!url.isActive || isExpired) {
                return reply.status(410).send({
                    success: false,
                    message: isExpired ? 'URL telah kadaluarsa' : 'URL tidak aktif',
                });
            }
            // Verify password using bcrypt
            if (url.password) {
                const isValid = await bcrypt_1.default.compare(password, url.password);
                if (!isValid) {
                    console.log('[DEBUG verifyPassword] Password invalid for:', shortUrl);
                    return reply.status(401).send({
                        success: false,
                        message: 'Password salah',
                    });
                }
            }
            else {
                // No password set, but API called - treat as invalid
                return reply.status(401).send({
                    success: false,
                    message: 'URL tidak memerlukan password',
                });
            }
            console.log('[DEBUG verifyPassword] Password verified for:', shortUrl);
            return reply.send({
                success: true,
                message: 'Password valid',
            });
        }
        catch (error) {
            console.error('[DEBUG verifyPassword] Error:', error);
            return reply.status(500).send({
                success: false,
                message: 'Gagal memverifikasi password',
            });
        }
    });
    /**
     * GET /settings - Get public settings (no auth required)
     */
    app.get('/settings', async (request, reply) => {
        try {
            const settings = await database_1.default.urRedirectSet.findMany();
            const settingsMap = {};
            settings.forEach(s => {
                settingsMap[s.key] = s.value;
            });
            return reply.send({
                success: true,
                data: {
                    appName: settingsMap['app_name'] || 'modernURL8',
                    appSubtitle: settingsMap['app_subtitle'] || 'URL Redirection Service',
                    autoRedirect: settingsMap['auto_redirect'] !== 'false',
                    autoRedirectDelay: parseInt(settingsMap['auto_redirect_delay'] || '7', 10),
                    rateLimitPublic: parseInt(settingsMap['rate_limit_public'] || '50', 10),
                },
            });
        }
        catch (error) {
            return reply.status(500).send({
                success: false,
                message: 'Failed to load settings',
            });
        }
    });
    /**
     * GET /:shortUrl/info - Get public URL info
     */
    app.get('/:shortUrl/info', { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } }, async (request, reply) => {
        const { shortUrl } = request.params;
        const url = await database_1.default.url8.findUnique({
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
    });
}
//# sourceMappingURL=public.routes.js.map