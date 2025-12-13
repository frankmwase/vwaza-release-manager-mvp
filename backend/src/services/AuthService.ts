import bcrypt from 'bcrypt';
import { FastifyInstance } from 'fastify';
import { IAuthService } from '../interfaces/IAuthService';
import { UserModel } from '../models/UserModel';
import { IRegisterBody, ILoginBody } from '../types/requests';

export class AuthService implements IAuthService {
    constructor(private jwtSigner: FastifyInstance['jwt']) { }

    async register(body: IRegisterBody) {
        const { email, password, role } = body;

        if (!email || !password || !role) {
            throw { status: 400, message: 'Missing fields' };
        }

        if (!['ARTIST', 'ADMIN'].includes(role)) {
            throw { status: 400, message: 'Invalid role' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await UserModel.create(email, hashedPassword, role);
            const token = this.jwtSigner.sign({ id: user.id, email: user.email, role: user.role });

            return { token, user };
        } catch (err) {
            const error = err as { code?: string };
            if (error.code === '23505') { // Unique violation
                throw { status: 409, message: 'Email already exists' };
            }
            throw err;
        }
    }

    async login(body: ILoginBody) {
        const { email, password } = body;

        const user = await UserModel.findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw { status: 401, message: 'Invalid credentials' };
        }

        const token = this.jwtSigner.sign({ id: user.id, email: user.email, role: user.role });

        return { token, user: { id: user.id, email: user.email, role: user.role } };
    }
}
