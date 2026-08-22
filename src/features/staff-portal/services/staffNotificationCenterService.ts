export interface StaffNotificationItem {
  id: number;
  recipientStaffId?: number;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  referenceType?: string;
  referenceId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface StaffNotificationSummary {
  unreadCount: number;
  totalCount: number;
  notifications: StaffNotificationItem[];
}

export class StaffNotificationCenterService {
  async getNotifications(filters?: { category?: string; isRead?: number }): Promise<StaffNotificationSummary> {
    if (window.api?.staffNotificationCenter?.getAll) {
      const res = await window.api.staffNotificationCenter.getAll(undefined, filters);
      if (!res.success) throw new Error(res.error || 'Failed to load notifications.');
      return res.data;
    }
    return { unreadCount: 0, totalCount: 0, notifications: [] };
  }

  async markRead(notificationId: number): Promise<boolean> {
    if (window.api?.staffNotificationCenter?.markRead) {
      const res = await window.api.staffNotificationCenter.markRead(notificationId);
      if (!res.success) throw new Error(res.error || 'Failed to mark notification as read.');
      return Boolean(res.data);
    }
    return true;
  }

  async markAllRead(): Promise<boolean> {
    if (window.api?.staffNotificationCenter?.markAllRead) {
      const res = await window.api.staffNotificationCenter.markAllRead();
      if (!res.success) throw new Error(res.error || 'Failed to mark all as read.');
      return Boolean(res.data);
    }
    return true;
  }
}

export const staffNotificationCenterService = new StaffNotificationCenterService();
