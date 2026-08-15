import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getDatabasePath, getBackupDirectoryPath, getDatabase } from '../database';
import log from '../logger';

export interface HealthCheckResult {
  status: 'healthy' | 'error';
  databasePath: string;
  backupDirectory: string;
  sizeBytes: number;
  tablesCount: number;
  settingsCount: number;
  lastBackupDate?: string;
  error?: string;
}

export class BackupService {
  static createBackup(customBackupName?: string): { success: boolean; backupPath?: string; error?: string } {
    try {
      const dbPath = getDatabasePath();
      if (!fs.existsSync(dbPath)) {
        return { success: false, error: 'Database file does not exist.' };
      }

      const backupDir = getBackupDirectoryPath();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = customBackupName || `backup_${timestamp}.db`;
      const targetPath = path.join(backupDir, filename);

      log.info(`Creating SQLite backup at: ${targetPath}`);

      const db = getDatabase();
      // SQLite backup API creates an online, consistent database backup safely even during active reads/writes
      db.backup(targetPath)
        .then(() => {
          log.info('SQLite database backup created successfully.');
        })
        .catch((err) => {
          log.error('SQLite backup failed:', err);
        });

      return { success: true, backupPath: targetPath };
    } catch (error: any) {
      log.error('Error during database backup creation:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  static getHealthCheck(): HealthCheckResult {
    try {
      const dbPath = getDatabasePath();
      const backupDir = getBackupDirectoryPath();
      const stats = fs.statSync(dbPath);

      const db = getDatabase();
      const tablesRow = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number };
      const settingsRow = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };

      const backups = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db'));
      backups.sort((a, b) => fs.statSync(path.join(backupDir, b)).mtimeMs - fs.statSync(path.join(backupDir, a)).mtimeMs);

      const lastBackupDate = backups.length > 0
        ? new Date(fs.statSync(path.join(backupDir, backups[0])).mtimeMs).toISOString()
        : undefined;

      return {
        status: 'healthy',
        databasePath: dbPath,
        backupDirectory: backupDir,
        sizeBytes: stats.size,
        tablesCount: tablesRow.count,
        settingsCount: settingsRow.count,
        lastBackupDate,
      };
    } catch (error: any) {
      log.error('Database health check failed:', error);
      return {
        status: 'error',
        databasePath: getDatabasePath(),
        backupDirectory: getBackupDirectoryPath(),
        sizeBytes: 0,
        tablesCount: 0,
        settingsCount: 0,
        error: error.message || String(error),
      };
    }
  }
}
