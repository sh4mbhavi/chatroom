const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Mock console.log and console.error to keep test output clean
console.log = jest.fn();
console.error = jest.fn();

describe('Database Connection', () => {
    // Clean up after each test
    afterEach(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        jest.clearAllMocks();
    });

    // Clean up after all tests
    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    describe('Successful Connection', () => {
        it('should connect to MongoDB Memory Server successfully', async () => {
            // Use the global mongoUri from setup
            expect(global.mongoUri).toBeDefined();

            const conn = await connectDB(global.mongoUri);

            expect(mongoose.connection.readyState).toBe(1); // 1 means connected
            expect(conn).toBeDefined();
            expect(conn.connection).toBeDefined();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MongoDB Connected:'));
        });

        it('should return existing connection if already connected', async () => {
            // First connection
            await connectDB(global.mongoUri);
            expect(mongoose.connection.readyState).toBe(1);

            // Second connection should reuse existing
            await connectDB(global.mongoUri);
            expect(mongoose.connection.readyState).toBe(1);
        });

        it('should handle reconnection to different URI', async () => {
            // Connect to first URI
            await connectDB(global.mongoUri);
            expect(mongoose.connection.readyState).toBe(1);

            // Connect to a different URI (same server, different database)
            const differentUri = global.mongoUri.replace(/\/test$/, '/test2');
            const conn = await connectDB(differentUri);

            expect(mongoose.connection.readyState).toBe(1);
            expect(conn).toBeDefined();
        });
    });

    describe('Connection Validation', () => {
        it('should throw error if no URI provided', async () => {
            await expect(connectDB()).rejects.toThrow('MongoDB URI is required');
        });

        it('should throw error if empty URI provided', async () => {
            await expect(connectDB('')).rejects.toThrow('MongoDB URI is required');
        });

        it('should throw error if null URI provided', async () => {
            await expect(connectDB(null)).rejects.toThrow('MongoDB URI is required');
        });
    });

    describe('Error Handling', () => {
        it('should handle connection errors gracefully', async () => {
            const invalidUri = 'mongodb://invalid-host:27017/test';

            await expect(connectDB(invalidUri)).rejects.toThrow();
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error:'));
        });

        it('should handle malformed URI', async () => {
            const malformedUri = 'not-a-valid-uri';

            await expect(connectDB(malformedUri)).rejects.toThrow();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Connection State Management', () => {
        it('should properly close connection', async () => {
            await connectDB(global.mongoUri);
            expect(mongoose.connection.readyState).toBe(1);

            await mongoose.connection.close();
            expect(mongoose.connection.readyState).toBe(0); // 0 means disconnected
        });

        it('should handle connecting when in connecting state', async () => {
            // This test ensures we handle the connecting state properly
            const connectionPromise1 = connectDB(global.mongoUri);
            const connectionPromise2 = connectDB(global.mongoUri);

            await Promise.all([connectionPromise1, connectionPromise2]);

            expect(mongoose.connection.readyState).toBe(1);
        });
    });

    describe('Database Operations', () => {
        beforeEach(async () => {
            await connectDB(global.mongoUri);
        });

        it('should allow basic database operations', async () => {
            // Create a simple test collection
            const TestModel = mongoose.model('TestConnection', {
                name: String,
                value: Number,
            });

            // Insert a document
            const doc = new TestModel({ name: 'test', value: 123 });
            await doc.save();

            // Query the document
            const found = await TestModel.findOne({ name: 'test' });
            expect(found).toBeTruthy();
            expect(found.name).toBe('test');
            expect(found.value).toBe(123);

            // Clean up
            await TestModel.deleteMany({});
        });

        it('should handle multiple collections', async () => {
            const TestModel1 = mongoose.model('TestCollection1', {
                data: String,
            });

            const TestModel2 = mongoose.model('TestCollection2', {
                info: String,
            });

            // Insert into both collections
            await TestModel1.create({ data: 'test1' });
            await TestModel2.create({ info: 'test2' });

            // Verify both collections work
            const doc1 = await TestModel1.findOne({ data: 'test1' });
            const doc2 = await TestModel2.findOne({ info: 'test2' });

            expect(doc1).toBeTruthy();
            expect(doc2).toBeTruthy();

            // Clean up
            await TestModel1.deleteMany({});
            await TestModel2.deleteMany({});
        });
    });
});
