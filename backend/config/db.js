const mongoose = require('mongoose');

const connectDB = async (uri) => {
    if (!uri) {
        throw new Error('MongoDB URI is required');
    }

    try {
        // If already connected to the same URI, return existing connection
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        // If connected to a different URI, close the connection first
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        // Set connection options with timeout
        const options = {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
            socketTimeoutMS: 45000, // 45 seconds timeout for operations
            connectTimeoutMS: 10000, // 10 seconds timeout for initial connection
            // Add these options for better compatibility
            autoIndex: true,
            maxPoolSize: 10,
            // Add these options for better error handling
            heartbeatFrequencyMS: 2000,
            retryWrites: true,
            retryReads: true,
        };

        const conn = await mongoose.connect(uri, options);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
