import Database from 'better-sqlite3';

export interface PurchaseRow {
  id: number;
  purchase_number: string;
  supplier_id: number;
  supplier_name?: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface PurchaseItemRow {
  id: number;
  purchase_id: number;
  product_variant_id: number;
  sku?: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  discount: number;
  tax: number;
  total: number;
}

export class PurchaseRepository {
  constructor(private db: Database.Database) {}

  getAll(): PurchaseRow[] {
    return this.db.prepare(`
      SELECT p.*, s.company_name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id DESC
    `).all() as PurchaseRow[];
  }

  getPurchaseById(id: number): PurchaseRow | undefined {
    return this.db.prepare(`
      SELECT p.*, s.company_name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(id) as PurchaseRow | undefined;
  }

  getPurchaseItems(purchaseId: number): PurchaseItemRow[] {
    return this.db.prepare(`
      SELECT pi.*, pv.sku, p.name as product_name
      FROM purchase_items pi
      JOIN product_variants pv ON pi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE pi.purchase_id = ?
    `).all(purchaseId) as PurchaseItemRow[];
  }

  createPurchase(p: {
    purchase_number: string;
    supplier_id: number;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    paid_amount?: number;
    notes?: string;
  }): number {
    const paid = p.paid_amount ?? p.total;
    const balance = p.total - paid;
    const info = this.db.prepare(`
      INSERT INTO purchases (
        purchase_number, supplier_id, subtotal, discount, tax, total, paid_amount, balance_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.purchase_number, p.supplier_id, p.subtotal, p.discount ?? 0, p.tax ?? 0, p.total, paid, balance, p.notes || null);
    return Number(info.lastInsertRowid);
  }

  createPurchaseItem(item: {
    purchase_id: number;
    product_variant_id: number;
    quantity: number;
    unit_cost: number;
    discount?: number;
    tax?: number;
    total: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO purchase_items (
        purchase_id, product_variant_id, quantity, unit_cost, discount, tax, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item.purchase_id, item.product_variant_id, item.quantity, item.unit_cost, item.discount ?? 0, item.tax ?? 0, item.total);
    return Number(info.lastInsertRowid);
  }
}
