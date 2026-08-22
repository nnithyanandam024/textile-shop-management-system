/**
 * Phase 14 — useRealtime React Hook
 * Subscribes to real-time events with automatic cleanup on unmount
 */
import { useEffect, useRef } from 'react';
import { RealtimeEvent, RealtimeEventType } from '../realtime/events';
import realtimeClient from '../realtime/socket';
import { RealtimeEventHandler } from '../realtime/eventHandlers';

export function useRealtime<T = any>(
  eventTypes: RealtimeEventType | RealtimeEventType[] | '*',
  handler: RealtimeEventHandler<T>
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    const unsubs: Array<() => void> = [];

    types.forEach((type) => {
      const unsub = realtimeClient.subscribe(type, (event: RealtimeEvent<T>) => {
        if (handlerRef.current) {
          handlerRef.current(event);
        }
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [JSON.stringify(eventTypes)]);
}

export default useRealtime;
