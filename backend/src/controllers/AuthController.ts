import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/UserModel';
import { IRegisterBody, ILoginBody } from '../types/requests';

export class AuthController {
    static async register(request: FastifyRequest<{ Body: IRegisterBody }>, reply: FastifyReply) {
        const { email, password, role } = request.body;

        if (!email || !password || !role) {
            return reply.status(400).send({ message: 'Missing fields' });
        }

        if (!['ARTIST', 'ADMIN'].includes(role)) {
            return reply.status(400).send({ message: 'Invalid role' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await UserModel.create(email, hashedPassword, role);
            const token = request.server.jwt.sign({ id: user.id, email: user.email, role: user.role });

            return { token, user };
        } catch (err) {
            const error = err as { code?: string };
            if (error.code === '23505') { // Unique violation
                return reply.status(409).send({ message: 'Email already exists' });
            }
            request.server.log.error(err);
            return reply.status(500).send({ message: 'Internal Server Error' });
        }
    }

    static async login(request: FastifyRequest<{ Body: ILoginBody }>, reply: FastifyReply) {
        const { email, password } = request.body;

        try {
            const user = await UserModel.findByEmail(email);

            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return reply.status(401).send({ message: 'Invalid credentials' });
            }

            const token = request.server.jwt.sign({ id: user.id, email: user.email, role: user.role });

            return { token, user: { id: user.id, email: user.email, role: user.role } };
        } catch (err) {
            request.server.log.error(err);
            return reply.status(500).send({ message: 'Internal Server Error' });
        }
    }
}
