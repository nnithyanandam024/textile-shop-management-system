import { useState, useEffect, useCallback } from 'react';
import {
  staffNotificationCenterService,
  StaffNotificationItem,
} from '../services/staffNotificationCenterService';

export function useStaffNotifications() {
  const [notifications, setNotifications] = useState<StaffNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [readStateFilter, setReadStateFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (categoryFilter !== 'ALL') filters.category = categoryFilter;
      if (readStateFilter === 'UNREAD') filters.isRead = 0;

      const summary = await staffNotificationCenterService.getNotifications(filters);
      setNotifications(summary.notifications);
      setUnreadCount(summary.unreadCount);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, readStateFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId: number) => {
    try {
      await staffNotificationCenterService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message || 'Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await staffNotificationCenterService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message || 'Failed to mark all as read.');
    }
  };

  return {
    notifications,
    unreadCount,
    categoryFilter,
    readStateFilter,
    loading,
    error,
    setCategoryFilter,
    setReadStateFilter,
    onMarkRead: handleMarkRead,
    onMarkAllRead: handleMarkAllRead,
    refresh: loadNotifications,
    clearError: () => setError(null),
  };
}
