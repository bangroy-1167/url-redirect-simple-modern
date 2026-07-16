# modernURL8 - URL Redirection Management System

## 📋 Development Setup Guide

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- npm atau yarn

### 1. Clone & Install Dependencies

```bash
cd apps/repos/app2-urlref/backend

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env
```

**Environment Variables:**

```env
NODE_ENV=development
PORT=8002
API_PREFIX=/api8url

# Database (MySQL - Legacy compatible)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=thin1722_urlsRF
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password

# JWT Authentication
JWT_SECRET=change-this-to-a-strong-random-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_PUBLIC=20
RATE_LIMIT_AUTH=100

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:8002
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (creates admin user + sample data)
npm run prisma:seed
```

### 4. Run Development Server

```bash
# Start backend only
npm run dev:backend

# Or start all (backend + frontend)
npm run dev
```

### 5. Access Application

- **API Base**: http://localhost:8002/api8url
- **Health Check**: http://localhost:8002/health
- **Frontend**: http://localhost:5173 (if running)
- **Admin Panel**: http://localhost:5173/kelola

### Default Credentials

```
Admin Login:
- Email: admin@url8.local
- Password: admin123
```

### Test API

```bash
# Health check
curl http://localhost:8002/health

# Login
curl -X POST http://localhost:8002/api8url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@url8.local","password":"admin123"}'

# Create URL (with token)
curl -X POST http://localhost:8002/api8url/urls \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://google.com","title":"Google"}'

# Redirect test
curl -I http://localhost:8002/api8url/demo
```

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts     # Prisma client singleton
│   │   └── index.ts       # Environment configuration
│   ├── helpers/
│   │   ├── response.helper.ts    # API response format
│   │   ├── pagination.helper.ts    # Pagination/sort/filter parsing
│   │   └── query.helper.ts        # Prisma where builder
│   ├── routes/
│   │   ├── public.routes.ts       # Public redirect/QR endpoints
│   │   ├── auth.routes.ts         # Login/register/logout
│   │   ├── url.routes.ts         # URL CRUD
│   │   ├── admin.routes.ts       # Admin user management
│   │   └── analytics.routes.ts   # Analytics endpoints
│   └── index.ts             # Main entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seed script
├── package.json
└── tsconfig.json
```

---

## 🛠️ Helper Functions Reference

### Response Helper

```typescript
import { ok, fail, validationFail } from './helpers/response.helper';

// Success response
return ok(data, 'Success message');
return ok(data, 'OK', meta); // with pagination meta

// Error response
return fail('Error message');
return fail('Validation failed', { field: ['error message'] });

// Validation error
return validationFail({ email: ['Required'], password: ['Too short'] });
```

**Response Format:**
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "meta": { "page": 1, "per_page": 25, "total": 100 }
}
```

### Pagination Helper

```typescript
import { parsePagination, buildMeta } from './helpers/pagination.helper';

// Parse query params
const pg = parsePagination(request.query, {
  defaultSortBy: 'createdAt',
  defaultSortDir: 'desc'
});

// Use in query
const [items, total] = await prisma.$transaction([
  prisma.url8.findMany({ skip: pg.skip, take: pg.take, ... }),
  prisma.url8.count({ where })
]);

return ok(items, 'OK', buildMeta(pg, total));
```

**Query String Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 25, max: 200)
- `sort_by` - Sort field (default: id)
- `sort_dir` - Sort direction (asc/desc)
- `search` - Search keyword
- `filter[field]` - Filter by field
- `filter[field][op]` - Filter with operator (eq, ne, lt, lte, gt, gte, in, contains, starts, ends)

### Query Helper

```typescript
import { buildWhere } from './helpers/query.helper';

// Build WHERE clause
const where = buildWhere({
  search: { term: 'google', fields: ['title', 'shortUrl'] },
  filters: { isActive: true, userId: { eq: 1 } },
  allowedFilters: ['isActive', 'userId', 'createdAt'],
  extra: { deletedAt: null }
});
```

---

## 🔌 API Endpoints

### Public (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:shortUrl` | Redirect to target URL |
| GET | `/:shortUrl+qr` | Get QR code image |
| GET | `/:shortUrl/info` | Get URL public info |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Get current user |

### URL Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/urls` | List user's URLs |
| POST | `/urls` | Create URL |
| GET | `/urls/:id` | Get URL details |
| PUT | `/urls/:id` | Update URL |
| DELETE | `/urls/:id` | Delete URL |
| POST | `/urls/:id/reset-counter` | Reset hit counter |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/overview` | Dashboard overview |
| GET | `/analytics/urls/:id` | URL detailed analytics |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/urls` | List ALL URLs |
| GET | `/admin/users` | List users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/stats` | Global statistics |

---

## 🗄️ Database Schema

### Tables

1. **url8** - Main URL table
2. **users** - User accounts
3. **user_sessions** - JWT refresh tokens
4. **url_hits** - Analytics hit logs

### Legacy Compatibility

The schema is designed to be compatible with the legacy `url8` table from the old PHP application. Existing URLs will continue to work after migration.

---

## 🚀 Production Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

---

**Version**: 1.0.0  
**Last Updated**: 2026-07-16
