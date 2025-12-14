import request from 'supertest';
import { server } from '../../app';

describe('Release Creation Flow - End to End', () => {
    let authToken: string;
    let userId: number;
    let releaseId: number;

    // Set timeout for integration tests
    jest.setTimeout(15000);

    beforeAll(async () => {
        await server.ready();
    });

    afterAll(async () => {
        await server.close();
        // Give time for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    describe('Complete Release Creation Flow', () => {
        it('Step 1: User registers and logs in', async () => {
            // Register
            const registerResponse = await request(server.server)
                .post('/register')
                .send({
                    email: `e2e-test-${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'ARTIST'
                });

            expect(registerResponse.status).toBe(200);
            authToken = registerResponse.body.token;
            userId = registerResponse.body.user.id;

            expect(authToken).toBeDefined();
            expect(userId).toBeDefined();
        });

        it('Step 2: User creates a draft release', async () => {
            const response = await request(server.server)
                .post('/releases')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Album E2E',
                    genre: 'Hip-Hop, R&B',
                    cover_url: 'http://example.com/cover.jpg'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.status).toBe('DRAFT');
            expect(response.body.title).toBe('Test Album E2E');

            releaseId = response.body.id;
        });

        it('Step 3: User retrieves their releases', async () => {
            const response = await request(server.server)
                .get('/releases')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            const createdRelease = response.body.find((r: any) => r.id === releaseId);
            expect(createdRelease).toBeDefined();
            expect(createdRelease.title).toBe('Test Album E2E');
        });

        it('Step 4: User gets release details', async () => {
            const response = await request(server.server)
                .get(`/releases/${releaseId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(releaseId);
            expect(response.body.title).toBe('Test Album E2E');
            expect(response.body).toHaveProperty('tracks');
        });

        it('Step 5: User submits release for review', async () => {
            const response = await request(server.server)
                .put(`/releases/${releaseId}/submit`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('PROCESSING');
        });

        it('Step 6: Verify release status changed', async () => {
            const response = await request(server.server)
                .get(`/releases/${releaseId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('PROCESSING');
        });
    });

    describe('Admin Review Flow', () => {
        let adminToken: string;

        it('Admin registers and logs in', async () => {
            const registerResponse = await request(server.server)
                .post('/register')
                .send({
                    email: `admin-e2e-${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'ADMIN'
                });

            expect(registerResponse.status).toBe(200);
            adminToken = registerResponse.body.token;
        });

        it('Admin can view all releases', async () => {
            const response = await request(server.server)
                .get('/releases')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('Admin can approve a release', async () => {
            // First, wait a bit for processing to complete (in real scenario)
            // For testing, we'll manually update to PENDING_REVIEW first

            const response = await request(server.server)
                .put(`/releases/${releaseId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'PUBLISHED'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('PUBLISHED');
        });

        it('Admin can reject a release with reason', async () => {
            // Create another release to reject
            const createResponse = await request(server.server)
                .post('/releases')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Release to Reject',
                    genre: 'Pop',
                    cover_url: null
                });

            const newReleaseId = createResponse.body.id;

            const rejectResponse = await request(server.server)
                .put(`/releases/${newReleaseId}/review`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'REJECTED',
                    reject_reason: 'Missing cover art and tracks'
                });

            expect(rejectResponse.status).toBe(200);
            expect(rejectResponse.body.status).toBe('REJECTED');
            expect(rejectResponse.body.reject_reason).toBe('Missing cover art and tracks');
        });

        it('Non-admin cannot review releases', async () => {
            const response = await request(server.server)
                .put(`/releases/${releaseId}/review`)
                .set('Authorization', `Bearer ${authToken}`) // Artist token
                .send({
                    status: 'PUBLISHED'
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Admin only');
        });
    });

    describe('Authentication Required', () => {
        it('should reject requests without token', async () => {
            const response = await request(server.server)
                .get('/releases');

            expect(response.status).toBe(401);
        });

        it('should reject requests with invalid token', async () => {
            const response = await request(server.server)
                .get('/releases')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });
    });
});
