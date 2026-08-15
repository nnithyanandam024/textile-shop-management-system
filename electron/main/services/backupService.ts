import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDatabasePath, getBackupDirectoryPath, getDatabase } from '../database';
import log from '../logger';

export interface BackupMetadata {
  id: string;
  filename: string;
  filepath: string;
  sizeBytes: number;
  sha256: string;
  status: 'VERIFIED' | 'FAILED';
  isEmergency: boolean;
  createdAt: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  databasePath: string;
  backupDirectory: string;
  sizeBytes: number;
  tablesCount: number;
  settingsCount: number;
  integrityPassed: boolean;
  foreignKeysPassed: boolean;
  lastBackupDate?: string;
  error?: string;
}

export class BackupService {
  static checkIntegrity(dbInstance?: Database.Database): { healthy: boolean; foreignKeysOk: boolean; error?: string } {
    try {
      const db = dbInstance || getDatabase();
      const checkRow: any = db.prepare('PRAGMA quick_check').get();
      const fkRows = db.prepare('PRAGMA foreign_key_check').all();

      const healthy = checkRow?.quick_check === 'ok';
      const foreignKeysOk = fkRows.length === 0;

      return { healthy, foreignKeysOk };
    } catch (err: any) {
      log.error('SQLite integrity check error:', err);
      return { healthy: false, foreignKeysOk: false, error: err.message || String(err) };
    }
  }

  static computeSHA256(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  static async createBackup(customBackupName?: string, isEmergency: boolean = false): Promise<{ success: boolean; backupPath?: string; sha256?: string; error?: string }> {
    try {
      const dbPath = getDatabasePath();
      if (!fs.existsSync(dbPath)) {
        return { success: false, error: 'Database file does not exist.' };
      }

      const backupDir = getBackupDirectoryPath();
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const prefix = isEmergency ? 'emergency_' : 'backup_';
      const filename = customBackupName || `${prefix}${timestamp}.db`;
      const targetPath = path.join(backupDir, filename);

      log.info(`Creating SQLite backup at: ${targetPath}`);

      const db = getDatabase();
      await db.backup(targetPath);

      // Verify backup file integrity
      const verification = this.verifyBackupFile(targetPath);
      const sha256 = this.computeSHA256(targetPath);

      if (!verification.valid) {
        log.error(`Backup file created at ${targetPath} failed integrity check!`);
        return { success: false, error: 'Backup file failed integrity verification.' };
      }

      // Rotate backups (keep latest 10)
      this.rotateBackups(10);

      log.info(`Backup ${filename} created and verified (SHA256: ${sha256.substring(0, 12)}...)`);
      return { success: true, backupPath: targetPath, sha256 };
    } catch (error: any) {
      log.error('Error during database backup creation:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  static verifyBackupFile(backupPath: string): { valid: boolean; error?: string } {
    if (!fs.existsSync(backupPath)) {
      return { valid: false, error: 'File does not exist.' };
    }

    try {
      const testDb = new Database(backupPath, { readonly: true });
      const checkRow: any = testDb.prepare('PRAGMA quick_check').get();
      testDb.close();

      const valid = checkRow?.quick_check === 'ok';
      return { valid };
    } catch (err: any) {
      return { valid: false, error: err.message || String(err) };
    }
  }

  static getBackupsList(): BackupMetadata[] {
    try {
      const backupDir = getBackupDirectoryPath();
      if (!fs.existsSync(backupDir)) return [];

      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db'));
      files.sort((a, b) => fs.statSync(path.join(backupDir, b)).mtimeMs - fs.statSync(path.join(backupDir, a)).mtimeMs);

      return files.map((filename) => {
        const filepath = path.join(backupDir, filename);
        const stats = fs.statSync(filepath);
        const isEmergency = filename.startsWith('emergency_');
        const verification = this.verifyBackupFile(filepath);
        const sha256 = this.computeSHA256(filepath);

        return {
          id: filename,
          filename,
          filepath,
          sizeBytes: stats.size,
          sha256,
          status: verification.valid ? 'VERIFIED' : 'FAILED',
          isEmergency,
          createdAt: new Date(stats.mtimeMs).toISOString(),
        };
      });
    } catch (err) {
      log.error('Failed to list backups:', err);
      return [];
    }
  }

  static rotateBackups(retentionCount: number = 10) {
    try {
      const backupDir = getBackupDirectoryPath();
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db') && !f.startsWith('emergency_'));
      files.sort((a, b) => fs.statSync(path.join(backupDir, b)).mtimeMs - fs.statSync(path.join(backupDir, a)).mtimeMs);

      if (files.length > retentionCount) {
        const toDelete = files.slice(retentionCount);
        toDelete.forEach((f) => {
          const p = path.join(backupDir, f);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        });
      }
    } catch (err) {
      log.error('Backup rotation error:', err);
    }
  }

  static exportBackup(filename: string, targetDir: string): { success: boolean; error?: string } {
    try {
      const backupDir = getBackupDirectoryPath();
      const sourcePath = path.join(backupDir, filename);
      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source backup file not found.' };
      }

      const destPath = path.join(targetDir, filename);
      fs.copyFileSync(sourcePath, destPath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  static deleteBackup(filename: string): { success: boolean; error?: string } {
    try {
      const backupDir = getBackupDirectoryPath();
      const targetPath = path.join(backupDir, filename);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
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

      const integrity = this.checkIntegrity(db);
      const backups = this.getBackupsList();
      const lastBackupDate = backups.length > 0 ? backups[0].createdAt : undefined;

      return {
        status: integrity.healthy && integrity.foreignKeysOk ? 'healthy' : 'warning',
        databasePath: dbPath,
        backupDirectory: backupDir,
        sizeBytes: stats.size,
        tablesCount: tablesRow.count,
        settingsCount: settingsRow.count,
        integrityPassed: integrity.healthy,
        foreignKeysPassed: integrity.foreignKeysOk,
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
        integrityPassed: false,
        foreignKeysPassed: false,
        error: error.message || String(error),
      };
    }
  }
}
