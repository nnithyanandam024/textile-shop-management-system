import { Notification } from 'electron';

export class DesktopNotificationService {
  static sendDesktopAlert(options: {
    title: string;
    body: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    onClick?: () => void;
  }): boolean {
    if (!Notification || typeof Notification.isSupported !== 'function' || !Notification.isSupported()) {
      return false;
    }

    try {
      const notif = new Notification({
        title: `🔔 ${options.title}`,
        body: options.body,
        urgency: options.priority === 'URGENT' ? 'critical' : options.priority === 'HIGH' ? 'normal' : 'low',
        silent: options.priority === 'LOW',
      });

      if (options.onClick) {
        notif.on('click', options.onClick);
      }

      notif.show();
      return true;
    } catch {
      return false;
    }
  }
}
