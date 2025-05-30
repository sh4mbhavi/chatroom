// const request = require('supertest');
// const mongoose = require('mongoose');

// // Mock the database connection
// jest.mock('../config/db', () => {
//     return jest.fn().mockResolvedValue({
//         connection: {
//             host: 'test-host',
//             readyState: 1,
//         },
//     });
// });

// // Mock console.log to keep test output clean
// console.log = jest.fn();

// // Import server after mocking
// const app = require('../server');

// describe('Server Endpoints', () => {
//     // Connect to the test database before running tests
//     beforeAll(async () => {
//         if (global.mongoUri) {
//             await mongoose.connect(global.mongoUri);
//         }
//     });

//     // Close database connection after tests
//     afterAll(async () => {
//         if (mongoose.connection.readyState !== 0) {
//             await mongoose.connection.close();
//         }
//     });

//     describe('GET /', () => {
//         it('should return welcome message', async () => {
//             const response = await request(app).get('/');

//             expect(response.status).toBe(200);
//             expect(response.body).toHaveProperty('message', 'Welcome to the chat app backend!');
//             expect(response.headers['content-type']).toMatch(/json/);
//         });
//     });

//     describe('GET /health', () => {
//         it('should return OK status', async () => {
//             const response = await request(app).get('/health');

//             expect(response.status).toBe(200);
//             expect(response.text).toBe('OK');
//         });
//     });

//     describe('GET /ping', () => {
//         it('should return pong with request info', async () => {
//             const response = await request(app)
//                 .get('/ping')
//                 .set('User-Agent', 'test-agent')
//                 .query({ test: '123' });

//             expect(response.status).toBe(200);
//             expect(response.body).toHaveProperty('message', 'pong');
//             expect(response.body).toHaveProperty('timestamp');
//             expect(response.body).toHaveProperty('requestInfo');

//             // Check request info structure
//             const { requestInfo } = response.body;
//             expect(requestInfo).toHaveProperty('method', 'GET');
//             expect(requestInfo).toHaveProperty('path', '/ping');
//             expect(requestInfo).toHaveProperty('query', { test: '123' });
//             expect(requestInfo).toHaveProperty('userAgent', 'test-agent');
//             expect(requestInfo).toHaveProperty('headers');
//             expect(requestInfo).toHaveProperty('ip');
//             expect(requestInfo).toHaveProperty('timestamp');
//         });

//         it('should handle request without query parameters', async () => {
//             const response = await request(app).get('/ping');

//             expect(response.status).toBe(200);
//             expect(response.body.requestInfo.query).toEqual({});
//         });

//         it('should include custom headers in response', async () => {
//             const customHeader = 'test-header-value';
//             const response = await request(app).get('/ping').set('X-Custom-Header', customHeader);

//             expect(response.status).toBe(200);
//             expect(response.body.requestInfo.headers).toHaveProperty(
//                 'x-custom-header',
//                 customHeader
//             );
//         });

//         it('should log request information', async () => {
//             await request(app).get('/ping');

//             expect(console.log).toHaveBeenCalledWith(
//                 'Ping Request:',
//                 expect.stringContaining('"method": "GET"')
//             );
//         });

//         it('should return valid timestamp format', async () => {
//             const response = await request(app).get('/ping');

//             expect(response.status).toBe(200);

//             // Check if timestamp is valid ISO string
//             const { timestamp } = response.body;
//             expect(new Date(timestamp).toISOString()).toBe(timestamp);
//         });
//     });

//     describe('Server Configuration', () => {
//         it('should handle JSON requests with proper content-type', async () => {
//             const response = await request(app).post('/ping').send({ test: 'data' });

//             // Ping endpoint doesn't accept POST, should return 404
//             expect(response.status).toBe(404);
//         });

//         it('should handle CORS requests', async () => {
//             const response = await request(app).get('/').set('Origin', 'http://localhost:3000');

//             expect(response.status).toBe(200);
//             expect(response.headers['access-control-allow-origin']).toBeDefined();
//         });
//     });

//     describe('404 Handling', () => {
//         it('should handle non-existent routes', async () => {
//             const response = await request(app).get('/nonexistent-route');

//             expect(response.status).toBe(404);
//         });

//         it('should handle non-existent API routes', async () => {
//             const response = await request(app).get('/api/nonexistent');

//             expect(response.status).toBe(404);
//         });
//     });

//     describe('HTTP Methods', () => {
//         it('should handle OPTIONS requests for CORS preflight', async () => {
//             const response = await request(app)
//                 .options('/')
//                 .set('Origin', 'http://localhost:3000')
//                 .set('Access-Control-Request-Method', 'GET');

//             expect(response.status).toBe(204);
//         });

//         it('should reject unsupported methods on specific routes', async () => {
//             const response = await request(app).put('/health');

//             expect(response.status).toBe(404);
//         });
//     });

//     describe('Error Handling', () => {
//         it('should handle malformed JSON gracefully', async () => {
//             const response = await request(app)
//                 .post('/api/auth/register')
//                 .set('Content-Type', 'application/json')
//                 .send('invalid json');

//             expect(response.status).toBe(400);
//         });

//         it('should process valid JSON but handle missing required fields', async () => {
//             const response = await request(app)
//                 .post('/api/auth/register')
//                 .send({ invalidField: 'data' });

//             // Should return 500 for server error due to missing required fields
//             expect(response.status).toBe(500);
//             expect(response.body).toHaveProperty('message', 'Server error');
//         });
//     });
// });
