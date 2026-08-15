import Database from 'better-sqlite3';

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role_id: number;
  role_name?: string;
  is_active: number;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export class UserRepository {
  constructor(private db: Database.Database) {}

  getAll(): UserRow[] {
    return this.db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.id ASC
    `).all() as UserRow[];
  }

  getById(id: number): UserRow | undefined {
    return this.db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `).get(id) as UserRow | undefined;
  }

  getByUsername(username: string): UserRow | undefined {
    return this.db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = ?
    `).get(username) as UserRow | undefined;
  }

  getUserPermissions(roleId: number): string[] {
    const rows = this.db.prepare(`
      SELECT p.code 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(roleId) as { code: string }[];
    return rows.map((r) => r.code);
  }

  getActiveOwnerCount(): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'Owner' AND u.is_active = 1
    `).get() as { count: number };
    return row.count;
  }

  create(user: { username: string; password_hash: string; display_name: string; role_id: number }): number {
    const info = this.db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES (?, ?, ?, ?)
    `).run(user.username, user.password_hash, user.display_name, user.role_id);
    return Number(info.lastInsertRowid);
  }

  update(id: number, data: { display_name?: string; role_id?: number; is_active?: number }): boolean {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.display_name !== undefined) {
      fields.push('display_name = ?');
      params.push(data.display_name);
    }
    if (data.role_id !== undefined) {
      fields.push('role_id = ?');
      params.push(data.role_id);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(data.is_active);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const info = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return info.changes > 0;
  }

  updatePasswordHash(id: number, hash: string): boolean {
    const info = this.db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(hash, id);
    return info.changes > 0;
  }

  updateFailedAttempts(id: number, attempts: number, lockUntil?: string): void {
    this.db.prepare(`
      UPDATE users 
      SET failed_login_attempts = ?, locked_until = ? 
      WHERE id = ?
    `).run(attempts, lockUntil || null, id);
  }

  recordSuccessfulLogin(id: number): void {
    this.db.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);
  }
}
