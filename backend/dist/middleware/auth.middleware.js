"use strict";
/**
 * src/middleware/auth.middleware.ts
 *
 * Authentication middleware for protected routes.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function authMiddleware(app) {
    // Add authenticate method to Fastify instance
    app.decorate('authenticate', async (request, reply) => {
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
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Attach user info to request
            request.user = decoded;
        }
        catch (err) {
            return reply.status(401).send({
                success: false,
                message: 'Unauthorized: Invalid or expired token',
            });
        }
    });
    // Add optional authenticate (doesn't fail if no token)
    app.decorate('authenticateOptional', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                request.user = decoded;
            }
        }
        catch (err) {
            // Silently ignore - optional auth
        }
    });
}
//# sourceMappingURL=auth.middleware.js.map