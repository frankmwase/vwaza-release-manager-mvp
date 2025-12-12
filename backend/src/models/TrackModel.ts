import { db } from '../db';
import { ITrack } from '../types/models';

export class TrackModel {
    static async create(data: Partial<ITrack>): Promise<ITrack> {
        const result = await db.query(
            'INSERT INTO tracks (release_id, title, audio_url, duration, isrc) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [data.release_id, data.title, data.audio_url, data.duration || 180, data.isrc]
        );
        return result.rows[0];
    }

    static async findByReleaseId(releaseId: number): Promise<ITrack[]> {
        const result = await db.query('SELECT * FROM tracks WHERE release_id = $1', [releaseId]);
        return result.rows;
    }
}
