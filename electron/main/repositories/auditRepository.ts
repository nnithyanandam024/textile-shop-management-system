import Database from 'better-sqlite3';

export interface AuditLogRow {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

export class AuditRepository {
  constructor(private db: Database.Database) {}

  getAll(): AuditLogRow[] {
    return this.db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500').all() as AuditLogRow[];
  }

  log(entry: { user_id?: number; action: string; entity_type: string; entity_id?: number; old_value?: string; new_value?: string }): number {
    const info = this.db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(entry.user_id || null, entry.action, entry.entity_type, entry.entity_id || null, entry.old_value || null, entry.new_value || null);
    return Number(info.lastInsertRowid);
  }
}
