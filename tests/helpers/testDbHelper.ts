import path from 'path';
import fs from 'fs';

export const TEST_DB_DIR = path.resolve(__dirname, '../.test_db');

/**
 * Returns an absolute path for a test database located inside the dedicated tests/.test_db directory.
 * Automatically ensures that the directory exists.
 */
export function getTestDbPath(filename: string): string {
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }
  return path.join(TEST_DB_DIR, filename);
}

/**
 * Safely unlinks a test database along with any SQLite WAL / SHM auxiliary files.
 */
export function cleanupTestDb(dbPath: string): void {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    const wal = `${dbPath}-wal`;
    if (fs.existsSync(wal)) {
      fs.unlinkSync(wal);
    }
    const shm = `${dbPath}-shm`;
    if (fs.existsSync(shm)) {
      fs.unlinkSync(shm);
    }
  } catch (err) {
    // Ignore cleanup errors if locked or already deleted
  }
}
