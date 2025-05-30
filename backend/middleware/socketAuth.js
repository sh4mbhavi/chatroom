const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
    try {
        // Get token from handshake auth
        const { token } = socket.handshake.auth;

        if (!token) {
            return next(new Error('Authentication token is required'));
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get user from database
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('User not found'));
            }

            // eslint-disable-next-line no-param-reassign
            socket.user = user;

            // Update user status to online
            await User.findByIdAndUpdate(user._id, { status: 'online' });

            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return next(new Error('Token expired'));
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return next(new Error('Invalid token'));
            }
            return next(new Error('Authentication failed'));
        }
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Internal server error'));
    }
};

module.exports = socketAuth;
