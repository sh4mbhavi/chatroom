const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let mongoUri;

// Setup MongoDB Memory Server before all tests
beforeAll(async () => {
    // Create MongoDB Memory Server instance
    mongod = await MongoMemoryServer.create({
        instance: {
            storageEngine: 'wiredTiger',
        },
    });

    // Get the URI from the in-memory server
    mongoUri = mongod.getUri();

    // Set global variable for use in tests
    global.mongoUri = mongoUri;

    // Wait a moment for the server to be fully ready
    await new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
});

// Cleanup after all tests
afterAll(async () => {
    // Close mongoose connection if it exists
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Stop the MongoDB Memory Server
    if (mongod) {
        await mongod.stop();
    }
});

// Increase timeout for tests that might need more time
jest.setTimeout(30000);

// Export the URI for use in test files
module.exports = {
    mongoUri: () => mongoUri,
};
