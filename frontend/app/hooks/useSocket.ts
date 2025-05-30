import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '~/utils/auth';

const SERVER_URL = import.meta.env.VITE_NODE_ENV === 'production' 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:9999')
  : 'http://localhost:9999';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const cleanup = useCallback((socketInstance: Socket) => {
    console.log('🧹 useSocket: Cleaning up socket connection');
    if (socketInstance) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    }
    setSocket(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    const token = getToken();
    console.log('🔍 useSocket: Starting socket connection...');
    console.log('🔍 useSocket: Token exists:', !!token);
    console.log('🔍 useSocket: Server URL:', SERVER_URL);
    
    if (!token) {
      console.error('❌ useSocket: No authentication token found');
      return;
    }

    // Initialize socket connection with auth token
    console.log('🔄 useSocket: Creating socket connection...');
    const newSocket = io(SERVER_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true, // Force new connection to prevent issues
    });

    // Handle connection events
    newSocket.on('connect', () => {
      console.log('✅ useSocket: Socket connected successfully', newSocket.id);
      setSocket(newSocket);
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ useSocket: Socket connection error:', error.message);
      console.error('❌ useSocket: Error details:', error);
      if (error.message === 'Authentication failed') {
        console.error('❌ useSocket: Authentication failed - token may be invalid');
      }
      setSocket(null);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 useSocket: Socket disconnected:', reason);
      setSocket(null);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 useSocket: Socket reconnected after', attemptNumber, 'attempts');
      setSocket(newSocket);
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ useSocket: Reconnection error:', error);
      setSocket(null);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => cleanup(newSocket);
  }, []); // Empty dependency array

  return socket;
}; 