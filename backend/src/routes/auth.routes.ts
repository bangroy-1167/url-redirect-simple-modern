/**
 * routes/auth.routes.ts
 *
 * Authentication routes.
 * Login, register, logout, token refresh.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { ok, fail, validationFail } from '../helpers/response.helper';

// JWT payload interface
interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// Request body interfaces
interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export async function authRoutes(app: FastifyInstance) {
  
  /**
   * POST /auth/login - User login
   */
  app.post<{ Body: LoginBody }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { email, password } = request.body;
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { urls: { select: { id: true } } },
      });
      
      if (!user || !user.isActive) {
        return reply.status(401).send(fail('Invalid email or password'));
      }
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send(fail('Invalid email or password'));
      }
      
      // Generate JWT tokens
      const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
      const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      
      const token = jwt.sign(payload, jwtSecret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
      const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        jwtSecret,
        { expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'] }
      );
      
      // Store session in database
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || null,
        },
      });
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });
      
      return reply.send(ok({
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      }, 'Login successful'));
    }
  );
  
  /**
   * POST /auth/register - User registration
   */
  app.post<{ Body: RegisterBody }>(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      const { username, email, password } = request.body;
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });
      
      if (existingUser) {
        return reply.status(400).send(
          fail('User with this email or username already exists', {
            field: existingUser.email === email ? 'email' : 'username',
            message: ['User with this email or username already exists'],
          })
        );
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: 'USER', // Default role
        },
      });
      
      return reply.status(201).send(ok({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }, 'Registration successful'));
    }
  );
  
  /**
   * POST /auth/logout - User logout
   */
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // Extract token from header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Delete session from database
      await prisma.userSession.deleteMany({
        where: { token },
      });
    }
    
    return reply.send(ok(null, 'Logout successful'));
  });
  
  /**
   * POST /auth/refresh - Refresh JWT token
   */
  app.post('/refresh', async (_request: FastifyRequest, reply: FastifyReply) => {
    // This would typically use the refresh token
    // For simplicity, returning a new token
    return reply.send(ok({ message: 'Use /auth/login to get new tokens' }, 'Token refresh'));
  });
  
  /**
   * GET /auth/me - Get current user info
   */
  app.get(
    '/me',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Inline authentication check
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send(fail('Unauthorized: No token provided'));
      }
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        const user = decoded;
        
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: { urls: true },
            },
          },
        });
        
        if (!dbUser) {
          return reply.status(404).send(fail('User not found'));
        }
        
        return reply.send(ok({
          ...dbUser,
          urlCount: dbUser._count.urls,
        }, 'Success'));
      } catch (err) {
        return reply.status(401).send(fail('Invalid or expired token'));
      }
    }
  );
}

// Extend FastifyInstance to add authenticate method
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
