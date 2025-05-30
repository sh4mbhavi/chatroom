const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        username: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

// Create indexes for faster queries
messageSchema.index({ userId: 1 });
messageSchema.index({ timestamp: -1 }); // Descending index for latest messages first

// Add a text index for content searching
messageSchema.index({ content: 'text' });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
