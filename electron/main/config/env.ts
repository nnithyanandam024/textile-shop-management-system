/**
 * Phase 17 — Production Environment Configuration Manager
 * Provides strictly typed environment variables, defaults, and validation.
 */
import fs from 'fs';
import path from 'path';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  appName: string;
  appVersion: string;
  dbName: string;
  dbBusyTimeout: number;
  dbCacheSizeMB: number;
  backupRetentionDaily: number;
  backupRetentionWeekly: number;
  autoBackupEnabled: boolean;
  rateLimitMaxAttempts: number;
  rateLimitCooldownMinutes: number;
  sessionIdleTimeoutMinutes: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logMaxSizeMB: number;
  logMaxFiles: number;
}

let loadedConfig: AppConfig | null = null;

export function loadAppConfig(customEnv?: Record<string, string>): AppConfig {
  if (loadedConfig && !customEnv) {
    return loadedConfig;
  }

  const env = customEnv || process.env;
  const nodeEnv = (env.NODE_ENV as any) || 'production';

  // Read .env file if present in cwd
  const envFilePath = path.join(process.cwd(), `.env.${nodeEnv}`);
  const baseEnvFilePath = path.join(process.cwd(), '.env');

  const fileVars: Record<string, string> = {};

  const parseFile = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const key = trimmed.substring(0, idx).trim();
            let val = trimmed.substring(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            fileVars[key] = val;
          }
        }
      } catch {}
    }
  };

  parseFile(baseEnvFilePath);
  parseFile(envFilePath);

  const getVar = (key: string, defaultVal: string): string => {
    return env[key] || fileVars[key] || defaultVal;
  };

  const getNumVar = (key: string, defaultVal: number): number => {
    const val = getVar(key, String(defaultVal));
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const getBoolVar = (key: string, defaultVal: boolean): boolean => {
    const val = getVar(key, String(defaultVal)).toLowerCase();
    return val === 'true' || val === '1' || val === 'yes';
  };

  const config: AppConfig = {
    nodeEnv: (['development', 'test', 'production'].includes(nodeEnv) ? nodeEnv : 'production') as any,
    appName: getVar('APP_NAME', 'Textile Shop Management System'),
    appVersion: getVar('APP_VERSION', '1.0.0'),
    dbName: getVar('DB_NAME', 'textile-shop.db'),
    dbBusyTimeout: getNumVar('DB_BUSY_TIMEOUT', 5000),
    dbCacheSizeMB: getNumVar('DB_CACHE_SIZE_MB', 64),
    backupRetentionDaily: getNumVar('BACKUP_RETENTION_DAILY', 7),
    backupRetentionWeekly: getNumVar('BACKUP_RETENTION_WEEKLY', 4),
    autoBackupEnabled: getBoolVar('AUTO_BACKUP_ENABLED', true),
    rateLimitMaxAttempts: getNumVar('RATE_LIMIT_MAX_ATTEMPTS', 5),
    rateLimitCooldownMinutes: getNumVar('RATE_LIMIT_COOLDOWN_MINUTES', 15),
    sessionIdleTimeoutMinutes: getNumVar('SESSION_IDLE_TIMEOUT_MINUTES', 60),
    logLevel: (getVar('LOG_LEVEL', 'info') as any) || 'info',
    logMaxSizeMB: getNumVar('LOG_MAX_SIZE_MB', 10),
    logMaxFiles: getNumVar('LOG_MAX_FILES', 5),
  };

  if (!customEnv) {
    loadedConfig = config;
  }
  return config;
}

export const envConfig = loadAppConfig();
