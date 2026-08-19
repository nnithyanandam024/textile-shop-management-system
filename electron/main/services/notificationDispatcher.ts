import Database from 'better-sqlite3';
import { CommunicationRepository } from '../repositories/communicationRepository';
import { DesktopNotificationService } from './desktopNotificationService';
import { formatNotificationTemplate, NotificationTemplatePayload } from './notificationTemplates';

export class NotificationDispatcher {
  private commRepo: CommunicationRepository;

  constructor(private db: Database.Database) {
    this.commRepo = new CommunicationRepository(db);
  }

  dispatch(payload: NotificationTemplatePayload & {
    recipientUserId?: number;
    recipientStaffId?: number;
    referenceType?: string;
    referenceId?: number;
  }): { notificationId: number; desktopShown: boolean } {
    const formatted = formatNotificationTemplate(payload);

    // 1. Save in-app notification record
    const notificationId = this.commRepo.createNotification({
      recipient_user_id: payload.recipientUserId,
      recipient_staff_id: payload.recipientStaffId,
      type: formatted.type,
      title: formatted.title,
      message: formatted.message,
      priority: formatted.priority,
      reference_type: payload.referenceType,
      reference_id: payload.referenceId,
    });

    // 2. Trigger native OS Desktop Alert
    const desktopShown = DesktopNotificationService.sendDesktopAlert({
      title: formatted.title,
      body: formatted.message,
      priority: formatted.priority,
    });

    return { notificationId, desktopShown };
  }
}
