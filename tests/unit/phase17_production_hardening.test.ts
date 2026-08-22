import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { loadAppConfig } from '../../electron/main/config/env';
import { RateLimiter } from '../../electron/main/security/rateLimiter';
import { Validators, ValidationError, sanitizeErrorMessage } from '../../electron/main/utils/validator';
import { BackupService } from '../../electron/main/services/backupService';
import { SystemHealthService } from '../../electron/main/services/systemHealthService';

describe('Phase 17 — Security Hardening, Performance & Production Readiness Test Suite', () => {
  const testDbPath = path.join(__dirname, '../.test_db/test_phase17_hardening.db');
  const testBackupDir = path.join(__dirname, '../.test_db/test_phase17_backups');
  let db: Database.Database;

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
    if (fs.existsSync(testBackupDir)) {
      try { fs.rmSync(testBackupDir, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(testBackupDir, { recursive: true });

    db = initDatabase(testDbPath);
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
    if (fs.existsSync(testBackupDir)) {
      try { fs.rmSync(testBackupDir, { recursive: true, force: true }); } catch {}
    }
  });

  // --- 1. ENVIRONMENT CONFIGURATION & SECRETS ISOLATION ---
  it('Test 1: Multi-Environment Loader & Config Fallback', () => {
    const prodConfig = loadAppConfig({
      NODE_ENV: 'production',
      APP_NAME: 'Textile Shop Enterprise',
      DB_BUSY_TIMEOUT: '6000',
      DB_CACHE_SIZE_MB: '128',
      BACKUP_RETENTION_DAILY: '14',
    });

    expect(prodConfig.nodeEnv).toBe('production');
    expect(prodConfig.appName).toBe('Textile Shop Enterprise');
    expect(prodConfig.dbBusyTimeout).toBe(6000);
    expect(prodConfig.dbCacheSizeMB).toBe(128);
    expect(prodConfig.backupRetentionDaily).toBe(14);
    expect(prodConfig.autoBackupEnabled).toBe(true);
  });

  // --- 2. RATE LIMITING & BRUTE FORCE DEFENSE ---
  it('Test 2: Rate Limiting Sliding-Window Attempt Tracking', () => {
    const limiter = new RateLimiter(3, 5, 15); // 3 max attempts
    const userKey = 'cashier.kavitha';

    // 1st failed attempt
    const r1 = limiter.recordFailure(userKey);
    expect(r1.allowed).toBe(true);
    expect(r1.remainingAttempts).toBe(2);

    // 2nd failed attempt
    const r2 = limiter.recordFailure(userKey);
    expect(r2.allowed).toBe(true);
    expect(r2.remainingAttempts).toBe(1);

    // 3rd failed attempt -> triggers lockout
    const r3 = limiter.recordFailure(userKey);
    expect(r3.allowed).toBe(false);
    expect(r3.remainingAttempts).toBe(0);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
    expect(r3.message).toContain('temporarily locked');
  });

  it('Test 3: Rate Limiting Account Lockout & Successful Reset', () => {
    const limiter = new RateLimiter(2, 10, 10);
    const userKey = 'manager.murugan';

    limiter.recordFailure(userKey);
    limiter.recordFailure(userKey);

    // Immediately locked out
    const lockedCheck = limiter.check(userKey);
    expect(lockedCheck.allowed).toBe(false);

    // Successful login resets attempts
    limiter.reset(userKey);
    const resetCheck = limiter.check(userKey);
    expect(resetCheck.allowed).toBe(true);
    expect(resetCheck.remainingAttempts).toBe(2);
  });

  // --- 3. SERVER-SIDE INPUT VALIDATORS ---
  it('Test 4: Strict Server-Side Validation: POS Cart Numbers & Bounds', () => {
    // 1. Empty cart validation
    expect(() => Validators.cartItems([])).toThrow(ValidationError);
    expect(() => Validators.cartItems(null)).toThrow('Cart cannot be empty');

    // 2. Negative or zero quantity
    expect(() => {
      Validators.cartItems([{ variantId: 1, quantity: -2, unitPrice: 1500 }]);
    }).toThrow(/must be greater than zero/);

    // 3. Negative price
    expect(() => {
      Validators.cartItems([{ variantId: 1, quantity: 1, unitPrice: -500 }]);
    }).toThrow(/cannot be negative/);

    // 4. Valid Cart
    const valid = Validators.cartItems([
      { variantId: 1, quantity: 2, unitPrice: 6500 },
      { variantId: 2, quantity: 1, unitPrice: 1200, discount: 50 },
    ]);
    expect(valid.length).toBe(2);
    expect(valid[0].unitPrice).toBe(6500);
  });

  it('Test 5: Strict Server-Side Validation: Discount Thresholds & Types', () => {
    // 1. Valid Percent Discount
    const pDisc = Validators.discount('PERCENT', 15);
    expect(pDisc.discountType).toBe('PERCENT');
    expect(pDisc.discountValue).toBe(15);

    // 2. Reject Percent Discount > 100%
    expect(() => Validators.discount('PERCENT', 120)).toThrow(/cannot exceed 100/);

    // 3. Valid Flat Discount
    const fDisc = Validators.discount('FLAT', 500);
    expect(fDisc.discountType).toBe('FLAT');
    expect(fDisc.discountValue).toBe(500);

    // 4. Invalid Discount Type
    expect(() => Validators.discount('BOGO', 50)).toThrow(/Invalid discount type/);
  });

  it('Test 6: Strict Server-Side Validation: Mobile Numbers & Email Format', () => {
    // 1. Standard 10-digit Indian Mobile
    expect(Validators.phone('9840199001')).toBe('9840199001');

    // 2. Mobile with spaces, dashes, +91 prefix
    expect(Validators.phone('+91 98401-99001')).toBe('9840199001');

    // 3. Invalid phone (< 10 digits or alphabets)
    expect(() => Validators.phone('9840199')).toThrow(/must be a valid 10-digit/);
    expect(() => Validators.phone('98401ABCDE')).toThrow(/must be a valid 10-digit/);

    // 4. Email validation
    expect(Validators.email('test@texora.shop')).toBe('test@texora.shop');
    expect(() => Validators.email('invalid-email-address')).toThrow(/Invalid email/);
  });

  // --- 4. PRODUCTION ERROR SANITIZATION ---
  it('Test 7: Production Error Sanitizer Prevents Path & Schema Leaks', () => {
    // 1. File path leak
    const pathError = new Error('Failed to write database at C:\\Users\\Administrator\\AppData\\Roaming\\TextileShop\\textile-shop.db: permission denied');
    const sanitizedPath = sanitizeErrorMessage(pathError);
    expect(sanitizedPath).not.toContain('C:\\Users');
    expect(sanitizedPath).toContain('[Internal Path]');

    // 2. SQL schema leak
    const sqlError = new Error('SQL error: SELECT id, password_hash, token FROM users WHERE is_active = 1 failed');
    const sanitizedSql = sanitizeErrorMessage(sqlError);
    expect(sanitizedSql).not.toContain('password_hash');

    // 3. SQLite busy code
    const busyError = new Error('SQLITE_BUSY: database is locked');
    const sanitizedBusy = sanitizeErrorMessage(busyError);
    expect(sanitizedBusy).toBe('Database is busy processing another transaction. Please retry in a moment.');
  });

  // --- 5. DATABASE PERFORMANCE PRAGMAS & INDEXES ---
  it('Test 8: Database Performance PRAGMAs Verification', () => {
    const journalMode = db.pragma('journal_mode', { simple: true });
    expect(journalMode).toBe('wal');

    const foreignKeys = db.pragma('foreign_keys', { simple: true });
    expect(foreignKeys).toBe(1);

    const busyTimeout = db.pragma('busy_timeout', { simple: true });
    expect(Number(busyTimeout)).toBeGreaterThanOrEqual(5000);
  });

  it('Test 9: Database Migration v6 Performance Indexes Execution', () => {
    const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string; tbl_name: string }>;
    const indexNames = indexes.map((i) => i.name);

    expect(indexNames).toContain('idx_product_variants_sku_barcode');
    expect(indexNames).toContain('idx_products_category');
    expect(indexNames).toContain('idx_sales_customer_date');
    expect(indexNames).toContain('idx_sales_created_by_status');
    expect(indexNames).toContain('idx_customers_phone');
    expect(indexNames).toContain('idx_attendance_staff_date');
    expect(indexNames).toContain('idx_audit_logs_action_ts');
  });

  it('Test 10: Performance Benchmark on Indexed Product Variant Lookups', () => {
    // Populate test variants
    const catRes = db.prepare("INSERT INTO categories (name, description) VALUES ('Perf Test Cat', 'Benchmark')").run();
    const prodRes = db.prepare("INSERT INTO products (name, category_id, is_active) VALUES ('Benchmark Saree', ?, 1)").run(catRes.lastInsertRowid);

    const insertStmt = db.prepare(`
      INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active)
      VALUES (?, ?, ?, 500, 1000, 5, 50, 1)
    `);

    for (let i = 1; i <= 50; i++) {
      insertStmt.run(prodRes.lastInsertRowid, `PERF-SKU-${i}`, `890999000${String(i).padStart(3, '0')}`);
    }

    // Benchmark query with index
    const start = performance.now();
    const result = db.prepare('SELECT * FROM product_variants WHERE barcode = ?').get('890999000025') as any;
    const duration = performance.now() - start;

    expect(result).toBeDefined();
    expect(result.sku).toBe('PERF-SKU-25');
    expect(duration).toBeLessThan(10); // sub-10ms query execution
  });

  // --- 6. AUTOMATED BACKUPS & DISASTER RECOVERY ---
  it('Test 11: Automated SQLite Backup Creation & SHA-256 Checksum Calculation', async () => {
    const res = await BackupService.createBackup('test_phase17_backup_01.db', false, db, testBackupDir);
    expect(res.success).toBe(true);
    expect(res.backupPath).toBeDefined();
    expect(res.sha256).toBeDefined();
    expect(res.sha256?.length).toBe(64); // Valid SHA-256 hex string

    // Verify backup file exists on disk
    expect(fs.existsSync(res.backupPath!)).toBe(true);
    const verify = BackupService.verifyBackupFile(res.backupPath!);
    expect(verify.valid).toBe(true);
  });

  it('Test 12: Backup Rotation & File Retention Pruning', async () => {
    // Create 5 backups
    for (let i = 1; i <= 5; i++) {
      await BackupService.createBackup(`backup_rotate_${i}.db`, false, db, testBackupDir);
    }

    const listBefore = BackupService.getBackupsList(testBackupDir);
    expect(listBefore.length).toBeGreaterThanOrEqual(5);

    // Rotate to keep only 3
    BackupService.rotateBackups(3, testBackupDir);

    const listAfter = BackupService.getBackupsList(testBackupDir);
    expect(listAfter.length).toBe(3);
  });

  it('Test 13: Disaster Recovery Restore & Table Record Consistency', async () => {
    // 1. Create backup with known data
    const backupRes = await BackupService.createBackup('disaster_recovery_test.db', false, db, testBackupDir);
    expect(backupRes.success).toBe(true);

    // 2. Open fresh isolated restore database
    const restoreDbPath = path.join(__dirname, '../.test_db/test_phase17_restored.db');
    if (fs.existsSync(restoreDbPath)) fs.unlinkSync(restoreDbPath);

    fs.copyFileSync(backupRes.backupPath!, restoreDbPath);

    const restoredDb = new Database(restoreDbPath);
    const integrity = BackupService.checkIntegrity(restoredDb);
    expect(integrity.healthy).toBe(true);
    expect(integrity.foreignKeysOk).toBe(true);

    // 3. Verify table counts in restored DB match primary DB
    const origCount = (db.prepare('SELECT COUNT(*) as count FROM product_variants').get() as any).count;
    const restoredCount = (restoredDb.prepare('SELECT COUNT(*) as count FROM product_variants').get() as any).count;
    expect(restoredCount).toBe(origCount);

    restoredDb.close();
    if (fs.existsSync(restoreDbPath)) fs.unlinkSync(restoreDbPath);
  });

  // --- 7. SYSTEM HEALTH MONITORING ---
  it('Test 14: Comprehensive System Health Report Diagnostics', () => {
    const report = SystemHealthService.getHealthReport(db);

    expect(report.status).toBe('HEALTHY');
    expect(report.database.status).toBe('ONLINE');
    expect(report.database.integrityPassed).toBe(true);
    expect(report.database.foreignKeysPassed).toBe(true);
    expect(report.database.tablesCount).toBeGreaterThan(15);
    expect(report.memory.heapUsedMB).toBeGreaterThan(0);
    expect(report.memory.systemTotalMB).toBeGreaterThan(0);
    expect(report.security.rateLimiterActive).toBe(true);
  });

  it('Test 15: Clean Database Integrity & Quick Check Confirmation', () => {
    const check = BackupService.checkIntegrity(db);
    expect(check.healthy).toBe(true);
    expect(check.foreignKeysOk).toBe(true);
    expect(check.error).toBeUndefined();
  });
});
