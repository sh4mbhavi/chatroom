const mongoose = require('mongoose');
const User = require('../models/User');

// Mock console.log to keep test output clean
console.log = jest.fn();

describe('User Model', () => {
    // Connect before tests
    beforeAll(async () => {
        await mongoose.connect(global.mongoUri);
    });

    // Clean up after each test
    afterEach(async () => {
        await User.deleteMany({});
    });

    // Close connection after tests
    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('User Creation', () => {
        it('should create a user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.username).toBe(userData.username);
            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.password).not.toBe(userData.password); // Should be hashed
            expect(savedUser.status).toBe('offline'); // Default status
        });

        it('should hash password before saving', async () => {
            const userData = {
                username: 'testuser2',
                email: 'test2@example.com',
                password: 'password123',
            };

            const user = new User(userData);
            await user.save();

            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(10);
        });
    });

    describe('User Validation', () => {
        it('should require username', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require email', async () => {
            const user = new User({
                username: 'testuser',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require password', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should validate email format', async () => {
            const user = new User({
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce minimum password length', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: '123', // Too short
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce minimum username length', async () => {
            const user = new User({
                username: 'ab', // Too short
                email: 'test@example.com',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('User Methods', () => {
        let user;

        beforeEach(async () => {
            user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            await user.save();
        });

        it('should compare password correctly', async () => {
            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const isMatch = await user.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });
    });

    describe('User Uniqueness', () => {
        it('should not allow duplicate email', async () => {
            // Create first user
            const user1 = new User({
                username: 'user1',
                email: 'test@example.com',
                password: 'password123',
            });
            await user1.save();

            // Try to create second user with same email
            const user2 = new User({
                username: 'user2',
                email: 'test@example.com',
                password: 'password456',
            });

            await expect(user2.save()).rejects.toThrow();
        });

        it('should not allow duplicate username', async () => {
            // Create first user
            const user1 = new User({
                username: 'testuser',
                email: 'test1@example.com',
                password: 'password123',
            });
            await user1.save();

            // Try to create second user with same username
            const user2 = new User({
                username: 'testuser',
                email: 'test2@example.com',
                password: 'password456',
            });

            await expect(user2.save()).rejects.toThrow();
        });
    });

    describe('User Status', () => {
        it('should have default status as offline', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            await user.save();

            expect(user.status).toBe('offline');
        });

        it('should allow status update', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            await user.save();

            user.status = 'online';
            await user.save();

            expect(user.status).toBe('online');
        });
    });

    describe('User Queries', () => {
        beforeEach(async () => {
            await User.create([
                { username: 'user1', email: 'user1@example.com', password: 'password123' },
                { username: 'user2', email: 'user2@example.com', password: 'password123' },
                { username: 'user3', email: 'user3@example.com', password: 'password123' },
            ]);
        });

        it('should find user by email', async () => {
            const user = await User.findOne({ email: 'user1@example.com' });
            expect(user).toBeTruthy();
            expect(user.username).toBe('user1');
        });

        it('should find user by username', async () => {
            const user = await User.findOne({ username: 'user2' });
            expect(user).toBeTruthy();
            expect(user.email).toBe('user2@example.com');
        });

        it('should count users', async () => {
            const count = await User.countDocuments();
            expect(count).toBe(3);
        });
    });
});
