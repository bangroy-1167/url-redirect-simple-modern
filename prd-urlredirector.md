# PRD: modernURL8 - URL Redirection Management System

## 1. Overview & Vision

**modernURL8** adalah sistem manajemen URL redirection modern, ringan, dan aman yang mendukung redirect ke berbagai jenis link termasuk Google Drive, seperti Bitly. Aplikasi ini dirancang ulang dari versi PHP lama untuk memberikan pengalaman pengguna yang lebih baik, keamanan lebih tinggi, dan skalabilitas.

### Tujuan Utama
- ✅ Redirect URL yang handal ke Google Drive dan layanan lainnya
- ✅ Multi-user support dengan role Admin dan User
- ✅ Dashboard analytics untuk tracking link performance
- ✅ API-friendly untuk programmatic URL management

---

## 2. Technical Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify + TypeScript
- **ORM**: Prisma
- **Database**: MySQL (reuse database lama)
- **Auth**: JWT + Refresh Token
- **Validation**: Zod
- **QR Code**: `qrcode` package
- **Rate Limiting**: `@fastify/rate-limit`

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State**: React Query + Context
- **HTTP Client**: Axios

### Infrastructure
- **Runtime**: PM2 (Node.js cluster)
- **Domain**: `url.thinking.my.id`
- **Port**: Port VPS
- **API Prefix**: `/api8url`
- **Deployment**: Merged backend + frontend (single folder)

---

## 3. Database Schema

### 3.1 Tabel Legacy (url8) - Compatible dengan data lama

```sql
CREATE TABLE url8 (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shorturl    VARCHAR(50) UNIQUE NOT NULL,
  targeturl   VARCHAR(2048) NOT NULL,
  keterangan  VARCHAR(255) DEFAULT NULL,
  pswd        VARCHAR(255) DEFAULT NULL,        -- bcrypt hashed
  exp_date    DATETIME DEFAULT NULL,
  hitcounter  INT UNSIGNED DEFAULT 0,
  tglbuat    DATETIME DEFAULT CURRENT_TIMESTAMP,
  tglreset    DATETIME DEFAULT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  
  -- New fields untuk multi-user
  user_id     INT UNSIGNED DEFAULT NULL,
  title       VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_shorturl (shorturl),
  INDEX idx_exp_date (exp_date),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.2 Tabel Users

```sql
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,            -- bcrypt hashed
  role        ENUM('admin', 'user') DEFAULT 'user',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessions untuk JWT refresh token
CREATE TABLE user_sessions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255) DEFAULT NULL,
  expires_at  DATETIME NOT NULL,
  ip_address  VARCHAR(45) DEFAULT NULL,
  user_agent  VARCHAR(255) DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.3 Tabel Analytics

```sql
-- URL Hit Logs
CREATE TABLE url_hits (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  url_id      INT UNSIGNED NOT NULL,
  shorturl    VARCHAR(50) NOT NULL,
  ip_address  VARCHAR(45) DEFAULT NULL,
  user_agent  VARCHAR(500) DEFAULT NULL,
  referer     VARCHAR(500) DEFAULT NULL,
  country     VARCHAR(50) DEFAULT NULL,
  device_type ENUM('desktop', 'mobile', 'tablet', 'other') DEFAULT 'other',
  browser     VARCHAR(100) DEFAULT NULL,
  os          VARCHAR(100) DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (url_id) REFERENCES url8(id) ON DELETE CASCADE,
  INDEX idx_shorturl (shorturl),
  INDEX idx_created (created_at),
  INDEX idx_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. API Endpoints

### Base URL: `https://url.thinking.my.id/api8url`

### 4.1 Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:shorturl` | Redirect to target URL (GET-only - fix Google Drive) |
| GET | `/:shorturl+qr` | Get QR code image |
| GET | `/:shorturl/info` | Get URL public info (title, stats) |

### 4.2 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, get JWT tokens |
| POST | `/auth/logout` | Logout, invalidate session |
| POST | `/auth/refresh` | Refresh JWT access token |
| GET | `/auth/me` | Get current user info |

