import Database from 'better-sqlite3';

export interface SaleRow {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface SaleItemRow {
  id: number;
  sale_id: number;
  product_variant_id: number;
  sku?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PaymentRow {
  id: number;
  sale_id: number;
  payment_method: string;
  amount: number;
  reference_number?: string;
  payment_date: string;
}

export class SaleRepository {
  constructor(private db: Database.Database) {}

  getAllSales(): SaleRow[] {
    return this.db.prepare(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.id DESC
    `).all() as SaleRow[];
  }

  getSaleById(id: number): SaleRow | undefined {
    return this.db.prepare(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `).get(id) as SaleRow | undefined;
  }

  createSale(s: {
    invoice_number: string;
    customer_id: number;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    paid_amount?: number;
    notes?: string;
    created_by?: number;
  }): number {
    const paid = s.paid_amount ?? s.total;
    const balance = s.total - paid;
    const info = this.db.prepare(`
      INSERT INTO sales (
        invoice_number, customer_id, subtotal, discount, tax, total, paid_amount, balance_amount, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(s.invoice_number, s.customer_id, s.subtotal, s.discount ?? 0, s.tax ?? 0, s.total, paid, balance, s.notes || null, s.created_by || null);
    return Number(info.lastInsertRowid);
  }

  createSaleItem(item: {
    sale_id: number;
    product_variant_id: number;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax?: number;
    total: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO sale_items (
        sale_id, product_variant_id, quantity, unit_price, discount, tax, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item.sale_id, item.product_variant_id, item.quantity, item.unit_price, item.discount ?? 0, item.tax ?? 0, item.total);
    return Number(info.lastInsertRowid);
  }

  createPayment(p: { sale_id: number; payment_method: string; amount: number; reference_number?: string }): number {
    const info = this.db.prepare(`
      INSERT INTO payments (sale_id, payment_method, amount, reference_number)
      VALUES (?, ?, ?, ?)
    `).run(p.sale_id, p.payment_method, p.amount, p.reference_number || null);
    return Number(info.lastInsertRowid);
  }
}
