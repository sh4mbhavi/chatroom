const request = require('supertest');
const mongoose = require('mongoose');
const { app, httpServer } = require('../server');
const User = require('../models/User');

describe('Server Basic Endpoints', () => {
    beforeAll(async () => {
        if (global.mongoUri) {
            await mongoose.connect(global.mongoUri);
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        if (httpServer) {
            httpServer.close();
        }
    });

    beforeEach(async () => {
        // Clean database before each test
        await User.deleteMany({});
    });

    describe('GET /', () => {
        it('should return welcome message', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Welcome to the chat app backend!');
            expect(response.headers['content-type']).toMatch(/json/);
        });

        it('should have proper JSON content type', async () => {
            const response = await request(app).get('/');

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    describe('GET /health', () => {
        it('should return OK status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.text).toBe('OK');
        });

        it('should respond quickly for health checks', async () => {
            const startTime = Date.now();
            await request(app).get('/health');
            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(1000);
        });
    });

    describe('GET /ping', () => {
        it('should return pong with request info', async () => {
            const response = await request(app)
                .get('/ping')
                .set('User-Agent', 'test-agent')
                .query({ test: '123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'pong');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('requestInfo');

            const { requestInfo } = response.body;
            expect(requestInfo).toHaveProperty('method', 'GET');
            expect(requestInfo).toHaveProperty('path', '/ping');
            expect(requestInfo).toHaveProperty('query', { test: '123' });
            expect(requestInfo).toHaveProperty('userAgent', 'test-agent');
            expect(requestInfo).toHaveProperty('headers');
            expect(requestInfo).toHaveProperty('ip');
        });

        it('should handle empty query parameters', async () => {
            const response = await request(app).get('/ping');

            expect(response.status).toBe(200);
            expect(response.body.requestInfo.query).toEqual({});
        });

        it('should include custom headers', async () => {
            const response = await request(app).get('/ping').set('X-Custom-Header', 'test-value');

            expect(response.body.requestInfo.headers).toHaveProperty(
                'x-custom-header',
                'test-value'
            );
        });

        it('should return valid ISO timestamp', async () => {
            const response = await request(app).get('/ping');

            const { timestamp } = response.body;
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });

    describe('CORS Configuration', () => {
        it('should handle CORS preflight requests', async () => {
            const response = await request(app)
                .options('/')
                .set('Origin', 'http://localhost:5173')
                .set('Access-Control-Request-Method', 'GET');

            expect(response.status).toBe(204);
        });

        it('should include CORS headers', async () => {
            const response = await request(app).get('/').set('Origin', 'http://localhost:5173');

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    describe('404 Error Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app).get('/nonexistent');

            expect(response.status).toBe(404);
        });

        it('should return 404 for non-existent API routes', async () => {
            const response = await request(app).get('/api/nonexistent');

            expect(response.status).toBe(404);
        });

        it('should handle POST to non-existent routes', async () => {
            const response = await request(app).post('/nonexistent');

            expect(response.status).toBe(404);
        });
    });

    describe('HTTP Methods', () => {
        it('should reject unsupported methods on health endpoint', async () => {
            const response = await request(app).post('/health');

            expect(response.status).toBe(404);
        });

        it('should reject unsupported methods on ping endpoint', async () => {
            const response = await request(app).put('/ping');

            expect(response.status).toBe(404);
        });
    });

    describe('Request Body Parsing', () => {
        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .set('Content-Type', 'application/json')
                .send('invalid json string');

            expect(response.status).toBe(400);
        });

        it('should parse valid JSON correctly', async () => {
            const testData = {
                username: 'test',
                email: 'test@example.com',
                password: 'password123',
            };

            const response = await request(app).post('/api/auth/register').send(testData);

            // Should not be a parsing error (400), might be validation error (500) or success (201)
            expect(response.status).not.toBe(400);
        });
    });

    describe('Security Headers', () => {
        it('should handle requests with various content types', async () => {
            const response = await request(app)
                .get('/ping')
                .set('Accept', 'application/json, text/plain, */*');

            expect(response.status).toBe(200);
        });
    });

    describe('Request Limits and Performance', () => {
        it('should handle concurrent requests', async () => {
            const requests = Array(5)
                .fill()
                .map(() => request(app).get('/health'));
            const responses = await Promise.all(requests);

            responses.forEach((response) => {
                expect(response.status).toBe(200);
            });
        });

        it('should handle requests with large query strings', async () => {
            const largeQuery = 'x'.repeat(1000);
            const response = await request(app).get('/ping').query({ large: largeQuery });

            expect(response.status).toBe(200);
            expect(response.body.requestInfo.query.large).toBe(largeQuery);
        });
    });
});
