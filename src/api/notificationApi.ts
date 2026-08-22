import apiClient, { ApiResponse } from './client';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  /**
   * Get categorized notifications for current staff
   */
  async getNotifications(filters?: { category?: string; isRead?: number }): Promise<ApiResponse<{ unreadCount: number; notifications: NotificationItem[] }>> {
    if (typeof window !== 'undefined' && window.api?.staffNotificationCenter?.getAll) {
      try {
        const res = await window.api.staffNotificationCenter.getAll(undefined, filters);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/notifications', { params: filters });
  },

  /**
   * Mark individual notification as read
   */
  async markAsRead(id: number): Promise<ApiResponse<{ success: boolean }>> {
    if (typeof window !== 'undefined' && window.api?.staffNotificationCenter?.markRead) {
      try {
        const res = await window.api.staffNotificationCenter.markRead(id);
        if (res.success) {
          return { success: true, data: { success: true } };
        }
      } catch {}
    }
    return apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    if (typeof window !== 'undefined' && window.api?.staffNotificationCenter?.markAllRead) {
      try {
        const res = await window.api.staffNotificationCenter.markAllRead();
        if (res.success) {
          return { success: true, data: { success: true }, message: 'All notifications marked as read.' };
        }
      } catch {}
    }
    return apiClient.post<{ success: boolean }>('/notifications/mark-all-read');
  },
};

export default notificationApi;
