import { ipcMain, app } from 'electron';
import os from 'os';
import { getDatabase, getDatabasePath, getBackupDirectoryPath } from '../database';
import log from '../logger';

export function registerIpcHandlers() {
  // App Version
  ipcMain.handle('app:get-version', () => {
    return app.getVersion() || '0.1.0';
  });

  // System Info
  ipcMain.handle('app:get-system-info', () => {
    return {
      appName: 'Textile Shop Management System',
      version: app.getVersion() || '0.1.0',
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: os.arch(),
      totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMB: Math.round(os.freemem() / (1024 * 1024)),
      dbPath: getDatabasePath(),
      backupPath: getBackupDirectoryPath(),
    };
  });

  // DB Health Check
  ipcMain.handle('db:check-status', () => {
    try {
      const db = getDatabase();
      const result = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
      return {
        status: 'online',
        path: getDatabasePath(),
        settingsCount: result.count,
      };
    } catch (error) {
      log.error('DB Status Check Error:', error);
      return {
        status: 'error',
        error: String(error),
      };
    }
  });

  // Get All Settings
  ipcMain.handle('settings:get-all', () => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
      const settingsMap: Record<string, string> = {};
      for (const row of rows) {
        settingsMap[row.key] = row.value;
      }
      return { success: true, data: settingsMap };
    } catch (error) {
      log.error('Error fetching settings:', error);
      return { success: false, error: String(error) };
    }
  });

  // Update Setting
  ipcMain.handle('settings:update', (_, { key, value }: { key: string; value: string }) => {
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(key, value);
      return { success: true };
    } catch (error) {
      log.error(`Error updating setting [${key}]:`, error);
      return { success: false, error: String(error) };
    }
  });

  // Log from renderer
  ipcMain.handle('app:log', (_, { level, message, details }: { level: string; message: string; details?: any }) => {
    if (level === 'error') {
      log.error(`[Renderer] ${message}`, details || '');
    } else if (level === 'warn') {
      log.warn(`[Renderer] ${message}`, details || '');
    } else {
      log.info(`[Renderer] ${message}`, details || '');
    }
    return true;
  });
}
