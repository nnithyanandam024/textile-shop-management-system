/**
 * Phase 14 — Connection Lifecycle Manager
 * Handles connection states, exponential backoff reconnects, and offline detection.
 */
import { RealtimeEvent } from './events';
import defaultEventDispatcher from './eventHandlers';
import { StorageManager } from '../utils/storage';

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'OFFLINE';

export type ConnectionStatusListener = (status: ConnectionStatus) => void;

export interface ConnectionConfig {
  wsUrl?: string;
  reconnectIntervalMs?: number;
  maxReconnectIntervalMs?: number;
  backoffFactor?: number;
  heartbeatIntervalMs?: number;
}

export class ConnectionManager {
  private status: ConnectionStatus = 'DISCONNECTED';
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private reconnectAttempts: number = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private socket: WebSocket | null = null;
  private ipcUnsubscribe: (() => void) | null = null;

  private config: Required<ConnectionConfig> = {
    wsUrl: (typeof window !== 'undefined' && (window as any).REACT_APP_WS_URL) || 'ws://127.0.0.1:5180',
    reconnectIntervalMs: 1000,
    maxReconnectIntervalMs: 30000,
    backoffFactor: 1.5,
    heartbeatIntervalMs: 20000,
  };

  constructor(config?: ConnectionConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkOnline());
      window.addEventListener('offline', () => this.handleNetworkOffline());
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if actively connected
   */
  isConnected(): boolean {
    return this.status === 'CONNECTED';
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      try {
        listener(newStatus);
      } catch (err) {
        console.error('[ConnectionManager] Status listener error:', err);
      }
    }
  }

  /**
   * Connect to real-time events via Electron IPC and WebSocket
   */
  connect(): void {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE');
      return;
    }

    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    // 1. Check for Electron IPC Bridge
    if (typeof window !== 'undefined' && (window as any).api?.realtime?.onEvent) {
      try {
        if (!this.ipcUnsubscribe) {
          this.ipcUnsubscribe = (window as any).api.realtime.onEvent((event: RealtimeEvent) => {
            this.handleIncomingEvent(event);
          });
        }
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        return;
      } catch (err) {
        console.warn('[ConnectionManager] Electron IPC Realtime error:', err);
      }
    }

    // 2. Browser WebSocket Connection (for multi-client LAN or web preview)
    if (typeof window !== 'undefined' && typeof (window as any).WebSocket !== 'undefined') {
      try {
        const token = StorageManager.getToken();
        const url = `${this.config.wsUrl}?token=${encodeURIComponent(token || '')}`;
        const wsClass = (window as any).WebSocket;
        this.socket = new wsClass(url);

        this.socket!.onopen = () => {
          this.setStatus('CONNECTED');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
        };

        this.socket!.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PONG') return;
            this.handleIncomingEvent(data as RealtimeEvent);
          } catch {}
        };

        this.socket!.onclose = () => {
          this.stopHeartbeat();
          if (this.status !== 'OFFLINE') {
            this.setStatus('DISCONNECTED');
            this.scheduleReconnect();
          }
        };

        this.socket!.onerror = () => {
          // Handled gracefully without recursive close
        };
      } catch {
        this.scheduleReconnect();
      }
    } else {
      // Direct connected state for desktop / unit test environments
      this.setStatus('CONNECTED');
    }
  }

  /**
   * Handle incoming event from any transport
   */
  handleIncomingEvent(event: RealtimeEvent): void {
    if (!event || !event.meta) return;

    // Dispatch to local subscribers
    defaultEventDispatcher.dispatch(event);
  }

  /**
   * Disconnect and clear all active connections and timers
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ipcUnsubscribe) {
      this.ipcUnsubscribe();
      this.ipcUnsubscribe = null;
    }

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    this.setStatus('DISCONNECTED');
    this.reconnectAttempts = 0;
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectIntervalMs * Math.pow(this.config.backoffFactor, this.reconnectAttempts - 1),
      this.config.maxReconnectIntervalMs
    );

    this.setStatus('RECONNECTING');
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleNetworkOnline(): void {
    this.reconnectAttempts = 0;
    this.connect();
  }

  private handleNetworkOffline(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.setStatus('OFFLINE');
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'PING' }));
      }
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const defaultConnectionManager = new ConnectionManager();
export default defaultConnectionManager;
