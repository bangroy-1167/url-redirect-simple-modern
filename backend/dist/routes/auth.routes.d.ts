/**
 * routes/auth.routes.ts
 *
 * Authentication routes.
 * Login, register, logout, token refresh.
 */
import { FastifyInstance, FastifyRequest } from 'fastify';
export declare function authRoutes(app: FastifyInstance): Promise<void>;
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
//# sourceMappingURL=auth.routes.d.ts.map