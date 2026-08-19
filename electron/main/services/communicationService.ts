import Database from 'better-sqlite3';
import { CommunicationRepository, NotificationRow, AnnouncementRow, StaffMessageRow } from '../repositories/communicationRepository';
import { NotificationDispatcher } from './notificationDispatcher';
import { AuditRepository } from '../repositories/auditRepository';

export class CommunicationService {
  private commRepo: CommunicationRepository;
  private dispatcher: NotificationDispatcher;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.commRepo = new CommunicationRepository(db);
    this.dispatcher = new NotificationDispatcher(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeUserId(userId?: number): number | undefined {
    if (!userId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    return user ? userId : undefined;
  }

  // --- NOTIFICATIONS ---
  getMyNotifications(userId?: number, staffId?: number, filters?: { type?: string; isRead?: number }): NotificationRow[] {
    return this.commRepo.getNotificationsForUser(this.sanitizeUserId(userId), staffId, filters);
  }

  getUnreadCount(userId?: number, staffId?: number): number {
    return this.commRepo.getUnreadCount(this.sanitizeUserId(userId), staffId);
  }

  markAsRead(id: number, userId?: number): { success: boolean } {
    const validUser = this.sanitizeUserId(userId);
    this.commRepo.markAsRead(id, validUser);
    return { success: true };
  }

  markAllAsRead(userId?: number, staffId?: number): { success: boolean } {
    const validUser = this.sanitizeUserId(userId);
    this.commRepo.markAllAsRead(validUser, staffId);
    return { success: true };
  }

  // --- ANNOUNCEMENTS ---
  getAnnouncements(): AnnouncementRow[] {
    return this.commRepo.getAnnouncements();
  }

  createAnnouncement(input: {
    title: string;
    content: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    target_type?: string;
    target_id?: number;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.title || input.title.trim() === '') return { success: false, error: 'Announcement title is required.' };
    if (!input.content || input.content.trim() === '') return { success: false, error: 'Announcement content is required.' };

    const validActor = this.sanitizeUserId(actorUserId);
    const id = this.commRepo.createAnnouncement({
      title: input.title,
      content: input.content,
      priority: input.priority,
      target_type: input.target_type,
      target_id: input.target_id,
      created_by: validActor,
    });

    // Also dispatch notification for announcement
    this.dispatcher.dispatch({
      event: 'SYSTEM' as any,
      data: {},
      referenceType: 'ANNOUNCEMENT',
      referenceId: id,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'ANNOUNCEMENT_CREATED',
      entity_type: 'ANNOUNCEMENT',
      entity_id: id,
      new_value: `Created announcement '${input.title}'`,
    });

    return { success: true, id };
  }

  // --- MESSAGES ---
  getMyMessages(userId: number): StaffMessageRow[] {
    const validUser = this.sanitizeUserId(userId);
    if (!validUser) return [];
    return this.commRepo.getMessagesForUser(validUser);
  }

  sendMessage(input: {
    recipient_user_id?: number;
    recipient_staff_id?: number;
    subject: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }, actorUserId: number): { success: boolean; id?: number; error?: string } {
    const validSender = this.sanitizeUserId(actorUserId);
    if (!validSender) return { success: false, error: 'Valid sender user is required.' };
    if (!input.subject || input.subject.trim() === '') return { success: false, error: 'Subject is required.' };
    if (!input.message || input.message.trim() === '') return { success: false, error: 'Message body is required.' };

    const id = this.commRepo.sendMessage({
      sender_user_id: validSender,
      recipient_user_id: input.recipient_user_id,
      recipient_staff_id: input.recipient_staff_id,
      subject: input.subject,
      message: input.message,
      priority: input.priority,
    });

    // Notify recipient
    this.commRepo.createNotification({
      recipient_user_id: input.recipient_user_id,
      recipient_staff_id: input.recipient_staff_id,
      type: 'MESSAGE',
      title: `Direct Message: ${input.subject}`,
      message: input.message.slice(0, 100),
      priority: input.priority || 'NORMAL',
      reference_type: 'MESSAGE',
      reference_id: id,
    });

    this.auditRepo.log({
      user_id: validSender,
      action: 'MESSAGE_SENT',
      entity_type: 'MESSAGE',
      entity_id: id,
      new_value: `Sent direct message '${input.subject}'`,
    });

    return { success: true, id };
  }
}
