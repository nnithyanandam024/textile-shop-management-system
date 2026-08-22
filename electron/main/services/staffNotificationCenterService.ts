import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { eventBus } from '../realtime/eventBus';

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
  constructor(private db: Database.Database) {}

  private resolveStaffId(staffId?: number): number {
    if (staffId) return staffId;
    const session = SessionService.getSession();
    if (session?.staffId) return session.staffId;
    if (session?.userId) {
      const row = this.db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as { id: number } | undefined;
      if (row) return row.id;
    }
    return 1;
  }

  private resolveUserId(staffId?: number): number | null {
    if (!staffId) {
      const session = SessionService.getSession();
      return session?.userId || null;
    }
    const row = this.db.prepare('SELECT user_id FROM staff WHERE id = ?').get(staffId) as { user_id: number } | undefined;
    return row?.user_id || null;
  }

  /**
   * 1. Get Categorized Notifications with Unread Count
   */
  getNotifications(staffId?: number, filters?: { category?: string; isRead?: number }): StaffNotificationSummary {
    const sId = this.resolveStaffId(staffId);
    const userId = this.resolveUserId(sId);

    let sql = `
      SELECT * FROM notifications
      WHERE (recipient_staff_id = ? OR recipient_user_id = ? OR (recipient_staff_id IS NULL AND recipient_user_id IS NULL))
    `;
    const params: any[] = [sId, userId];

    if (filters?.category && filters.category !== 'ALL') {
      sql += ' AND type = ?';
      params.push(filters.category);
    }

    if (filters?.isRead !== undefined) {
      sql += ' AND is_read = ?';
      params.push(filters.isRead);
    }

    sql += ' ORDER BY id DESC LIMIT 50';

    const rows = this.db.prepare(sql).all(...params) as any[];

    // Unread count
    const unreadRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE (recipient_staff_id = ? OR recipient_user_id = ? OR (recipient_staff_id IS NULL AND recipient_user_id IS NULL))
        AND is_read = 0
    `).get(sId, userId) as { count: number };

    return {
      unreadCount: unreadRow?.count || 0,
      totalCount: rows.length,
      notifications: rows.map((r) => ({
        id: r.id,
        recipientStaffId: r.recipient_staff_id || undefined,
        type: r.type,
        title: r.title,
        message: r.message,
        priority: r.priority || 'NORMAL',
        referenceType: r.reference_type || undefined,
        referenceId: r.reference_id || undefined,
        isRead: Boolean(r.is_read),
        readAt: r.read_at || undefined,
        createdAt: r.created_at,
      })),
    };
  }

  /**
   * 2. Mark Single Notification as Read
   */
  markAsRead(notificationId: number, staffId?: number): boolean {
    const sId = this.resolveStaffId(staffId);
    const userId = this.resolveUserId(sId);

    this.db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (recipient_staff_id = ? OR recipient_user_id = ? OR (recipient_staff_id IS NULL AND recipient_user_id IS NULL))
    `).run(notificationId, sId, userId);

    return true;
  }

  /**
   * 3. Mark All Notifications as Read
   */
  markAllAsRead(staffId?: number): boolean {
    const sId = this.resolveStaffId(staffId);
    const userId = this.resolveUserId(sId);

    this.db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE (recipient_staff_id = ? OR recipient_user_id = ? OR (recipient_staff_id IS NULL AND recipient_user_id IS NULL))
        AND is_read = 0
    `).run(sId, userId);

    return true;
  }

  /**
   * 4. Create Notification Helper
   */
  createNotification(input: {
    recipientStaffId?: number;
    recipientUserId?: number;
    type: string;
    title: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    referenceType?: string;
    referenceId?: number;
  }): number {
    const res = this.db.prepare(`
      INSERT INTO notifications (
        recipient_staff_id, recipient_user_id, type, title, message, priority, reference_type, reference_id, is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      input.recipientStaffId || null,
      input.recipientUserId || null,
      input.type,
      input.title,
      input.message,
      input.priority || 'NORMAL',
      input.referenceType || null,
      input.referenceId || null
    );

    const notifId = Number(res.lastInsertRowid);

    try {
      eventBus.publish('NOTIFICATION_CREATED', {
        id: notifId,
        title: input.title,
        message: input.message,
        type: input.type,
        recipientStaffId: input.recipientStaffId,
        recipientUserId: input.recipientUserId,
        createdAt: new Date().toISOString(),
      }, {
        targetStaffId: input.recipientStaffId,
        targetUserId: input.recipientUserId,
      });
    } catch {}

    return notifId;
  }
}
