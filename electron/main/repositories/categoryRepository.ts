import Database from 'better-sqlite3';

export interface CategoryRow {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class CategoryRepository {
  constructor(private db: Database.Database) {}

  getAll(): CategoryRow[] {
    return this.db.prepare(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.is_active = 1
      ORDER BY c.name ASC
    `).all() as CategoryRow[];
  }

  getById(id: number): CategoryRow | undefined {
    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined;
  }

  create(category: { name: string; description?: string; parent_id?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO categories (name, description, parent_id)
      VALUES (?, ?, ?)
    `).run(category.name, category.description || null, category.parent_id || null);
    return Number(info.lastInsertRowid);
  }
}
