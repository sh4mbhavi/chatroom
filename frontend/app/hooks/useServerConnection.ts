import { useEffect, useState } from 'react';
import { pingServer, checkServerConnection } from '~/utils/server-ping';

interface ServerConnectionState {
  isConnected: boolean | null; // null = checking, true = connected, false = disconnected
  responseTime: number | null;
  lastChecked: Date | null;
  error: string | null;
}

export function useServerConnection(checkOnMount: boolean = true) {
  const [state, setState] = useState<ServerConnectionState>({
    isConnected: null,
    responseTime: null,
    lastChecked: null,
    error: null,
  });

  const checkConnection = async () => {
    setState(prev => ({ ...prev, isConnected: null, error: null }));
    
    try {
      const result = await pingServer();
      setState({
        isConnected: result.success,
        responseTime: result.responseTime || null,
        lastChecked: new Date(),
        error: result.success ? null : result.error || 'Connection failed',
      });
    } catch (error: unknown) {
      setState({
        isConnected: false,
        responseTime: null,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    if (checkOnMount) {
      checkConnection();
    }
  }, [checkOnMount]);

  return {
    ...state,
    checkConnection,
    isChecking: state.isConnected === null,
  };
}

// Simple hook for one-time connection check on app start
export function useInitialServerCheck(): boolean {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      checkServerConnection();
      setChecked(true);
    }
  }, [checked]);

  return checked;
} 