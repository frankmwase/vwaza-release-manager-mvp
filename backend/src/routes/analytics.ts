import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/AnalyticsController';

const analyticsController = new AnalyticsController();

export async function analyticsRoutes(server: FastifyInstance) {
    // All analytics routes require authentication
    server.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ message: 'Unauthorized' });
        }
    });

    // GET /analytics - Get comprehensive analytics data
    server.get('/analytics', analyticsController.getAnalytics.bind(analyticsController));

    // GET /analytics/processing-stats - Get processing time statistics
    server.get('/analytics/processing-stats', analyticsController.getProcessingStats.bind(analyticsController));
}
