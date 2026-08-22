/**
 * Phase 14 — Backend Realtime EventBus
 * Central broker for emitting and broadcasting business mutation events across Electron & WebSocket clients.
 */
import { BrowserWindow } from 'electron';
import log from '../logger';

export type BackendRealtimeEventType =
  | 'SALE_CREATED'
  | 'SALE_UPDATED'
  | 'SALE_CANCELLED'
  | 'SALE_RETURNED'
  | 'INVENTORY_UPDATED'
  | 'STOCK_ADJUSTED'
  | 'LOW_STOCK_DETECTED'
  | 'OUT_OF_STOCK'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'ATTENDANCE_CHECKED_IN'
  | 'ATTENDANCE_CHECKED_OUT'
  | 'STAFF_UPDATED'
  | 'LEAVE_CREATED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'SYSTEM_ALERT';

export interface BackendRealtimeEvent<T = any> {
  meta: {
    eventId: string;
    type: BackendRealtimeEventType;
    timestamp: number;
    version: number;
    branchId?: number | string;
    actorUserId?: number;
    actorStaffId?: number;
    actorName?: string;
    targetRole?: string | string[];
    targetStaffId?: number;
    targetUserId?: number;
  };
  data: T;
}

export type BackendEventListener<T = any> = (event: BackendRealtimeEvent<T>) => void;

export class BackendEventBus {
  private static instance: BackendEventBus;
  private listeners: Map<BackendRealtimeEventType | '*', Set<BackendEventListener>> = new Map();
  private eventSequence: number = 0;

  private constructor() {}

  public static getInstance(): BackendEventBus {
    if (!BackendEventBus.instance) {
      BackendEventBus.instance = new BackendEventBus();
    }
    return BackendEventBus.instance;
  }

  /**
   * Subscribe to backend events locally
   */
  public subscribe<T = any>(type: BackendRealtimeEventType | '*', listener: BackendEventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(listener as BackendEventListener);

    return () => {
      set.delete(listener as BackendEventListener);
      if (set.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  /**
   * Publish a business event: dispatches to local backend subscribers and broadcasts to Electron windows
   */
  public publish<T = any>(
    type: BackendRealtimeEventType,
    data: T,
    metaOverrides?: Partial<BackendRealtimeEvent<T>['meta']>
  ): BackendRealtimeEvent<T> {
    this.eventSequence++;
    const eventId = `evt_${Date.now()}_${this.eventSequence}_${Math.random().toString(36).substr(2, 6)}`;

    const event: BackendRealtimeEvent<T> = {
      meta: {
        eventId,
        type,
        timestamp: Date.now(),
        version: 1,
        ...metaOverrides,
      },
      data,
    };

    // 1. Dispatch to local backend listeners
    const specificListeners = this.listeners.get(type);
    if (specificListeners) {
      for (const listener of specificListeners) {
        try {
          listener(event);
        } catch (err: any) {
          log.error(`[EventBus] Backend listener error for ${type}:`, err);
        }
      }
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event);
        } catch (err: any) {
          log.error(`[EventBus] Wildcard listener error:`, err);
        }
      }
    }

    // 2. Broadcast to all open Electron BrowserWindow renderer processes
    this.broadcastToWindows(event);

    return event;
  }

  /**
   * Broadcast event to Electron windows via IPC
   */
  private broadcastToWindows(event: BackendRealtimeEvent): void {
    try {
      if (typeof BrowserWindow !== 'undefined' && BrowserWindow.getAllWindows) {
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed() && win.webContents) {
            win.webContents.send('realtime:event', event);
          }
        }
      }
    } catch (err) {
      log.warn('[EventBus] Failed to broadcast IPC event to BrowserWindow:', err);
    }
  }

  /**
   * Reset listeners (useful for testing)
   */
  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = BackendEventBus.getInstance();
export default eventBus;
