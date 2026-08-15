import Database from 'better-sqlite3';

export interface ExpenseRow {
  id: number;
  category: string;
  description?: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  created_by?: number;
  created_at: string;
}

export class ExpenseRepository {
  constructor(private db: Database.Database) {}

  getAll(): ExpenseRow[] {
    return this.db.prepare('SELECT * FROM expenses ORDER BY id DESC').all() as ExpenseRow[];
  }

  create(e: { category: string; description?: string; amount: number; payment_method?: string; created_by?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO expenses (category, description, amount, payment_method, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(e.category, e.description || null, e.amount, e.payment_method || 'CASH', e.created_by || null);
    return Number(info.lastInsertRowid);
  }
}
