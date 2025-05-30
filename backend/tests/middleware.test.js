const mongoose = require('mongoose');
const User = require('../models/User');

describe('Middleware Tests', () => {
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

    describe('Database Setup', () => {
        it('should have database connection', async () => {
            expect(mongoose.connection.readyState).toBe(1);
        });

        it('should be able to create and find users', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            await user.save();

            const foundUser = await User.findOne({ email: 'test@example.com' });
            expect(foundUser).toBeDefined();
            expect(foundUser.username).toBe('testuser');
        });
    });
}); 