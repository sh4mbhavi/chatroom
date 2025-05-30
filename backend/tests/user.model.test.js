const mongoose = require('mongoose');
const User = require('../models/User');

describe('User Model', () => {
    beforeAll(async () => {
        if (global.mongoUri) {
            await mongoose.connect(global.mongoUri);
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('Schema Validation', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        };

        it('should create a user with valid data', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.username).toBe(validUserData.username);
            expect(savedUser.email).toBe(validUserData.email);
            expect(savedUser.password).not.toBe(validUserData.password); // Should be hashed
            expect(savedUser.status).toBe('offline'); // Default status
            expect(savedUser.createdAt).toBeDefined();
            expect(savedUser.updatedAt).toBeDefined();
        });

        it('should require username', async () => {
            const userData = { ...validUserData };
            delete userData.username;

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });

        it('should require email', async () => {
            const userData = { ...validUserData };
            delete userData.email;

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });

        it('should require password', async () => {
            const userData = { ...validUserData };
            delete userData.password;

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce unique email', async () => {
            const user1 = new User(validUserData);
            await user1.save();

            const user2 = new User({
                ...validUserData,
                username: 'differentuser',
            });

            await expect(user2.save()).rejects.toThrow();
        });

        it('should enforce unique username', async () => {
            const user1 = new User(validUserData);
            await user1.save();

            const user2 = new User({
                ...validUserData,
                email: 'different@example.com',
            });

            await expect(user2.save()).rejects.toThrow();
        });

        it('should validate email format', async () => {
            const userData = {
                ...validUserData,
                email: 'invalid-email',
            };

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce minimum username length', async () => {
            const userData = {
                ...validUserData,
                username: 'ab', // Too short
            };

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce minimum password length', async () => {
            const userData = {
                ...validUserData,
                password: '12345', // Too short
            };

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });

        it('should set default status to offline', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser.status).toBe('offline');
        });

        it('should accept valid status values', async () => {
            const statuses = ['online', 'offline', 'away'];

            await Promise.all(
                statuses.map(async (status) => {
                    const userData = {
                        ...validUserData,
                        email: `test-${status}@example.com`,
                        username: `testuser-${status}`,
                        status,
                    };

                    const user = new User(userData);
                    const savedUser = await user.save();

                    expect(savedUser.status).toBe(status);
                })
            );
        });

        it('should reject invalid status values', async () => {
            const userData = {
                ...validUserData,
                status: 'invalid-status',
            };

            const user = new User(userData);

            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'plainpassword',
            };

            const user = new User(userData);
            await user.save();

            expect(user.password).not.toBe('plainpassword');
            expect(user.password).toMatch(/^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/); // bcrypt hash pattern
        });

        it('should not hash password if not modified', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            await user.save();
            const originalHash = user.password;

            // Update other field
            user.status = 'online';
            await user.save();

            expect(user.password).toBe(originalHash);
        });

        it('should hash password when changed', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            await user.save();
            const originalHash = user.password;

            // Change password
            user.password = 'newpassword123';
            await user.save();

            expect(user.password).not.toBe(originalHash);
            expect(user.password).toMatch(/^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/);
        });
    });

    describe('comparePassword Method', () => {
        let user;

        beforeEach(async () => {
            user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            await user.save();
        });

        it('should return true for correct password', async () => {
            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const isMatch = await user.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });

        it('should handle empty password', async () => {
            const isMatch = await user.comparePassword('');
            expect(isMatch).toBe(false);
        });
    });

    describe('Timestamps', () => {
        it('should set createdAt and updatedAt on creation', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const savedUser = await user.save();

            expect(savedUser.createdAt).toBeDefined();
            expect(savedUser.updatedAt).toBeDefined();
            expect(savedUser.createdAt.getTime()).toBeCloseTo(savedUser.updatedAt.getTime(), -3);
        });

        it('should update updatedAt when document is modified', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            await user.save();
            const originalUpdatedAt = user.updatedAt;

            // Wait a moment to ensure different timestamp
            await new Promise((resolve) => {
                setTimeout(resolve, 1);
            });

            user.status = 'online';
            await user.save();

            expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe('lastSeen Field', () => {
        it('should allow setting lastSeen date', async () => {
            const lastSeenDate = new Date();
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                lastSeen: lastSeenDate,
            });

            const savedUser = await user.save();
            expect(savedUser.lastSeen.getTime()).toBe(lastSeenDate.getTime());
        });

        it('should handle null lastSeen', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                lastSeen: null,
            });

            const savedUser = await user.save();
            expect(savedUser.lastSeen).toBeNull();
        });
    });

    describe('JSON Serialization', () => {
        it('should include password when explicitly selected', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            await user.save();

            const userWithPassword = await User.findById(user._id).select('+password');
            expect(userWithPassword.password).toBeDefined();
        });
    });

    describe('Indexes', () => {
        it('should create unique index on email', async () => {
            const indexes = await User.collection.getIndexes();

            expect(indexes).toHaveProperty('email_1');
            expect(indexes.email_1).toEqual([['email', 1]]);
        });

        it('should create unique index on username', async () => {
            const indexes = await User.collection.getIndexes();

            expect(indexes).toHaveProperty('username_1');
            expect(indexes.username_1).toEqual([['username', 1]]);
        });
    });
});
