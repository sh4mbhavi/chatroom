const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const socketAuth = require('./middleware/socketAuth');
const User = require('./models/User');
const { registerMessageHandlers } = require('./socketHandlers/messageHandlers');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin:
            process.env.NODE_ENV === 'production'
                ? process.env.CLIENT_URL
                : 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const port = process.env.PORT || 9999;

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
    connectDB(process.env.MONGODB_URI);
}

// Middleware
app.use(
    cors({
        origin:
            process.env.NODE_ENV === 'production'
                ? process.env.CLIENT_URL
                : 'http://localhost:5173',
        credentials: true,
    })
);
app.use(express.json());

// Socket.IO middleware
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.username})`);

    // Register message handlers
    registerMessageHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', async () => {
        if (socket.user) {
            // Update user status to offline and set last seen
            await User.findByIdAndUpdate(socket.user._id, {
                status: 'offline',
                lastSeen: new Date(),
            });
            console.log(`Socket disconnected: ${socket.id} (User: ${socket.user.username})`);
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`Socket error: ${socket.id}`, error);
    });
});

// Handle Socket.IO authentication errors
io.on('connect_error', (err) => {
    console.error(`Socket connection error: ${err.message}`);
});

// Make io accessible to route handlers
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Ping endpoint for testing
app.get('/ping', (req, res) => {
    const requestInfo = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        headers: req.headers,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    };

    console.log('Ping Request:', JSON.stringify(requestInfo, null, 2));

    res.json({
        message: 'pong',
        timestamp: requestInfo.timestamp,
        requestInfo,
    });
});

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the chat app backend!' });
});

// Only start the server if this file is run directly
if (require.main === module) {
    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on http://localhost:${port}`);
        console.log('Socket.IO server is ready for connections');
    });
}

// Export both app and httpServer for testing
module.exports = { app, httpServer, io };
