import Database from 'better-sqlite3';

export interface NotificationRow {
  id: number;
  recipient_user_id?: number;
  recipient_staff_id?: number;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  reference_type?: string;
  reference_id?: number;
  is_read: number;
  read_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  target_type: string;
  target_id?: number;
  start_at: string;
  expires_at?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'CANCELLED';
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffMessageRow {
  id: number;
  sender_user_id: number;
  sender_name?: string;
  recipient_user_id?: number;
  recipient_staff_id?: number;
  recipient_name?: string;
  subject: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  is_read: number;
  read_at?: string;
  created_at: string;
}

export class CommunicationRepository {
  constructor(private db: Database.Database) {}

  // --- NOTIFICATIONS ---
  getNotificationsForUser(userId?: number, staffId?: number, filters?: { type?: string; isRead?: number }): NotificationRow[] {
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const params: any[] = [];

    if (userId || staffId) {
      sql += ' AND (recipient_user_id = ? OR recipient_staff_id = ? OR (recipient_user_id IS NULL AND recipient_staff_id IS NULL))';
      params.push(userId || -1, staffId || -1);
    }

    if (filters?.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters?.isRead !== undefined) {
      sql += ' AND is_read = ?';
      params.push(filters.isRead);
    }

    sql += ' ORDER BY id DESC LIMIT 200';
    return this.db.prepare(sql).all(...params) as NotificationRow[];
  }

  getUnreadCount(userId?: number, staffId?: number): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE is_read = 0 AND (recipient_user_id = ? OR recipient_staff_id = ? OR (recipient_user_id IS NULL AND recipient_staff_id IS NULL))
    `).get(userId || -1, staffId || -1) as { count: number };
    return row?.count || 0;
  }

  private validUserId(userId?: number): number | null {
    if (!userId) return null;
    const row = this.db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    return row ? userId : null;
  }

  private validStaffId(staffId?: number): number | null {
    if (!staffId) return null;
    const row = this.db.prepare('SELECT id FROM staff WHERE id = ?').get(staffId);
    return row ? staffId : null;
  }

  createNotification(input: {
    recipient_user_id?: number;
    recipient_staff_id?: number;
    type: string;
    title: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    reference_type?: string;
    reference_id?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO notifications (
        recipient_user_id, recipient_staff_id, type, title, message, priority, reference_type, reference_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      this.validUserId(input.recipient_user_id), this.validStaffId(input.recipient_staff_id), input.type,
      input.title.trim(), input.message.trim(), input.priority || 'NORMAL',
      input.reference_type || null, input.reference_id || null
    );
    return Number(info.lastInsertRowid);
  }

  markAsRead(id: number, userId?: number): void {
    this.db.prepare(`
      UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (recipient_user_id = ? OR recipient_user_id IS NULL)
    `).run(id, userId || -1);
  }

  markAllAsRead(userId?: number, staffId?: number): void {
    this.db.prepare(`
      UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE is_read = 0 AND (recipient_user_id = ? OR recipient_staff_id = ? OR (recipient_user_id IS NULL AND recipient_staff_id IS NULL))
    `).run(userId || -1, staffId || -1);
  }

  // --- ANNOUNCEMENTS ---
  getAnnouncements(): AnnouncementRow[] {
    return this.db.prepare(`
      SELECT a.*, u.display_name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.id DESC
    `).all() as AnnouncementRow[];
  }

  createAnnouncement(input: {
    title: string;
    content: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    target_type?: string;
    target_id?: number;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO announcements (title, content, priority, target_type, target_id, status, created_by)
      VALUES (?, ?, ?, ?, ?, 'PUBLISHED', ?)
    `).run(
      input.title.trim(), input.content.trim(), input.priority || 'NORMAL',
      input.target_type || 'ALL_STAFF', input.target_id || null, this.validUserId(input.created_by)
    );
    return Number(info.lastInsertRowid);
  }

  // --- MESSAGES ---
  getMessagesForUser(userId: number): StaffMessageRow[] {
    return this.db.prepare(`
      SELECT m.*, u1.display_name as sender_name, u2.display_name as recipient_name
      FROM staff_messages m
      LEFT JOIN users u1 ON m.sender_user_id = u1.id
      LEFT JOIN users u2 ON m.recipient_user_id = u2.id
      WHERE m.sender_user_id = ? OR m.recipient_user_id = ?
      ORDER BY m.id DESC
    `).all(userId, userId) as StaffMessageRow[];
  }

  sendMessage(input: {
    sender_user_id: number;
    recipient_user_id?: number;
    recipient_staff_id?: number;
    subject: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_messages (sender_user_id, recipient_user_id, recipient_staff_id, subject, message, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      input.sender_user_id, this.validUserId(input.recipient_user_id), this.validStaffId(input.recipient_staff_id),
      input.subject.trim(), input.message.trim(), input.priority || 'NORMAL'
    );
    return Number(info.lastInsertRowid);
  }
}
