/**
 * src/middleware/auth.middleware.ts
 *
 * Authentication middleware for protected routes.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// Extend FastifyInstance
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function authMiddleware(app: FastifyInstance) {
  
  // Add authenticate method to Fastify instance
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized: No token provided',
        });
      }
      
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
      
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      
      // Attach user info to request
      (request as any).user = decoded;
      
    } catch (err) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized: Invalid or expired token',
      });
    }
  });
  
  // Add optional authenticate (doesn't fail if no token)
  app.decorate('authenticateOptional', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        (request as any).user = decoded;
      }
    } catch (err) {
      // Silently ignore - optional auth
    }
  });
}