### 4.3 URL Management (Auth Required - User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/urls` | List user's URLs (paginated) |
| POST | `/urls` | Create new short URL |
| GET | `/urls/:id` | Get URL details |
| PUT | `/urls/:id` | Update URL |
| DELETE | `/urls/:id` | Delete URL |
| POST | `/urls/bulk` | Bulk create URLs (CSV/JSON) |
| POST | `/urls/:id/reset-counter` | Reset hit counter |

### 4.4 Analytics (Auth Required - User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/urls/:id/analytics` | Get URL detailed analytics |
| GET | `/analytics/overview` | Dashboard overview stats |

### 4.5 Admin Endpoints (Auth Required - Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/urls` | List ALL URLs (all users) |
| GET | `/admin/users` | List all users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/stats` | Global statistics |

---

## 5. User Roles & Permissions

### 5.1 Roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Full access: manage all URLs, manage users, view all analytics |
| **User** | Create/manage own URLs, view own analytics |

### 5.2 Access Rules

| Endpoint Pattern | Admin | User |
|-----------------|-------|------|
| `/:shorturl` (redirect) | ✅ | ✅ Public |
| `/auth/*` | ✅ | ✅ |
| `/urls` (own) | ✅ | ✅ |
| `/urls` (all) | ✅ Admin only | ❌ |
| `/admin/*` | ✅ Admin only | ❌ |

---

## 6. Core Features

### 6.1 URL Shortening
- Custom short URL alias (user-defined)
- Auto-generate random short URL (6-8 characters)
- Support long URLs up to 2048 characters
- Title and description for organization

### 6.2 Redirect Behavior (FIX: Google Drive Issue)
```typescript
// CRITICAL: Google Drive tidak menerima POST redirect
// Solution: Redirect menggunakan GET method

app.get('/:short', async (req, res) => {
  const url = await getUrl(req.params.short);
  
  if (!url || !url.isActive) {
    return res.status(404).send('URL not found');
  }
  
  // Check expiration
  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    return res.status(410).send('URL expired');
  }
  
  // Password protected?
  if (url.password) {
    const providedPassword = req.query.pwd || req.headers['x-url-password'];
    if (!providedPassword || !verifyPassword(providedPassword, url.password)) {
      return res.status(401).json({ 
        error: 'Password required',
        passwordProtected: true 
      });
    }
  }
  
  // Increment hit counter
  await logHit(url, req);
  
  // Redirect dengan 302 (temporary) atau 301 (permanent)
  return res.redirect(302, url.targetUrl);
});
```

### 6.3 Password Protection
- Optional per-URL password
- bcrypt hashing
- Password passed via query param or header
- Clean redirect after auth (no POST form)

### 6.4 Expiration
- Optional expiration date/time
- Auto-disable expired URLs
- Admin can reactivate

### 6.5 QR Code Generation
- Endpoint: `GET /:shorturl+qr`
- Formats: PNG, SVG
- Size options: 100-1000px
- Auto-download or inline display

### 6.6 Analytics
- Total clicks per URL
- Unique visitors (by IP)
- Geographic distribution (optional)
- Device type breakdown
- Referrer tracking
- Time-series data (daily/weekly/monthly)

### 6.7 Bulk Operations
- Import URLs via CSV or JSON
- Export URLs to CSV
- Batch delete
- Batch update expiration

---

## 7. Security Requirements

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt (cost factor 12) |
| JWT Access Token | 15 minutes expiry |
| JWT Refresh Token | 7 days expiry, stored in DB |
| Rate Limiting | 100 req/min (auth), 20 req/min (public) |
| CORS | Whitelist specific domains |
| Input Validation | Zod schemas on all inputs |
| SQL Injection | Prisma ORM (parameterized queries) |
| XSS Prevention | Output encoding, CSP headers |
| HTTPS Enforce | HSTS header in production |
| Admin Path | `/kelola` hidden from frontend nav |

---

## 8. Data Migration

### 8.1 Compatibility Requirements
- ✅ Read existing data from `url8` table
- ✅ Transform to new schema (add new columns)
- ✅ Hash existing passwords with bcrypt
- ✅ Preserve hit counter, expiration dates
- ✅ Full backup before migration

### 8.2 Migration Script
```typescript
// prisma/seed.ts - migrateLegacyData()
async function migrateLegacyData() {
  // 1. Check if migration already done
  const migrated = await prisma.url8.findFirst({ 
    where: { userId: { not: null } } 
  });
  if (migrated) return;
  
  // 2. Read all old data via raw query
  const oldUrls = await prisma.$queryRaw`
    SELECT * FROM url8 
    WHERE user_id IS NULL
  `;
  
  // 3. Transform and insert with new schema
  // 4. Mark migration complete
}
```

---

## 9. Directory Structure

```
app2-urlref/
├── backend/                    # Merged: API + Frontend
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── url.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── analytics.routes.ts
│   │   ├── services/          # Business logic
│   │   ├── middleware/         # Auth, validation
│   │   ├── helpers/           # Utilities
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Entry point
│   ├── client/                # React SPA
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── App.tsx
│   │   └── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── public/                 # Built frontend
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   └── ecosystem.config.js
├── old/                        # Backup kode lama
├── prd-urlredirector.md        # This document
└── README.md
```

---

## 10. Deployment Configuration

### 10.1 Environment Variables
```env
NODE_ENV=production
PORT=8002
API_PREFIX=/api8url

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=thin1722_urlsRF
DATABASE_USER=thin1722_rf_urls
DATABASE_PASSWORD=8)a7qgD#S[UbT6))

JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RATE_LIMIT_PUBLIC=20
RATE_LIMIT_AUTH=100

CORS_ORIGINS=https://url.thinking.my.id
```

### 10.2 PM2 Config (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'modernurl8',
    script: './dist/index.js',
    cwd: './backend',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8002
    },
    max_memory_restart: '500M'
  }]
};
```

### 10.3 Cloudflare Tunnel
```yaml
# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: url.thinking.my.id
    service: http://localhost:8002
    originRequest:
      tlsSkipVerify: true
  - service: http_status:404
```

---

## 11. Implementation Phases

### Phase 1: Foundation
- [ ] Setup project structure (merged backend + frontend)
- [ ] Configure Prisma with MySQL
- [ ] Implement database schema migration
- [ ] Setup JWT authentication
- [ ] Implement basic middleware (auth, rate-limit, validation)

### Phase 2: Core URL Features
- [ ] URL redirect endpoint (GET-only - fix Google Drive)
- [ ] URL CRUD operations
- [ ] Password protection
- [ ] Expiration handling
- [ ] QR code generation

### Phase 3: User Management
- [ ] User registration/login
- [ ] User dashboard
- [ ] URL management per user
- [ ] API key support (optional)

### Phase 4: Admin Panel
- [ ] Admin authentication
- [ ] User management (CRUD)
- [ ] Global URL overview
- [ ] Global statistics

### Phase 5: Analytics & Polish
- [ ] Hit tracking
- [ ] Analytics dashboard
- [ ] Bulk operations
- [ ] Security hardening
- [ ] Performance optimization

### Phase 6: Deployment
- [ ] PM2 setup
- [ ] Cloudflare Tunnel configuration
- [ ] Domain setup
- [ ] SSL certificate verification

---

## 12. Success Criteria

- [ ] All existing URLs work without breaking change
- [ ] Google Drive links redirect successfully
- [ ] Password-protected URLs work with clean GET flow
- [ ] Multi-user support with role-based access
- [ ] QR code generation works
- [ ] Analytics tracking is functional
- [ ] Admin panel accessible at `/kelola`
- [ ] `/kelola` hidden from public landing page
- [ ] Rate limiting protects against abuse
- [ ] JWT authentication is secure

---

## 13. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response Time | < 100ms for redirect |
| Availability | 99.9% uptime |
| Concurrent Users | 100+ simultaneous |
| URL Capacity | 100,000+ URLs |
| Security | No XSS, SQL injection, CSRF |

---

## 14. Open Decisions

| Item | Options | Recommendation |
|------|---------|----------------|
| API Key for programmatic access | Yes/No | Yes, optional feature |
| Detailed geo tracking | IP-based/Country only | Country only (privacy) |
| Custom domain per user | Yes/No | No (v1) |
| Link expiration notification | Email/Webhook | No (v1) |

---

*Document Version: 1.0*
*Created: 2026-07-16*
*Status: Ready for Implementation*
