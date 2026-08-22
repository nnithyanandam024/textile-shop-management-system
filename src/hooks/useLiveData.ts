/**
 * Phase 14 — useLiveData Hook
 * Auto-refreshing data query hook bound to real-time event triggers.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeEventType } from '../realtime/events';
import useRealtime from './useRealtime';

export interface UseLiveDataOptions<T> {
  fetcher: () => Promise<T>;
  triggerEvents: RealtimeEventType | RealtimeEventType[];
  initialData?: T;
  debounceMs?: number;
}

export function useLiveData<T>({
  fetcher,
  triggerEvents,
  initialData,
  debounceMs = 300,
}: UseLiveDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const executeFetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live data.');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  // Initial fetch
  useEffect(() => {
    executeFetch();
  }, [executeFetch]);

  // Real-time invalidation trigger
  useRealtime(triggerEvents, () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      executeFetch();
    }, debounceMs);
  });

  return {
    data,
    loading,
    error,
    refresh: executeFetch,
  };
}

export default useLiveData;
