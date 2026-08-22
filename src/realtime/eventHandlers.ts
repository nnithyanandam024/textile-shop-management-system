/**
 * Phase 14 — Real-Time Event Handlers & Deduplication Engine
 */
import { RealtimeEvent, RealtimeEventType } from './events';

export type RealtimeEventHandler<T = any> = (event: RealtimeEvent<T>) => void;

class EventDeduplicator {
  private seenEventIds: Set<string> = new Set();
  private eventOrder: string[] = [];
  private readonly maxCacheSize: number;

  constructor(maxCacheSize: number = 1000) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Check if event has already been processed within sliding window.
   * Returns true if event is NEW (not seen before), false if DUPLICATE.
   */
  isNewEvent(eventId: string): boolean {
    if (!eventId) return true;
    if (this.seenEventIds.has(eventId)) {
      return false; // Duplicate detected
    }

    this.seenEventIds.add(eventId);
    this.eventOrder.push(eventId);

    if (this.eventOrder.length > this.maxCacheSize) {
      const oldestId = this.eventOrder.shift();
      if (oldestId) {
        this.seenEventIds.delete(oldestId);
      }
    }

    return true;
  }

  clear(): void {
    this.seenEventIds.clear();
    this.eventOrder = [];
  }
}

export class EventDispatcher {
  private listeners: Map<RealtimeEventType | '*', Set<RealtimeEventHandler>> = new Map();
  private deduplicator: EventDeduplicator = new EventDeduplicator(1000);

  /**
   * Subscribe to specific event type or wildcard '*'
   */
  subscribe<T = any>(type: RealtimeEventType | '*', handler: RealtimeEventHandler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const handlers = this.listeners.get(type)!;
    handlers.add(handler as RealtimeEventHandler);

    // Return cleanup unsubscribe function
    return () => {
      handlers.delete(handler as RealtimeEventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  /**
   * Dispatch an incoming event to registered subscribers with duplicate filtering
   */
  dispatch<T = any>(event: RealtimeEvent<T>): boolean {
    if (!event || !event.meta || !event.meta.type) {
      return false;
    }

    // Duplicate check
    if (!this.deduplicator.isNewEvent(event.meta.eventId)) {
      return false; // Suppressed duplicate
    }

    // 1. Dispatch to exact event listeners
    const specificHandlers = this.listeners.get(event.meta.type);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventDispatcher] Handler error for ${event.meta.type}:`, err);
        }
      }
    }

    // 2. Dispatch to wildcard listeners
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventDispatcher] Wildcard handler error:`, err);
        }
      }
    }

    return true;
  }

  clearListeners(): void {
    this.listeners.clear();
    this.deduplicator.clear();
  }
}

export const defaultEventDispatcher = new EventDispatcher();
export default defaultEventDispatcher;
