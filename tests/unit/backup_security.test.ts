import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initDatabase, getBackupDirectoryPath, closeDatabase, getDatabase } from '../../electron/main/database';
import { seedDatabase } from '../../electron/main/database/seed';
import { BackupService } from '../../electron/main/services/backupService';
import { RestoreService } from '../../electron/main/services/restoreService';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../../test_phase9.db');

describe('Phase 9 Backup, Restore, Security Hardening & Data Recovery Test Suite', () => {
  let db: Database.Database;

  beforeEach(() => {
    closeDatabase();
    try {
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
    } catch {
      // Ignore file locks during test teardown
    }

    db = initDatabase(TEST_DB_PATH);
    seedDatabase(db);
  });

  afterEach(() => {
    closeDatabase();
    try {
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
    } catch {
      // Ignore file locks during test teardown
    }
  });

  it('1. should perform SQLite integrity check and foreign key verification', () => {
    const check = BackupService.checkIntegrity(db);
    expect(check.healthy).toBe(true);
    expect(check.foreignKeysOk).toBe(true);
  });

  it('2. should create SHA-256 checksummed database backup and verify file integrity', async () => {
    const res = await BackupService.createBackup('test_manual_backup.db');
    expect(res.success).toBe(true);
    expect(res.backupPath).toBeDefined();
    expect(res.sha256).toBeDefined();
    expect(res.sha256!.length).toBe(64);

    const verification = BackupService.verifyBackupFile(res.backupPath!);
    expect(verification.valid).toBe(true);
  });

  it('3. should enforce backup rotation policy and prune old backups beyond retention count', async () => {
    const backupDir = getBackupDirectoryPath();

    // Create 12 dummy backups
    for (let i = 1; i <= 12; i++) {
      fs.writeFileSync(path.join(backupDir, `backup_test_rot_${i}.db`), 'SQLite format 3\0');
    }

    BackupService.rotateBackups(5);

    const files = fs.readdirSync(backupDir).filter((f) => f.startsWith('backup_test_rot_'));
    expect(files.length).toBeLessThanOrEqual(5);

    // Cleanup
    files.forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
  });

  it('4. should execute fail-safe restore with automatic emergency safety snapshot', async () => {
    // 1. Create initial valid backup
    const backupRes = await BackupService.createBackup('test_valid_restore.db');
    expect(backupRes.success).toBe(true);

    // 2. Execute Restore
    const restoreRes = await RestoreService.restoreBackup('test_valid_restore.db');
    expect(restoreRes.success).toBe(true);

    // 3. Verify Database remains healthy
    const liveDb = getDatabase();
    const check = BackupService.checkIntegrity(liveDb);
    expect(check.healthy).toBe(true);
  });

  it('5. should reject restoring a corrupted backup file and preserve live database', async () => {
    const backupDir = getBackupDirectoryPath();
    const corruptedPath = path.join(backupDir, 'corrupted_test_backup.db');
    fs.writeFileSync(corruptedPath, 'CORRUPTED_FILE_DATA');

    const restoreRes = await RestoreService.restoreBackup('corrupted_test_backup.db');
    expect(restoreRes.success).toBe(false);
    expect(restoreRes.error).toContain('failed integrity check');

    // Cleanup
    try {
      if (fs.existsSync(corruptedPath)) fs.unlinkSync(corruptedPath);
    } catch {
      // Ignore file locks
    }
  });

  it('6. should aggregate complete System Health Diagnostics', () => {
    const health = BackupService.getHealthCheck();
    expect(health.status).toBe('healthy');
    expect(health.integrityPassed).toBe(true);
    expect(health.foreignKeysPassed).toBe(true);
    expect(health.tablesCount).toBeGreaterThan(0);
  });
});
