import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import log from '../logger';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'textile-shop.db');
}

export function getBackupDirectoryPath(): string {
  const userDataPath = app.getPath('userData');
  const backupPath = path.join(userDataPath, 'Backups');
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  return backupPath;
}

export function initDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  log.info(`Initializing SQLite Database at: ${dbPath}`);

  try {
    dbInstance = new Database(dbPath, { verbose: (msg) => log.debug(`[SQL] ${msg}`) });
    
    // Enable PRAGMAs for performance and integrity
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    runMigrations(dbInstance);

    log.info('Database initialized successfully.');
    return dbInstance;
  } catch (error) {
    log.error('Failed to initialize SQLite Database:', error);
    throw error;
  }
}

function runMigrations(db: Database.Database) {
  // Create schema_migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrations = [
    {
      version: 1,
      name: 'initial_settings_schema',
      up: (database: Database.Database) => {
        database.exec(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          INSERT OR IGNORE INTO settings (key, value) VALUES
            ('shop_name', 'Textile Fashion Store'),
            ('shop_address', '123 Main Bazaar Road, Textile City'),
            ('shop_phone', '+91 98765 43210'),
            ('gst_number', '33AAAAA0000A1Z5'),
            ('currency', 'INR'),
            ('app_version', '0.1.0');
        `);
      }
    }
  ];

  const row = db.prepare('SELECT MAX(version) as max_version FROM schema_migrations').get() as { max_version: number | null };
  const currentVersion = row?.max_version || 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      log.info(`Executing DB Migration v${migration.version}: ${migration.name}`);
      const transaction = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
      });
      transaction();
      log.info(`Migration v${migration.version} completed.`);
    }
  }
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    log.info('Closing SQLite Database...');
    dbInstance.close();
    dbInstance = null;
  }
}
