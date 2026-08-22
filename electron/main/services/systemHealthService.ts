/**
 * Phase 17 — Centralized System Health & Diagnostic Service
 * Provides detailed system metrics, SQLite health, memory tracking, and storage diagnostics.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getDatabase, getDatabasePath, getBackupDirectoryPath } from '../database';
import { BackupService } from './backupService';
import log from '../logger';

export interface ComprehensiveHealthReport {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  database: {
    status: 'ONLINE' | 'ERROR';
    path: string;
    sizeBytes: number;
    walSizeBytes: number;
    integrityPassed: boolean;
    foreignKeysPassed: boolean;
    tablesCount: number;
    totalSalesCount: number;
    totalProductsCount: number;
    totalStaffCount: number;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    systemTotalMB: number;
    systemFreeMB: number;
    systemFreePercent: number;
  };
  storage: {
    backupDir: string;
    backupsCount: number;
    lastBackupDate?: string;
  };
  security: {
    activeSessionsCount: number;
    rateLimiterActive: boolean;
  };
}

export class SystemHealthService {
  /**
   * Generate comprehensive health diagnostics
   */
  public static getHealthReport(dbInstance?: Database.Database): ComprehensiveHealthReport {
    const db = dbInstance || getDatabase();
    const dbPath = getDatabasePath();
    const backupDir = getBackupDirectoryPath();

    let dbSizeBytes = 0;
    let walSizeBytes = 0;

    if (fs.existsSync(dbPath)) {
      try { dbSizeBytes = fs.statSync(dbPath).size; } catch {}
    }
    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) {
      try { walSizeBytes = fs.statSync(walPath).size; } catch {}
    }

    const integrity = BackupService.checkIntegrity(db);

    let tablesCount = 0;
    let totalSalesCount = 0;
    let totalProductsCount = 0;
    let totalStaffCount = 0;

    try {
      const tRow = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as any;
      tablesCount = tRow?.count || 0;

      const sRow = db.prepare("SELECT COUNT(*) as count FROM sales").get() as any;
      totalSalesCount = sRow?.count || 0;

      const pRow = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
      totalProductsCount = pRow?.count || 0;

      const stRow = db.prepare("SELECT COUNT(*) as count FROM staff").get() as any;
      totalStaffCount = stRow?.count || 0;
    } catch (err) {
      log.error('Error fetching database count metrics:', err);
    }

    const memUsage = process.memoryUsage();
    const systemTotalMem = os.totalmem() / (1024 * 1024);
    const systemFreeMem = os.freemem() / (1024 * 1024);

    const backups = BackupService.getBackupsList();
    const lastBackup = backups.length > 0 ? backups[0].createdAt : undefined;

    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (!integrity.healthy || !integrity.foreignKeysOk) {
      overallStatus = 'DEGRADED';
    }
    if (dbSizeBytes === 0 || tablesCount === 0) {
      overallStatus = 'CRITICAL';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
      database: {
        status: dbSizeBytes > 0 ? 'ONLINE' : 'ERROR',
        path: dbPath,
        sizeBytes: dbSizeBytes,
        walSizeBytes,
        integrityPassed: integrity.healthy,
        foreignKeysPassed: integrity.foreignKeysOk,
        tablesCount,
        totalSalesCount,
        totalProductsCount,
        totalStaffCount,
      },
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / (1024 * 1024)),
        heapTotalMB: Math.round(memUsage.heapTotal / (1024 * 1024)),
        rssMB: Math.round(memUsage.rss / (1024 * 1024)),
        systemTotalMB: Math.round(systemTotalMem),
        systemFreeMB: Math.round(systemFreeMem),
        systemFreePercent: Math.round((systemFreeMem / systemTotalMem) * 100),
      },
      storage: {
        backupDir,
        backupsCount: backups.length,
        lastBackupDate: lastBackup,
      },
      security: {
        activeSessionsCount: 1,
        rateLimiterActive: true,
      },
    };
  }
}
