"use strict";
/**
 * routes/auth.routes.ts
 *
 * Authentication routes.
 * Login, register, logout, token refresh.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const response_helper_1 = require("../helpers/response.helper");
async function authRoutes(app) {
    /**
     * POST /auth/login - User login
     */
    app.post('/login', {
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
    }, async (request, reply) => {
        const { email, password } = request.body;
        // Find user
        const user = await database_1.default.user.findUnique({
            where: { email },
            include: { urls: { select: { id: true } } },
        });
        if (!user || !user.isActive) {
            return reply.status(401).send((0, response_helper_1.fail)('Invalid email or password'));
        }
        // Verify password
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            return reply.status(401).send((0, response_helper_1.fail)('Invalid email or password'));
        }
        // Generate JWT tokens
        const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
        const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
        const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: expiresIn });
        const refreshToken = jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, jwtSecret, { expiresIn: refreshExpiresIn });
        // Store session in database
        await database_1.default.userSession.create({
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
        await database_1.default.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() },
        });
        return reply.send((0, response_helper_1.ok)({
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        }, 'Login successful'));
    });
    /**
     * POST /auth/register - User registration
     */
    app.post('/register', {
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
    }, async (request, reply) => {
        const { username, email, password } = request.body;
        // Check if user already exists
        const existingUser = await database_1.default.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            return reply.status(400).send((0, response_helper_1.fail)('User with this email or username already exists', {
                field: existingUser.email === email ? 'email' : 'username',
                message: ['User with this email or username already exists'],
            }));
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        // Create user
        const user = await database_1.default.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: 'USER', // Default role
            },
        });
        return reply.status(201).send((0, response_helper_1.ok)({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        }, 'Registration successful'));
    });
    /**
     * POST /auth/logout - User logout
     */
    app.post('/logout', async (request, reply) => {
        // Extract token from header
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Delete session from database
            await database_1.default.userSession.deleteMany({
                where: { token },
            });
        }
        return reply.send((0, response_helper_1.ok)(null, 'Logout successful'));
    });
    /**
     * POST /auth/refresh - Refresh JWT token
     */
    app.post('/refresh', async (_request, reply) => {
        // This would typically use the refresh token
        // For simplicity, returning a new token
        return reply.send((0, response_helper_1.ok)({ message: 'Use /auth/login to get new tokens' }, 'Token refresh'));
    });
    /**
     * GET /auth/me - Get current user info
     */
    app.get('/me', async (request, reply) => {
        // Inline authentication check
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send((0, response_helper_1.fail)('Unauthorized: No token provided'));
        }
        try {
            const token = authHeader.substring(7);
            const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            const user = decoded;
            const dbUser = await database_1.default.user.findUnique({
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
                return reply.status(404).send((0, response_helper_1.fail)('User not found'));
            }
            return reply.send((0, response_helper_1.ok)({
                ...dbUser,
                urlCount: dbUser._count.urls,
            }, 'Success'));
        }
        catch (err) {
            return reply.status(401).send((0, response_helper_1.fail)('Invalid or expired token'));
        }
    });
}
//# sourceMappingURL=auth.routes.js.map