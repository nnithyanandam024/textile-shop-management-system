/**
 * Phase 14 — useNotifications Hook
 * Live notification feed and unread count synchronized via real-time events.
 */
import { useState, useEffect, useCallback } from 'react';
import { notificationApi, NotificationItem } from '../api/notificationApi';
import useRealtime from './useRealtime';
import { RealtimeEvent, NotificationEventPayload } from '../realtime/events';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res.success && res.data) {
        const notifList = res.data.notifications || [];
        setNotifications(notifList);
        setUnreadCount(res.data.unreadCount ?? notifList.filter((n: NotificationItem) => !n.isRead).length);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Live real-time incoming notification handler
  useRealtime<NotificationEventPayload>('NOTIFICATION_CREATED', (event: RealtimeEvent<NotificationEventPayload>) => {
    const newNotif: NotificationItem = {
      id: event.data.id,
      title: event.data.title,
      message: event.data.message,
      type: event.data.type as any,
      priority: 'NORMAL',
      isRead: false,
      createdAt: event.data.createdAt || new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  const markAsRead = async (id: number) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await notificationApi.markAsRead(id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await notificationApi.markAllAsRead();
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotifications;
