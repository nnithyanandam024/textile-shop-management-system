import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { CommunicationService } from '../services/communicationService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerCommunicationHandlers(db: Database.Database) {
  ipcMain.handle('notifications:get-my', (_, filters?: any) => {
    AuthorizationService.requirePermission('communication.view');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.getMyNotifications(session?.userId, session?.staffId, filters);
  });

  ipcMain.handle('notifications:get-unread-count', () => {
    AuthorizationService.requirePermission('communication.view');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.getUnreadCount(session?.userId, session?.staffId);
  });

  ipcMain.handle('notifications:mark-read', (_, id: number) => {
    AuthorizationService.requirePermission('communication.view');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.markAsRead(id, session?.userId);
  });

  ipcMain.handle('notifications:mark-all-read', () => {
    AuthorizationService.requirePermission('communication.view');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.markAllAsRead(session?.userId, session?.staffId);
  });

  ipcMain.handle('announcements:get-all', () => {
    AuthorizationService.requirePermission('communication.view');
    const service = new CommunicationService(db);
    return service.getAnnouncements();
  });

  ipcMain.handle('announcements:create', (_, input: any) => {
    AuthorizationService.requirePermission('communication.send_announcement');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.createAnnouncement(input, session?.userId);
  });

  ipcMain.handle('messages:get-my', () => {
    AuthorizationService.requirePermission('communication.view');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.getMyMessages(session?.userId || 1);
  });

  ipcMain.handle('messages:send', (_, input: any) => {
    AuthorizationService.requirePermission('communication.send');
    const session = SessionService.getSession();
    const service = new CommunicationService(db);
    return service.sendMessage(input, session?.userId || 1);
  });
}
