import Database from 'better-sqlite3';

export interface StockTransactionRow {
  id: number;
  product_variant_id: number;
  sku?: string;
  product_name?: string;
  transaction_type: string; // PURCHASE, SALE, RETURN, DAMAGE, ADJUSTMENT
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export class StockRepository {
  constructor(private db: Database.Database) {}

  getAllTransactions(): StockTransactionRow[] {
    return this.db.prepare(`
      SELECT st.*, v.sku, p.name as product_name
      FROM stock_transactions st
      JOIN product_variants v ON st.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      ORDER BY st.id DESC
    `).all() as StockTransactionRow[];
  }

  getTransactionsByVariant(variantId: number): StockTransactionRow[] {
    return this.db.prepare(`
      SELECT st.*, v.sku, p.name as product_name
      FROM stock_transactions st
      JOIN product_variants v ON st.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE st.product_variant_id = ?
      ORDER BY st.id DESC
    `).all(variantId) as StockTransactionRow[];
  }

  createTransaction(tx: {
    product_variant_id: number;
    transaction_type: string;
    quantity: number;
    reference_type?: string;
    reference_id?: number;
    previous_quantity: number;
    new_quantity: number;
    notes?: string;
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO stock_transactions (
        product_variant_id, transaction_type, quantity, reference_type, reference_id, previous_quantity, new_quantity, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.product_variant_id,
      tx.transaction_type,
      tx.quantity,
      tx.reference_type || null,
      tx.reference_id || null,
      tx.previous_quantity,
      tx.new_quantity,
      tx.notes || null,
      tx.created_by || null
    );
    return Number(info.lastInsertRowid);
  }
}
