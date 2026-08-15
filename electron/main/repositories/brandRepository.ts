import Database from 'better-sqlite3';

export interface BrandRow {
  id: number;
  name: string;
  description?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class BrandRepository {
  constructor(private db: Database.Database) {}

  getAll(): BrandRow[] {
    return this.db.prepare('SELECT * FROM brands WHERE is_active = 1 ORDER BY name ASC').all() as BrandRow[];
  }

  create(brand: { name: string; description?: string }): number {
    const info = this.db.prepare('INSERT INTO brands (name, description) VALUES (?, ?)').run(brand.name, brand.description || null);
    return Number(info.lastInsertRowid);
  }
}
