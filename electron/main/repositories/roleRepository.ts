import Database from 'better-sqlite3';

export interface RoleRow {
  id: number;
  name: string;
  description?: string;
  is_system_role: number;
  status: string;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionRow {
  id: number;
  code: string;
  module: string;
  description?: string;
}

export class RoleRepository {
  constructor(private db: Database.Database) {}

  getAll(): RoleRow[] {
    return this.db.prepare(`
      SELECT r.*, COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id
      ORDER BY r.is_system_role DESC, r.id ASC
    `).all() as RoleRow[];
  }

  getById(id: number): RoleRow | undefined {
    return this.db.prepare(`
      SELECT r.*, COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      WHERE r.id = ?
      GROUP BY r.id
    `).get(id) as RoleRow | undefined;
  }

  getByName(name: string): RoleRow | undefined {
    return this.db.prepare('SELECT * FROM roles WHERE LOWER(name) = LOWER(?)').get(name) as RoleRow | undefined;
  }

  create(role: { name: string; description?: string; is_system_role?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO roles (name, description, is_system_role, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `).run(role.name.trim(), role.description?.trim() || null, role.is_system_role ? 1 : 0);
    return Number(info.lastInsertRowid);
  }

  update(id: number, role: { name?: string; description?: string; status?: string }): void {
    const fields: string[] = [];
    const params: any[] = [];

    if (role.name !== undefined) {
      fields.push('name = ?');
      params.push(role.name.trim());
    }
    if (role.description !== undefined) {
      fields.push('description = ?');
      params.push(role.description.trim());
    }
    if (role.status !== undefined) {
      fields.push('status = ?');
      params.push(role.status);
    }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    this.db.prepare(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM roles WHERE id = ?').run(id);
  }

  getAllPermissions(): PermissionRow[] {
    return this.db.prepare('SELECT * FROM permissions ORDER BY module ASC, code ASC').all() as PermissionRow[];
  }

  getRolePermissions(roleId: number): string[] {
    const rows = this.db.prepare(`
      SELECT p.code
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(roleId) as { code: string }[];
    return rows.map((r) => r.code);
  }

  syncRolePermissions(roleId: number, permissionCodes: string[]): void {
    const sync = this.db.transaction(() => {
      // Clear existing permissions for this role
      this.db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);

      if (permissionCodes.length > 0) {
        const stmt = this.db.prepare(`
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT ?, id FROM permissions WHERE code = ?
        `);
        for (const code of permissionCodes) {
          stmt.run(roleId, code);
        }
      }
    });
    sync();
  }
}
