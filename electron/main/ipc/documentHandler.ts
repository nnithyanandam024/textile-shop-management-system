import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { DocumentService } from '../services/documentService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerDocumentHandlers(db: Database.Database) {
  ipcMain.handle('documents:get-categories', () => {
    AuthorizationService.requirePermission('documents.view');
    const service = new DocumentService(db);
    return service.getCategories();
  });

  ipcMain.handle('documents:get-all', (_, filters?: any) => {
    AuthorizationService.requirePermission('documents.view');
    const service = new DocumentService(db);
    return service.getDocuments(filters);
  });

  ipcMain.handle('documents:get-by-id', (_, id: number) => {
    AuthorizationService.requirePermission('documents.view');
    const session = SessionService.getSession();
    const service = new DocumentService(db);
    return service.getDocumentById(id, session?.userId);
  });

  ipcMain.handle('documents:upload', (_, input: any) => {
    AuthorizationService.requirePermission('documents.upload');
    const session = SessionService.getSession();
    const service = new DocumentService(db);
    return service.uploadDocument(input, session?.userId);
  });

  ipcMain.handle('documents:read-base64', (_, documentId: number) => {
    AuthorizationService.requirePermission('documents.download');
    const session = SessionService.getSession();
    const service = new DocumentService(db);
    return service.readDocumentBase64(documentId, session?.userId);
  });

  ipcMain.handle('documents:verify', (_, documentId: number) => {
    AuthorizationService.requirePermission('documents.verify');
    const session = SessionService.getSession();
    const service = new DocumentService(db);
    return service.verifyDocument(documentId, session?.userId || 1);
  });

  ipcMain.handle('documents:reject', (_, { documentId, reason }: { documentId: number; reason: string }) => {
    AuthorizationService.requirePermission('documents.reject');
    const session = SessionService.getSession();
    const service = new DocumentService(db);
    return service.rejectDocument(documentId, reason, session?.userId || 1);
  });

  ipcMain.handle('documents:replace', (_, { documentId, fileName, buffer, reason }: { documentId: number; fileName: string; buffer: Buffer; reason?: string }) => {
    AuthorizationService.requirePermission('documents.replace');
    const session = SessionService.getSession();
    const service = new DocumentService(db);
    return service.replaceDocument(documentId, { file_name: fileName, buffer, reason }, session?.userId);
  });

  ipcMain.handle('documents:get-expiring', (_, thresholdDays?: number) => {
    AuthorizationService.requirePermission('documents.view');
    const service = new DocumentService(db);
    return service.getExpiringDocuments(thresholdDays);
  });

  ipcMain.handle('documents:get-compliance', (_, staffId: number) => {
    AuthorizationService.requirePermission('documents.view');
    const service = new DocumentService(db);
    return service.getStaffCompliance(staffId);
  });
}
