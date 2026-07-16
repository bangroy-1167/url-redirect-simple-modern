# modernURL8 - URL Redirection Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node.js-20+-green)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue)
![Fastify](https://img.shields.io/badge/fastify-4.0-orange)

Sistem manajemen URL redirection modern, ringan, dan aman yang mendukung redirect ke berbagai jenis link termasuk Google Drive dan layanan cloud storage lainnya.

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **URL Shortening** | Custom alias atau auto-generate short URL |
| **Google Drive Ready** | ✅ Redirect handal ke Google Drive (tanpa masalah POST) |
| **Multi-user** | Role Admin dan User dengan akses terkontrol |
| **Password Protection** | Lindungi URL dengan password |
| **Expiration** | Set expiry date untuk link temporer |
| **QR Code** | Generate QR code untuk setiap short URL |
| **Analytics** | Track clicks, geographic, device, referrer |
| **Bulk Operations** | Import/export CSV/JSON |
| **API-first** | Full REST API untuk programmatic access |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- npm atau yarn

### 1. Clone & Install

```bash
# Clone repository
git clone <repo-url> app2-urlref
cd app2-urlref/backend

# Install dependencies
yarn install

# Install frontend dependencies
cd client && yarn install && cd ..
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env
```

### 3. Setup Database

```bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations
yarn prisma:migrate

# Seed database (migrate legacy data + create admin)
yarn prisma:seed
```

### 4. Run Development Server

```bash
# Start backend + frontend concurrently
yarn dev

# Atau单独启动
yarn dev:backend  # Backend only di port 8002
yarn dev:frontend # Frontend only di port 5173
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8002/api8url
- **Admin Panel**: http://localhost:5173/kelola

### Default Credentials

```
Admin Login:
- Username: admin
- Email: admin@url8.local
- Password: admin123

⚠️ Ganti password default setelah login pertama!
```

---

## 📁 Project Structure

```
app2-urlref/
├── backend/                    # Merged: API + Frontend
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/        # Auth, validation, rate-limit
│   │   ├── helpers/           # Utilities
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Entry point
│   ├── client/                # React SPA
│   │   ├── src/
│   │   │   ├── api/          # Axios API client
│   │   │   ├── components/   # UI components
│   │   │   ├── pages/        # Page components
│   │   │   ├── hooks/        # React Query hooks
│   │   │   └── App.tsx       # Main app
│   │   └── package.json
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts            # Seed data
│   ├── public/                 # Built frontend (production)
│   ├── uploads/               # File uploads (QR codes)
│   ├── package.json
│   ├── tsconfig.json
│   └── ecosystem.config.js    # PM2 config
├── old/                       # Backup kode PHP lama
├── prd-urlredirector.md       # Product Requirements
└── README.md                  # This file
```

---

## 🔌 API Documentation

### Base URL

```
Production: https://url.thinking.my.id/api8url
Development: http://localhost:8002/api8url
```

### Authentication

```bash
# Login
curl -X POST https://url.thinking.my.id/api8url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@url8.local","password":"admin123"}'

# Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@url8.local",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Public Endpoints

```bash
# Redirect (GET-only - works with Google Drive!)
curl -I https://url.thinking.my.id/api8url/abc123
# HTTP/2 302 → Location: https://drive.google.com/...

# QR Code
curl -O https://url.thinking.my.id/api8url/abc123+qr

# Public Info
curl https://url.thinking.my.id/api8url/abc123/info
```

### URL Management

```bash
# Create URL (Auth required)
curl -X POST https://url.thinking.my.id/api8url/urls \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://drive.google.com/file/d/XXX/view",
    "shortUrl": "my-drive-link",
    "title": "Dokumen Penting",
    "expiresAt": "2026-12-31T23:59:59Z"
  }'

# List URLs
curl https://url.thinking.my.id/api8url/urls \
  -H "Authorization: Bearer <token>"

# Update URL
curl -X PUT https://url.thinking.my.id/api8url/urls/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete URL
curl -X DELETE https://url.thinking.my.id/api8url/urls/1 \
  -H "Authorization: Bearer <token>"
```

### Analytics

```bash
# URL Analytics
curl https://url.thinking.my.id/api8url/urls/1/analytics \
  -H "Authorization: Bearer <token>"

# Dashboard Overview
curl https://url.thinking.my.id/api8url/analytics/overview \
  -H "Authorization: Bearer <token>"
```

### Admin Endpoints

```bash
# List All URLs
curl https://url.thinking.my.id/api8url/admin/urls \
  -H "Authorization: Bearer <token>"

# User Management
curl https://url.thinking.my.id/api8url/admin/users \
  -H "Authorization: Bearer <token>"

# Global Stats
curl https://url.thinking.my.id/api8url/admin/stats \
  -H "Authorization: Bearer <token>"
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT + Refresh Token |
| Password Hashing | bcrypt (cost 12) |
| Rate Limiting | 100 req/min (auth), 20 req/min (public) |
| Input Validation | Zod schemas |
| SQL Injection | Prisma ORM |
| CORS | Domain whitelist |
| Security Headers | CSP, HSTS, X-Frame-Options |

---

## 🗄️ Database Schema

### Tables

1. **url8** - Main URL table (legacy compatible)
2. **users** - User accounts
3. **user_sessions** - JWT refresh tokens
4. **url_hits** - Analytics hit logs

### Legacy Migration

Data dari tabel `url8` lama akan otomatis di-migrate saat seed:
- Short URLs yang ada dipertahankan
- Password di-hash ulang dengan bcrypt
- Hit counter dipertahankan
- Expiration date dipertahankan

---

## 🚢 Deployment

### PM2 (Recommended)

```bash
# Build
yarn build

# Start with PM2
pm2 start ecosystem.config.js

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### Cloudflare Tunnel

```yaml
# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: url.thinking.my.id
    service: http://localhost:8002
  - service: http_status:404
```

### Environment Variables

```env
NODE_ENV=production
PORT=8002
API_PREFIX=/api8url

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=thin1722_urlsRF
DATABASE_USER=thin1722_rf_urls
DATABASE_PASSWORD=<your-password>

JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RATE_LIMIT_PUBLIC=20
RATE_LIMIT_AUTH=100

CORS_ORIGINS=https://url.thinking.my.id
```

---

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# E2E tests
yarn test:e2e
```

---

## 📈 Known Issues & Solutions

### Google Drive Redirect Problem

**Problem**: Google Drive tidak menerima POST redirect dari browser.

**Solution**: modernURL8 menggunakan GET redirect (HTTP 302) yang kompatibel dengan Google Drive.

```typescript
// ✅ Working: GET redirect
return res.redirect(302, url.targetUrl);

// ❌ Not working: POST redirect
<form method="POST" action="<?= $targetUrl ?>">
```

---

## 🛠️ Development Commands

```bash
# Development
yarn dev              # Start all (backend + frontend)
yarn dev:backend      # Backend only
yarn dev:frontend     # Frontend only

# Build
yarn build            # Build all
yarn build:backend    # Backend only
yarn build:frontend   # Frontend only

# Database
yarn prisma:generate  # Generate Prisma client
yarn prisma:migrate   # Run migrations
yarn prisma:seed      # Seed data
yarn prisma:studio    # Prisma GUI

# Code Quality
yarn lint             # Run ESLint
yarn lint:fix         # Fix ESLint issues
yarn typecheck        # TypeScript check

# Production
yarn start            # Start production server
pm2 restart modernurl8
pm2 logs modernurl8
```

---

## 📝 License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

---

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 📧 Support

Untuk bantuan atau pertanyaan:
- Buat issue di repository ini
- Email: support@thinking.my.id

---

## 🙏 Credits

- Original app: app2-urlref (PHP legacy)
- Reference app: app1-mnst (Fastify + React)
- Built dengan ❤️ untuk komunitas

---

**Version**: 1.0.0  
**Last Updated**: 2026-07-16  
**Status**: Ready for Development
