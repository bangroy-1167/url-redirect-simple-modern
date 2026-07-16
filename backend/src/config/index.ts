/**
 * src/config/index.ts
 *
 * Environment configuration loader.
 * Load dari process.env dengan defaults.
 */

// Ensure DATABASE_URL is constructed from individual parts if not set
function getDatabaseUrl(): string {
  // If DATABASE_URL is set directly, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Otherwise construct from individual parts
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || '3306';
  const database = process.env.DATABASE_NAME || 'thin1722_urlsRF';
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  
  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = getDatabaseUrl();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8002', 10),
  apiPrefix: process.env.API_PREFIX || '/api8url',
  
  database: {
    url: getDatabaseUrl(),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  rateLimit: {
    public: parseInt(process.env.RATE_LIMIT_PUBLIC || '20', 10),
    auth: parseInt(process.env.RATE_LIMIT_AUTH || '100', 10),
  },
  
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8002').split(','),
  },
  
  qrCode: {
    size: parseInt(process.env.QR_CODE_SIZE || '300', 10),
  },
};
