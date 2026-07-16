/**
 * src/middleware/auth.middleware.ts
 *
 * Authentication middleware for protected routes.
 */
import { FastifyInstance, FastifyRequest } from 'fastify';
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
export declare function authMiddleware(app: FastifyInstance): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map