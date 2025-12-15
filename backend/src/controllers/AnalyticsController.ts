import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../services/AnalyticsService';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
    /**
     * GET /analytics
     * Returns comprehensive analytics data for admin dashboard
     */
    async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user;

            // Verify admin access
            analyticsService.verifyAdminAccess(user);

            // Fetch all analytics data
            const data = await analyticsService.getAnalytics();

            reply.send(data);
        } catch (err: any) {
            reply.status(err.status || 500).send({
                message: err.message || 'Failed to fetch analytics'
            });
        }
    }

    /**
     * GET /analytics/processing-stats
     * Returns processing time statistics
     */
    async getProcessingStats(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user;

            // Verify admin access
            analyticsService.verifyAdminAccess(user);

            const stats = await analyticsService.getProcessingStats();

            reply.send(stats);
        } catch (err: any) {
            reply.status(err.status || 500).send({
                message: err.message || 'Failed to fetch processing stats'
            });
        }
    }
}
