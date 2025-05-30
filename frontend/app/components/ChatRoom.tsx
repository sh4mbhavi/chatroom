import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '~/hooks/useSocket';

interface Message {
    _id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string;
    createdAt: string;
}

export function ChatRoom() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socket = useSocket();

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior: 'smooth',
                block: 'end'
            });
        }
    };

    // Handle socket events and message updates
    useEffect(() => {
        if (!socket) {
            console.log('📡 ChatRoom: No socket available yet');
            return;
        }

        console.log('📡 ChatRoom: Setting up socket event listeners');

        // Handle connection status changes
        socket.on('connect', () => {
            console.log('✅ ChatRoom: Socket connected');
            setConnectionStatus('connected');
        });

        socket.on('disconnect', () => {
            console.log('🔌 ChatRoom: Socket disconnected');
            setConnectionStatus('disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ ChatRoom: Socket connection error:', error);
            setConnectionStatus('disconnected');
        });

        // Handle initial message history
        socket.on('message:history', (messageHistory: Message[]) => {
            console.log('📜 ChatRoom: Received message history:', messageHistory.length, 'messages');
            setMessages(messageHistory);
            setIsLoading(false);
            // Use setTimeout to ensure scrolling happens after render
            setTimeout(scrollToBottom, 100);
        });

        // Handle new incoming messages
        socket.on('message:new', (message: Message) => {
            console.log('📨 ChatRoom: New message received:', message);
            setMessages(prev => [...prev, message]);
        });

        // Handle message errors
        socket.on('message:error', (error: { message: string }) => {
            console.error('❌ ChatRoom: Message error:', error.message);
            alert('Error: ' + error.message);
        });

        // Check if socket is already connected when we set up listeners
        if (socket.connected) {
            console.log('✅ ChatRoom: Socket already connected');
            setConnectionStatus('connected');
        }

        // Cleanup socket listeners on unmount
        return () => {
            console.log('🧹 ChatRoom: Cleaning up socket listeners');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('message:history');
            socket.off('message:new');
            socket.off('message:error');
        };
    }, [socket]);

    // Scroll to bottom whenever messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!socket) {
            console.error('❌ ChatRoom: Cannot send message - no socket connection');
            return;
        }

        if (!newMessage.trim()) {
            console.log('⚠️ ChatRoom: Cannot send empty message');
            return;
        }
        
        console.log('📤 ChatRoom: Sending message:', newMessage);
        socket.emit('message:send', {
            content: newMessage
        });
        
        setNewMessage('');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">
                    Status: {connectionStatus === 'connecting' ? 'Connecting to chat...' : 
                            connectionStatus === 'connected' ? 'Loading messages...' : 
                            'Connection failed'}
                </p>
                {connectionStatus === 'disconnected' && (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Retry Connection
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[93vh] bg-gray-100">
            {/* Connection Status Indicator */}
            {connectionStatus !== 'connected' && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-center">
                    Connection Status: {connectionStatus}
                </div>
            )}
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className="bg-white rounded-lg shadow p-4 max-w-lg mx-2"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {message.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {message.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(message.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form
                onSubmit={handleSubmit}
                className="border-t border-gray-200 p-4 bg-white"
            >
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={connectionStatus === 'connected' ? "Type a message..." : "Connecting..."}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                        maxLength={1000}
                        disabled={connectionStatus !== 'connected'}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || connectionStatus !== 'connected'}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
} 