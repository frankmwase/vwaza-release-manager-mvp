import request from 'supertest';
import { server } from '../../app';

describe('Authentication Integration Tests', () => {
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

    describe('POST /register', () => {
        it('should register a new artist user', async () => {
            const response = await request(server.server)
                .post('/register')
                .send({
                    email: `test-${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'ARTIST'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.role).toBe('ARTIST');
        });

        it('should reject registration with missing fields', async () => {
            const response = await request(server.server)
                .post('/register')
                .send({
                    email: 'test@example.com'
                    // missing password and role
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Missing fields');
        });

        it('should reject registration with invalid role', async () => {
            const response = await request(server.server)
                .post('/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    role: 'INVALID_ROLE'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid role');
        });
    });

    describe('POST /login', () => {
        const testEmail = `login-test-${Date.now()}@example.com`;
        const testPassword = 'password123';

        beforeAll(async () => {
            // Create a test user
            await request(server.server)
                .post('/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    role: 'ARTIST'
                });
        });

        it('should login with valid credentials', async () => {
            const response = await request(server.server)
                .post('/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(testEmail);
        });

        it('should reject login with invalid password', async () => {
            const response = await request(server.server)
                .post('/login')
                .send({
                    email: testEmail,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should reject login with non-existent email', async () => {
            const response = await request(server.server)
                .post('/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials');
        });
    });
});
