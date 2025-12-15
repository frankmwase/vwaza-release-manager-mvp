import { db } from '../db';
import { IRelease } from '../types/models';

export class ReleaseModel {
    static async findAll(filters: { artistId?: number } = {}): Promise<IRelease[]> {
        let query = 'SELECT * FROM releases';
        const params: (string | number)[] = [];

        if (filters.artistId) {
            query += ' WHERE artist_id = $1';
            params.push(filters.artistId);
        }

        // Sorting by created_at for consistent results and index usage
        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    static async findById(id: number): Promise<IRelease | null> {
        const result = await db.query('SELECT * FROM releases WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async create(data: Partial<IRelease>): Promise<IRelease> {
        const result = await db.query(
            'INSERT INTO releases (artist_id, title, genre, cover_url, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [data.artist_id, data.title, data.genre, data.cover_url, 'DRAFT']
        );
        return result.rows[0];
    }

    static async updateStatus(id: number, status: string, reject_reason?: string): Promise<IRelease | null> {
        const result = await db.query(
            'UPDATE releases SET status = $1, reject_reason = $2 WHERE id = $3 RETURNING *',
            [status, reject_reason || null, id]
        );
        return result.rows[0] || null;
    }
}
