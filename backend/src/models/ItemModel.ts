import { db } from '../db';

export interface Item {
    id: number;
    user_id: number;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
    created_at: Date;
    updated_at: Date;
}

export class ItemModel {
    static async create(userId: number, title: string, description?: string): Promise<Item> {
        const result = await db.query(
            `INSERT INTO items (user_id, title, description, status)
             VALUES ($1, $2, $3, 'TODO')
             RETURNING *`,
            [userId, title, description]
        );
        return result.rows[0];
    }

    static async findAll(userId: number): Promise<Item[]> {
        const result = await db.query(
            `SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async findById(id: number): Promise<Item | null> {
        const result = await db.query(
            `SELECT * FROM items WHERE id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    static async updateStatus(id: number, status: string): Promise<Item | null> {
        const result = await db.query(
            `UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query(
            `DELETE FROM items WHERE id = $1`,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
