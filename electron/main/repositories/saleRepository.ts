import Database from 'better-sqlite3';

export interface SaleRow {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_gstin?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  discount_type?: string;
  discount_reason?: string;
  tax: number;
  round_off_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  notes?: string;
  created_by?: number;
  cashier_name?: string;
  approved_by?: number;
  is_tax_invoice?: number;
  created_at: string;
}

export interface SaleItemRow {
  id: number;
  sale_id: number;
  product_variant_id: number;
  sku?: string;
  product_name?: string;
  product_name_snapshot?: string;
  sku_snapshot?: string;
  hsn_code_snapshot?: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  discount_amount?: number;
  tax: number;
  tax_rate?: number;
  tax_amount?: number;
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
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.display_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.id DESC
    `).all() as SaleRow[];
  }

  getSaleById(id: number): SaleRow | undefined {
    return this.db.prepare(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.tax_number as customer_gstin, u.display_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `).get(id) as SaleRow | undefined;
  }

  getSaleByInvoiceNumber(invoiceNumber: string): SaleRow | undefined {
    return this.db.prepare(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.tax_number as customer_gstin, u.display_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.invoice_number = ?
    `).get(invoiceNumber) as SaleRow | undefined;
  }

  createSale(s: {
    invoice_number: string;
    customer_id: number;
    subtotal: number;
    discount?: number;
    discount_type?: string;
    discount_reason?: string;
    tax?: number;
    round_off_amount?: number;
    cgst_amount?: number;
    sgst_amount?: number;
    igst_amount?: number;
    total: number;
    paid_amount?: number;
    balance_amount?: number;
    status?: string;
    notes?: string;
    created_by?: number;
    approved_by?: number;
    is_tax_invoice?: number;
  }): number {
    const paid = s.paid_amount ?? s.total;
    const balance = s.balance_amount ?? (s.total - paid);
    const status = s.status || 'COMPLETED';
    const info = this.db.prepare(`
      INSERT INTO sales (
        invoice_number, customer_id, subtotal, discount, discount_type, discount_reason,
        tax, round_off_amount, cgst_amount, sgst_amount, igst_amount, total,
        paid_amount, balance_amount, status, notes, created_by, approved_by, is_tax_invoice
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.invoice_number,
      s.customer_id,
      s.subtotal,
      s.discount ?? 0,
      s.discount_type || 'FIXED',
      s.discount_reason || null,
      s.tax ?? 0,
      s.round_off_amount ?? 0,
      s.cgst_amount ?? 0,
      s.sgst_amount ?? 0,
      s.igst_amount ?? 0,
      s.total,
      paid,
      balance,
      status,
      s.notes || null,
      s.created_by || null,
      s.approved_by || null,
      s.is_tax_invoice ? 1 : 0
    );
    return Number(info.lastInsertRowid);
  }

  createSaleItem(item: {
    sale_id: number;
    product_variant_id: number;
    product_name_snapshot?: string;
    sku_snapshot?: string;
    hsn_code_snapshot?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    discount_amount?: number;
    tax?: number;
    tax_rate?: number;
    tax_amount?: number;
    total: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO sale_items (
        sale_id, product_variant_id, product_name_snapshot, sku_snapshot, hsn_code_snapshot,
        quantity, unit_price, discount, discount_amount, tax, tax_rate, tax_amount, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.sale_id,
      item.product_variant_id,
      item.product_name_snapshot || null,
      item.sku_snapshot || null,
      item.hsn_code_snapshot || '5208',
      item.quantity,
      item.unit_price,
      item.discount ?? 0,
      item.discount_amount ?? 0,
      item.tax ?? 0,
      item.tax_rate ?? 5.0,
      item.tax_amount ?? 0,
      item.total
    );
    return Number(info.lastInsertRowid);
  }

  getSaleItems(saleId: number): SaleItemRow[] {
    return this.db.prepare(`
      SELECT si.*, 
        COALESCE(si.sku_snapshot, pv.sku) as sku,
        COALESCE(si.product_name_snapshot, p.name) as product_name,
        COALESCE(si.hsn_code_snapshot, '5208') as hsn_code_snapshot,
        pv.color, pv.size
      FROM sale_items si
      LEFT JOIN product_variants pv ON si.product_variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE si.sale_id = ?
    `).all(saleId) as SaleItemRow[];
  }

  getPayments(saleId: number): PaymentRow[] {
    return this.db.prepare(`
      SELECT * FROM payments WHERE sale_id = ? ORDER BY id ASC
    `).all(saleId) as PaymentRow[];
  }

  createPayment(p: { sale_id: number; payment_method: string; amount: number; reference_number?: string }): number {
    const info = this.db.prepare(`
      INSERT INTO payments (sale_id, payment_method, amount, reference_number)
      VALUES (?, ?, ?, ?)
    `).run(p.sale_id, p.payment_method, p.amount, p.reference_number || null);
    return Number(info.lastInsertRowid);
  }

  updateSaleStatus(id: number, status: string, notes?: string): void {
    this.db.prepare(`
      UPDATE sales SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes || null, id);
  }
}
