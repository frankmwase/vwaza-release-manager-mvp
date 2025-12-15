import { AnalyticsModel } from '../models/AnalyticsModel';
import { IAnalyticsData } from '../types/analytics';

export class AnalyticsService {
    /**
     * Get comprehensive analytics data
     * Aggregates data from multiple complex queries
     */
    async getAnalytics(): Promise<IAnalyticsData> {
        // Execute all analytics queries in parallel for performance
        const [overview, topArtists, genreStats, releaseTrends, recentReleases] = await Promise.all([
            AnalyticsModel.getOverview(),
            AnalyticsModel.getTopArtists(10),
            AnalyticsModel.getGenreStats(),
            AnalyticsModel.getReleaseTrends(30),
            AnalyticsModel.getRecentReleases(20)
        ]);

        return {
            overview,
            topArtists,
            genreStats,
            releaseTrends,
            recentReleases
        };
    }

    /**
     * Get processing statistics
     * Shows average time releases spend in each status
     */
    async getProcessingStats() {
        return await AnalyticsModel.getProcessingStats();
    }

    /**
     * Verify user has admin access
     */
    verifyAdminAccess(user: { role: string }) {
        if (user.role !== 'ADMIN') {
            throw { status: 403, message: 'Admin access required' };
        }
    }
}
