import fs from 'fs';
import path from 'path';
import { getDatabasePath, getBackupDirectoryPath, closeDatabase, initDatabase } from '../database';
import { BackupService } from './backupService';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export class RestoreService {
  static async restoreBackup(backupFilename: string, actorUserId?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const backupDir = getBackupDirectoryPath();
      const targetBackupPath = path.join(backupDir, backupFilename);

      if (!fs.existsSync(targetBackupPath)) {
        return { success: false, error: `Backup file ${backupFilename} does not exist.` };
      }

      // 1. Verify Target Backup File Integrity
      const verification = BackupService.verifyBackupFile(targetBackupPath);
      if (!verification.valid) {
        return { success: false, error: `Cannot restore: Backup file failed integrity check (${verification.error || 'corrupted'}).` };
      }

      // 2. Create Emergency Safety Backup of Live Database
      log.info('Creating Emergency Safety Backup before restore...');
      const emergencyRes = await BackupService.createBackup(`emergency_before_restore_${Date.now()}.db`, true);
      if (!emergencyRes.success || !emergencyRes.backupPath) {
        return { success: false, error: `Restore aborted: Failed to create emergency safety backup (${emergencyRes.error}).` };
      }

      const emergencyBackupPath = emergencyRes.backupPath;

      // 3. Close Live Database Connection
      log.info('Closing database connection for restore operation...');
      closeDatabase();

      const liveDbPath = getDatabasePath();

      // 4. Perform File Swap
      try {
        fs.copyFileSync(targetBackupPath, liveDbPath);
        log.info(`Overwrote live database with backup ${backupFilename}`);
      } catch (copyErr: any) {
        log.error('Failed to copy backup file over live database:', copyErr);
        // Re-open original database
        initDatabase();
        return { success: false, error: `File copy failed: ${copyErr.message}` };
      }

      // 5. Reinitialize Database Connection & Perform Post-Restore Integrity Check
      const newDb = initDatabase();
      const integrity = BackupService.checkIntegrity(newDb);

      if (!integrity.healthy || !integrity.foreignKeysOk) {
        log.error('Post-restore database failed integrity check! Executing automatic rollback...');
        closeDatabase();

        // 6. AUTOMATIC ROLLBACK TO EMERGENCY BACKUP
        fs.copyFileSync(emergencyBackupPath, liveDbPath);
        initDatabase();

        return {
          success: false,
          error: 'Post-restore database integrity check failed. Automatically rolled back to emergency safety backup.',
        };
      }

      // 7. Record Security Audit Log
      const auditRepo = new AuditRepository(newDb);
      auditRepo.log({
        user_id: actorUserId,
        action: 'DATABASE_RESTORE',
        entity_type: 'SYSTEM',
        new_value: `Restored database from backup ${backupFilename} (Emergency safety snapshot created at ${path.basename(emergencyBackupPath)})`,
      });

      log.info(`Database restore from ${backupFilename} completed successfully and verified!`);
      return { success: true };
    } catch (error: any) {
      log.error('Database restore error:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}
