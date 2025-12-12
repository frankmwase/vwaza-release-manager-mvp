import { db } from '../db';
import { IUser } from '../types/models';

export class UserModel {
    static async create(email: string, passwordHash: string, role: string): Promise<IUser> {
        const result = await db.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
            [email, passwordHash, role]
        );
        return result.rows[0];
    }

    static async findByEmail(email: string): Promise<IUser | null> {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    static async findById(id: number): Promise<IUser | null> {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
}
