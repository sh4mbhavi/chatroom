interface PingResponse {
  message: string;
  timestamp: string;
  requestInfo: {
    method: string;
    path: string;
    userAgent: string;
    timestamp: string;
  };
}

interface PingResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

const SERVER_URL = import.meta.env.VITE_NODE_ENV === 'production' 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:9999')  // Fallback for production
  : 'http://localhost:9999';

export async function pingServer(timeout: number = 5000): Promise<PingResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${SERVER_URL}/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        message: `Server responded with status: ${response.status}`,
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }

    const _data: PingResponse = await response.json();

    return {
      success: true,
      message: `Server is reachable (${responseTime}ms)`,
      responseTime,
    };
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: `Connection timeout after ${timeout}ms`,
          responseTime,
          error: 'Timeout',
        };
      }
      
      return {
        success: false,
        message: `Failed to connect to server: ${error.message}`,
        responseTime,
        error: error.message,
      };
    }

    return {
      success: false,
      message: 'Unknown connection error',
      responseTime,
      error: 'Unknown error',
    };
  }
}

export async function checkServerConnection(): Promise<void> {
  console.log('🔍 Checking server connection...');
  
  const result = await pingServer();
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.warn(`❌ ${result.message}`);
    
    // Optional: Show user notification
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Server connection failed. Some features may not work properly.');
    }
  }
}

export async function waitForServer(maxRetries: number = 5, delay: number = 2000): Promise<boolean> {
  console.log('⏳ Waiting for server to be available...');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await pingServer();
    
    if (result.success) {
      console.log(`✅ Server is available (attempt ${attempt}/${maxRetries})`);
      return true;
    }
    
    console.log(`❌ Server unavailable (attempt ${attempt}/${maxRetries})`);
    
    if (attempt < maxRetries) {
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('❌ Server is not available after all retry attempts');
  return false;
} 