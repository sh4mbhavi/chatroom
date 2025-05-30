const Message = require('../models/Message');

/**
 * Loads recent chat messages
 * @param {Object} socket - Socket instance for the current connection
 */
const handleLoadMessages = async (socket) => {
    try {
        // Query last 50 messages, sorted by timestamp ascending
        const messages = await Message.find()
            .sort({ timestamp: 1 }) // Ascending order
            .limit(50)
            .select('_id userId username content timestamp createdAt') // Select specific fields
            .lean(); // Use lean for better performance

        // Emit messages only to the requesting socket
        socket.emit('message:history', messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        socket.emit('message:error', {
            message: 'Failed to load message history',
        });
    }
};

/**
 * Handles new message creation and broadcasting
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance for the current connection
 */
const handleMessageSend = async (io, socket, { content }) => {
    try {
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            socket.emit('message:error', {
                message: 'Message content is required',
            });
            return;
        }

        if (content.length > 1000) {
            socket.emit('message:error', {
                message: 'Message content cannot exceed 1000 characters',
            });
            return;
        }

        // Create new message document
        const message = new Message({
            userId: socket.user._id,
            username: socket.user.username,
            content: content.trim(),
            timestamp: new Date(),
        });

        // Save to database
        const savedMessage = await message.save();

        // Broadcast the new message to all connected clients
        io.emit('message:new', {
            _id: savedMessage._id,
            userId: savedMessage.userId,
            username: savedMessage.username,
            content: savedMessage.content,
            timestamp: savedMessage.timestamp,
            createdAt: savedMessage.createdAt,
        });
    } catch (error) {
        console.error('Error handling message:send:', error);
        socket.emit('message:error', {
            message: 'Failed to send message',
        });
    }
};

/**
 * Handles typing indicator events
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance for the current connection
 * @param {boolean} isTyping - Whether the user is typing
 */
const handleTypingIndicator = (io, socket, isTyping) => {
    // Broadcast to all clients except sender
    socket.broadcast.emit('user:typing', {
        userId: socket.user._id,
        username: socket.user.username,
        isTyping,
    });
};

/**
 * Registers all message-related event handlers for a socket
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance for the current connection
 */
const registerMessageHandlers = (io, socket) => {
    // Load message history immediately when user connects
    handleLoadMessages(socket);

    // Message events
    socket.on('message:send', (data) => handleMessageSend(io, socket, data));

    // Typing indicators
    socket.on('user:typing:start', () => handleTypingIndicator(io, socket, true));
    socket.on('user:typing:stop', () => handleTypingIndicator(io, socket, false));
};

module.exports = {
    registerMessageHandlers,
};
