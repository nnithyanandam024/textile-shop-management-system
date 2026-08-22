/**
 * Phase 14 — Real-Time Client Interface Facade
 */
import { REALTIME_EVENTS, RealtimeEvent, RealtimeEventType } from './events';
import defaultEventDispatcher, { RealtimeEventHandler } from './eventHandlers';
import defaultConnectionManager, { ConnectionStatus, ConnectionStatusListener } from './connectionManager';

export const realtimeClient = {
  EVENTS: REALTIME_EVENTS,

  /**
   * Initialize real-time connection on session start
   */
  connect(): void {
    defaultConnectionManager.connect();
  },

  /**
   * Terminate real-time connection on logout
   */
  disconnect(): void {
    defaultConnectionManager.disconnect();
    defaultEventDispatcher.clearListeners();
  },

  /**
   * Subscribe to specific real-time event
   */
  subscribe<T = any>(type: RealtimeEventType | '*', handler: RealtimeEventHandler<T>): () => void {
    return defaultEventDispatcher.subscribe(type, handler);
  },

  /**
   * Dispatch / simulate an event locally (e.g. for testing or optimistic local triggers)
   */
  publish<T = any>(event: RealtimeEvent<T>): boolean {
    return defaultEventDispatcher.dispatch(event);
  },

  /**
   * Current connection status
   */
  getStatus(): ConnectionStatus {
    return defaultConnectionManager.getStatus();
  },

  /**
   * Listen for connection status changes
   */
  onStatusChange(listener: ConnectionStatusListener): () => void {
    return defaultConnectionManager.onStatusChange(listener);
  },
};

export default realtimeClient;
