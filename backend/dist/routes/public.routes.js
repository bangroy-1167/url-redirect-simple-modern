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
// User agent parsing helper
function parseUserAgent(userAgent) {
    const ua = userAgent.toLowerCase();
    // Detect device type (Prisma enum uses uppercase)
    let deviceType = 'DESKTOP';
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
        if (/tablet|ipad/i.test(ua)) {
            deviceType = 'TABLET';
        }
        else {
            deviceType = 'MOBILE';
        }
    }
    // Detect browser
    let browser = 'Unknown';
    if (/edg\/|edge/i.test(ua))
        browser = 'Edge';
    else if (/chrome\/|chromium/i.test(ua))
        browser = 'Chrome';
    else if (/safari/i.test(ua))
        browser = 'Safari';
    else if (/firefox/i.test(ua))
        browser = 'Firefox';
    else if (/opera|oprogen/i.test(ua))
        browser = 'Opera';
    else if (/msie|trident/i.test(ua))
        browser = 'Internet Explorer';
    // Detect OS
    let os = 'Unknown';
    if (/windows nt 10/i.test(ua))
        os = 'Windows 10';
    else if (/windows nt 11/i.test(ua))
        os = 'Windows 11';
    else if (/windows nt/i.test(ua))
        os = 'Windows';
    else if (/mac os x/i.test(ua))
        os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(ua))
        os = 'iOS';
    else if (/android/i.test(ua))
        os = 'Android';
    else if (/linux/i.test(ua))
        os = 'Linux';
    return { deviceType, browser, os };
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
async function getSetting(key, fallback) {
    try {
        const setting = await database_1.default.urRedirectSet.findUnique({ where: { key } });
        return setting?.value || fallback;
    }
    catch {
        return fallback;
    }
}
// Helper to render HTML page with app branding
function renderHtml(title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion) {
    const button = buttonText && buttonUrl
        ? `<a href="${buttonUrl}" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">${buttonText}</a>`
        : '';
    const branding = appName || 'modernURL8';
    const subtitle = appSubtitle || 'URL Redirection Service';
    const version = appVersion || 'v.2.09';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
  <!-- App Header -->
  <header class="bg-white/80 backdrop-blur-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-bold text-gray-900 leading-tight">${branding}</span>
            <span class="text-xs text-gray-500 leading-tight hidden sm:block">${subtitle}</span>
          </div>
        </div>
        <span class="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full border border-gray-200">${version}</span>
      </div>
    </div>
  </header>
  
  <!-- Main Content -->
  <div class="flex-1 flex items-center justify-center p-4">
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
        const [title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion] = await Promise.all([
            getSetting('welcome_title', DEFAULT_MESSAGES.welcomeTitle),
            getSetting('welcome_message', DEFAULT_MESSAGES.welcomeMessage),
            getSetting('welcome_button_text', DEFAULT_MESSAGES.welcomeButtonText),
            getSetting('welcome_home_url', DEFAULT_MESSAGES.welcomeHomeUrl),
            getSetting('app_name', 'modernURL8'),
            getSetting('app_subtitle', 'URL Redirection Service'),
            getSetting('app_version', 'v.2.09'),
        ]);
        return reply.type('text/html').send(renderHtml(title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion));
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
            const [title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion] = await Promise.all([
                getSetting('notfound_title', DEFAULT_MESSAGES.notFoundTitle),
                getSetting('notfound_message', DEFAULT_MESSAGES.notFoundMessage),
                getSetting('notfound_button_text', DEFAULT_MESSAGES.notFoundButtonText),
                getSetting('notfound_home_url', DEFAULT_MESSAGES.welcomeHomeUrl),
                getSetting('app_name', 'modernURL8'),
                getSetting('app_subtitle', 'URL Redirection Service'),
                getSetting('app_version', 'v.2.09'),
            ]);
            return reply.status(404).type('text/html').send(renderHtml(title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion));
        }
        // Check expiration
        if (url.expDate && new Date(url.expDate) < new Date()) {
            const [title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion] = await Promise.all([
                getSetting('expired_title', DEFAULT_MESSAGES.expiredTitle),
                getSetting('expired_message', DEFAULT_MESSAGES.expiredMessage),
                getSetting('expired_button_text', DEFAULT_MESSAGES.notFoundButtonText),
                getSetting('expired_home_url', DEFAULT_MESSAGES.welcomeHomeUrl),
                getSetting('app_name', 'modernURL8'),
                getSetting('app_subtitle', 'URL Redirection Service'),
                getSetting('app_version', 'v.2.09'),
            ]);
            return reply.status(410).type('text/html').send(renderHtml(title, message, buttonText, buttonUrl, appName, appSubtitle, appVersion));
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
        // Log hit for analytics with enriched data
        try {
            const userAgent = request.headers['user-agent'] || '';
            const { deviceType, browser, os } = parseUserAgent(userAgent);
            await database_1.default.urlHit.create({
                data: {
                    urlId: url.id,
                    shortUrl: url.shortUrl,
                    ipAddress: request.ip,
                    userAgent: userAgent || null,
                    referer: request.headers['referer'] || null,
                    deviceType,
                    browser,
                    os,
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
        const [appName, appSubtitle, appVersion] = await Promise.all([
            getSetting('app_name', 'modernURL8'),
            getSetting('app_subtitle', 'URL Redirection Service'),
            getSetting('app_version', 'v.2.09'),
        ]);
        // If URL not found or inactive
        if (!url || !url.isActive) {
            return reply.type('text/html').send(renderHtml('URL Tidak Ditemukan', 'Tautan yang Anda cari tidak ditemukan atau telah dihapus.', 'Kembali ke Beranda', baseUrl, appName, appSubtitle, appVersion));
        }
        // Check expiration
        if (url.expDate && new Date(url.expDate) < new Date()) {
            return reply.type('text/html').send(renderHtml('URL Kadaluarsa', 'Tautan yang Anda cari telah kadaluarsa.', 'Kembali ke Beranda', baseUrl, appName, appSubtitle, appVersion));
        }
        // ALWAYS serve SPA for /f/:shortUrl - SPA handles settings and countdown
        const indexPath = path_1.default.join(process.cwd(), 'public', 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            const html = fs_1.default.readFileSync(indexPath, 'utf-8');
            return reply.type('text/html').send(html);
        }
        return reply.status(404).send('Not found');
    });
    /**
     * GET /api8url/f/:shortUrl - URL Found page info (for frontend redirect page)
     * Returns URL info as JSON
     */
    app.get(`${API_PREFIX}/f/:shortUrl`, { schema: { params: { type: 'object', properties: { shortUrl: { type: 'string' } } } } }, async (request, reply) => {
        const { shortUrl } = request.params;
        const url = await database_1.default.url8.findUnique({
            where: { shortUrl },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        language: true,
                    },
                },
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
        // Get default language from settings
        const defaultLanguage = await getSetting('default_language', 'id');
        return reply.send({
            success: true,
            data: {
                ...urlData,
                hasPassword,
                isExpired: false,
                isAvailable: true,
                // Include owner's language preference, fallback to app default
                ownerLanguage: url.user?.language || defaultLanguage,
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
                    appVersion: settingsMap['app_version'] || 'v.2.09',
                    defaultLanguage: settingsMap['default_language'] || 'id',
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