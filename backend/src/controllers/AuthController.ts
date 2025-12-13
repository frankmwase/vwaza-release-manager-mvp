import { FastifyReply, FastifyRequest } from 'fastify';
import { IRegisterBody, ILoginBody } from '../types/requests';
import { AuthService } from '../services/AuthService';

export class AuthController {
    static async register(request: FastifyRequest<{ Body: IRegisterBody }>, reply: FastifyReply) {
        const authService = new AuthService(request.server.jwt);
        try {
            return await authService.register(request.body);
        } catch (err: any) {
            request.server.log.error(err);
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }

    static async login(request: FastifyRequest<{ Body: ILoginBody }>, reply: FastifyReply) {
        const authService = new AuthService(request.server.jwt);
        try {
            return await authService.login(request.body);
        } catch (err: any) {
            request.server.log.error(err);
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }
}
