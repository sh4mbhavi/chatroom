import { useServerConnection } from "~/hooks/useServerConnection";

export function ConnectionStatus() {
  const { isConnected, isChecking, responseTime, checkConnection } = useServerConnection();

  if (isChecking) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        padding: '8px 12px', 
        backgroundColor: '#f3f4f6', 
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        🔍 Checking server...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        padding: '8px 12px', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#dc2626'
      }}>
        ❌ Server offline
        <button 
          onClick={checkConnection}
          style={{ 
            marginLeft: '8px', 
            padding: '2px 6px', 
            fontSize: '10px',
            border: '1px solid #dc2626',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      padding: '8px 12px', 
      backgroundColor: '#f0fdf4', 
      border: '1px solid #bbf7d0',
      borderRadius: '6px',
      fontSize: '12px',
      color: '#16a34a'
    }}>
      ✅ Server connected {responseTime && `(${responseTime}ms)`}
    </div>
  );
} 