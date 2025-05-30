const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app, httpServer } = require('../server');
const User = require('../models/User');

describe('Authentication API', () => {
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

    describe('POST /api/auth/register', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        };

        it('should register a new user successfully', async () => {
            const response = await request(app).post('/api/auth/register').send(validUserData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body).toHaveProperty('username', validUserData.username);
            expect(response.body).toHaveProperty('email', validUserData.email);
            expect(response.body).toHaveProperty('token');
            expect(response.body).not.toHaveProperty('password');
        });

        it('should hash the password in database', async () => {
            await request(app).post('/api/auth/register').send(validUserData);

            const user = await User.findOne({ email: validUserData.email }).select('+password');
            expect(user.password).not.toBe(validUserData.password);
            expect(user.password).toMatch(/^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/); // bcrypt hash pattern
        });

        it('should generate a valid JWT token', async () => {
            const response = await request(app).post('/api/auth/register').send(validUserData);

            const { token } = response.body;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            expect(decoded).toHaveProperty('id');
            expect(decoded).toHaveProperty('exp');
        });

        it('should reject duplicate email', async () => {
            // Create first user
            await request(app).post('/api/auth/register').send(validUserData);

            // Try to create user with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    ...validUserData,
                    username: 'differentuser',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'User already exists');
        });

        it('should reject duplicate username', async () => {
            // Create first user
            await request(app).post('/api/auth/register').send(validUserData);

            // Try to create user with same username
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    ...validUserData,
                    email: 'different@example.com',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'User already exists');
        });

        it('should handle missing required fields', async () => {
            const invalidData = { email: 'test@example.com' }; // missing username and password

            const response = await request(app).post('/api/auth/register').send(invalidData);

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Server error');
        });

        it('should validate email format', async () => {
            const invalidEmailData = {
                ...validUserData,
                email: 'invalid-email',
            };

            const response = await request(app).post('/api/auth/register').send(invalidEmailData);

            expect(response.status).toBe(500);
        });

        it('should handle empty request body', async () => {
            const response = await request(app).post('/api/auth/register').send({});

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Server error');
        });
    });

    describe('POST /api/auth/login', () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        };

        beforeEach(async () => {
            // Create a user for login tests
            await request(app).post('/api/auth/register').send(userData);
        });

        it('should login with valid credentials', async () => {
            const response = await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: userData.password,
            });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id');
            expect(response.body).toHaveProperty('username', userData.username);
            expect(response.body).toHaveProperty('email', userData.email);
            expect(response.body).toHaveProperty('status', 'online');
            expect(response.body).toHaveProperty('token');
        });

        it('should set user status to online', async () => {
            await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: userData.password,
            });

            const user = await User.findOne({ email: userData.email });
            expect(user.status).toBe('online');
        });

        it('should reject invalid email', async () => {
            const response = await request(app).post('/api/auth/login').send({
                email: 'nonexistent@example.com',
                password: userData.password,
            });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should reject invalid password', async () => {
            const response = await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: 'wrongpassword',
            });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should handle missing password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: userData.email });

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/auth/logout', () => {
        let userToken;
        let userId;

        beforeEach(async () => {
            // Register and login a user
            const registerResponse = await request(app).post('/api/auth/register').send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            userToken = registerResponse.body.token;
            userId = registerResponse.body._id;
        });

        it('should logout authenticated user', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Logged out successfully');
        });

        it('should set user status to offline', async () => {
            await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${userToken}`);

            const user = await User.findById(userId);
            expect(user.status).toBe('offline');
            expect(user.lastSeen).toBeDefined();
        });

        it('should reject request without token', async () => {
            const response = await request(app).post('/api/auth/logout');

            expect(response.status).toBe(401);
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        it('should reject request with malformed authorization header', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'InvalidFormat token');

            expect(response.status).toBe(401);
        });

        it('should handle expired token', async () => {
            const expiredToken = jwt.sign(
                { id: userId },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '-1h' } // Already expired
            );

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
        });
    });

    describe('JWT Token Validation', () => {
        it('should generate tokens with correct expiration', async () => {
            const response = await request(app).post('/api/auth/register').send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const { token } = response.body;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Token should be valid for 30 days
            const expirationTime = decoded.exp * 1000;
            const now = Date.now();
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

            expect(expirationTime - now).toBeGreaterThan(thirtyDaysInMs - 60000); // Allow 1 minute tolerance
        });

        it('should include correct user ID in token', async () => {
            const response = await request(app).post('/api/auth/register').send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const { token, _id } = response.body;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            expect(decoded.id).toBe(_id);
        });
    });

    describe('Authentication Middleware', () => {
        let userToken;

        beforeEach(async () => {
            const response = await request(app).post('/api/auth/register').send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            userToken = response.body.token;
        });

        it('should authenticate valid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
        });

        it('should reject missing authorization header', async () => {
            const response = await request(app).post('/api/auth/logout');

            expect(response.status).toBe(401);
        });

        it('should reject token without Bearer prefix', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', userToken);

            expect(response.status).toBe(401);
        });
    });
});
