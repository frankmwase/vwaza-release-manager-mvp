import { db } from '../db';
import {
    IAnalyticsOverview,
    ITopArtist,
    IGenreStats,
    ITrendDataPoint,
    IRecentRelease
} from '../types/analytics';

export class AnalyticsModel {
    /**
     * Get comprehensive analytics overview
     * Uses aggregation (COUNT, GROUP BY) with percentage calculations
     */
    static async getOverview(): Promise<IAnalyticsOverview> {
        // Get total releases count
        const totalResult = await db.query('SELECT COUNT(*) as total FROM releases');
        const totalReleases = parseInt(totalResult.rows[0].total);

        // Get total distinct artists who have created releases
        const artistsResult = await db.query(
            'SELECT COUNT(DISTINCT artist_id) as total FROM releases'
        );
        const totalArtists = parseInt(artistsResult.rows[0].total);

        // Get releases grouped by status with counts and percentages
        const statusResult = await db.query(`
            SELECT 
                status,
                COUNT(*) as count,
                ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM releases), 0)), 2) as percentage
            FROM releases
            GROUP BY status
            ORDER BY count DESC
        `);

        return {
            totalReleases,
            totalArtists,
            releasesByStatus: statusResult.rows.map(row => ({
                status: row.status,
                count: parseInt(row.count),
                percentage: parseFloat(row.percentage) || 0
            }))
        };
    }

    /**
     * Get top artists by release count
     * Uses JOIN, aggregation, and multiple counts with GROUP BY
     */
    static async getTopArtists(limit: number = 10): Promise<ITopArtist[]> {
        const result = await db.query(`
            SELECT 
                u.id as artist_id,
                u.email as artist_email,
                COUNT(r.id) as release_count,
                COUNT(CASE WHEN r.status = 'PUBLISHED' THEN 1 END) as published_count,
                COUNT(CASE WHEN r.status = 'PENDING_REVIEW' THEN 1 END) as pending_count
            FROM users u
            LEFT JOIN releases r ON u.id = r.artist_id
            WHERE u.role = 'ARTIST'
            GROUP BY u.id, u.email
            HAVING COUNT(r.id) > 0
            ORDER BY release_count DESC, published_count DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(row => ({
            artist_id: row.artist_id,
            artist_email: row.artist_email,
            release_count: parseInt(row.release_count),
            published_count: parseInt(row.published_count),
            pending_count: parseInt(row.pending_count)
        }));
    }

    /**
     * Get genre popularity statistics
     * Handles comma-separated genres with proper parsing and aggregation
     */
    static async getGenreStats(): Promise<IGenreStats[]> {
        // Extract and count individual genres from comma-separated values
        const result = await db.query(`
            WITH genre_split AS (
                SELECT 
                    TRIM(regexp_split_to_table(genre, ',')) as genre
                FROM releases
                WHERE genre IS NOT NULL AND genre != ''
            ),
            genre_counts AS (
                SELECT 
                    genre,
                    COUNT(*) as count
                FROM genre_split
                GROUP BY genre
            )
            SELECT 
                genre,
                count,
                ROUND((count * 100.0 / NULLIF((SELECT SUM(count) FROM genre_counts), 0)), 2) as percentage
            FROM genre_counts
            ORDER BY count DESC
            LIMIT 10
        `);

        return result.rows.map(row => ({
            genre: row.genre,
            count: parseInt(row.count),
            percentage: parseFloat(row.percentage) || 0
        }));
    }

    /**
     * Get release submission trends over time
     * Time-based aggregation with DATE_TRUNC for daily trends
     */
    static async getReleaseTrends(days: number = 30): Promise<ITrendDataPoint[]> {
        const result = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM releases
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        return result.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count)
        }));
    }

    /**
     * Get recent releases with artist and track information
     * Complex JOIN with subquery for track count
     */
    static async getRecentReleases(limit: number = 20): Promise<IRecentRelease[]> {
        const result = await db.query(`
            SELECT 
                r.id,
                r.title,
                r.genre,
                r.status,
                r.created_at,
                u.email as artist_email,
                (SELECT COUNT(*) FROM tracks t WHERE t.release_id = r.id) as track_count
            FROM releases r
            INNER JOIN users u ON r.artist_id = u.id
            ORDER BY r.created_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(row => ({
            id: row.id,
            title: row.title,
            genre: row.genre || 'Unknown',
            status: row.status,
            artist_email: row.artist_email,
            created_at: row.created_at,
            track_count: parseInt(row.track_count)
        }));
    }

    /**
     * Get average processing times by status
     * Complex time-based aggregation using LAG window function
     */
    static async getProcessingStats() {
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_seconds
            FROM releases
            WHERE updated_at > created_at
            GROUP BY status
            ORDER BY count DESC
        `);

        return result.rows.map(row => ({
            status: row.status,
            count: parseInt(row.count),
            avgTimeSeconds: parseFloat(row.avg_time_seconds) || 0,
            avgTimeHours: (parseFloat(row.avg_time_seconds) || 0) / 3600
        }));
    }

    /**
     * Execute transaction-safe batch analytics update
     * Example of using transactions for complex multi-step operations
     */
    static async performAnalyticsSnapshot(): Promise<void> {
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Example: Could create analytics snapshot table and insert data
            // This demonstrates transaction usage for atomic operations
            const snapshot = await client.query(`
                INSERT INTO analytics_snapshots (
                    snapshot_date,
                    total_releases,
                    total_artists
                ) VALUES (
                    CURRENT_TIMESTAMP,
                    (SELECT COUNT(*) FROM releases),
                    (SELECT COUNT(DISTINCT artist_id) FROM releases)
                )
                ON CONFLICT DO NOTHING
            `).catch(() => {
                // Table might not exist - this is just an example
                console.log('Analytics snapshot table not available');
            });

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
