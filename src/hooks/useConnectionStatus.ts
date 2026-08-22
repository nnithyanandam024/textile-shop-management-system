/**
 * Phase 14 — useConnectionStatus Hook
 * Exposes real-time connectivity state with reconnect trigger
 */
import { useState, useEffect } from 'react';
import defaultConnectionManager, { ConnectionStatus } from '../realtime/connectionManager';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(defaultConnectionManager.getStatus());

  useEffect(() => {
    const unsub = defaultConnectionManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  const reconnect = () => {
    defaultConnectionManager.connect();
  };

  return {
    status,
    isConnected: status === 'CONNECTED',
    isConnecting: status === 'CONNECTING' || status === 'RECONNECTING',
    isOffline: status === 'OFFLINE' || status === 'DISCONNECTED',
    reconnect,
  };
}

export default useConnectionStatus;
