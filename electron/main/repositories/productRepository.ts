import Database from 'better-sqlite3';

export interface ProductRow {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  material?: string;
  description?: string;
  image_path?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface VariantRow {
  id: number;
  product_id: number;
  product_name?: string;
  category_name?: string;
  brand_name?: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  pattern?: string;
  purchase_price: number;
  selling_price: number;
  tax_rate: number;
  minimum_stock: number;
  current_stock: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class ProductRepository {
  constructor(private db: Database.Database) {}

  getAllProducts(): ProductRow[] {
    return this.db.prepare(`
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = 1
      ORDER BY p.name ASC
    `).all() as ProductRow[];
  }

  getAllVariants(): VariantRow[] {
    return this.db.prepare(`
      SELECT v.*, p.name as product_name, c.name as category_name, b.name as brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.is_active = 1
      ORDER BY v.sku ASC
    `).all() as VariantRow[];
  }

  getVariantBySku(sku: string): VariantRow | undefined {
    return this.db.prepare(`
      SELECT v.*, p.name as product_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.sku = ? AND v.is_active = 1
    `).get(sku) as VariantRow | undefined;
  }

  getVariantByBarcode(barcode: string): VariantRow | undefined {
    return this.db.prepare(`
      SELECT v.*, p.name as product_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.barcode = ? AND v.is_active = 1
    `).get(barcode) as VariantRow | undefined;
  }

  getVariantById(id: number): VariantRow | undefined {
    return this.db.prepare(`
      SELECT v.*, p.name as product_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = ?
    `).get(id) as VariantRow | undefined;
  }

  createProduct(p: { name: string; category_id: number; brand_id?: number; material?: string; description?: string }): number {
    const info = this.db.prepare(`
      INSERT INTO products (name, category_id, brand_id, material, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(p.name, p.category_id, p.brand_id || null, p.material || null, p.description || null);
    return Number(info.lastInsertRowid);
  }

  createVariant(v: {
    product_id: number;
    sku: string;
    barcode?: string;
    size?: string;
    color?: string;
    pattern?: string;
    purchase_price: number;
    selling_price: number;
    tax_rate?: number;
    minimum_stock?: number;
    current_stock?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price, tax_rate, minimum_stock, current_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      v.product_id,
      v.sku,
      v.barcode || null,
      v.size || null,
      v.color || null,
      v.pattern || null,
      v.purchase_price,
      v.selling_price,
      v.tax_rate ?? 0.0,
      v.minimum_stock ?? 5,
      v.current_stock ?? 0
    );
    return Number(info.lastInsertRowid);
  }

  updateVariantStock(variantId: number, newStock: number): boolean {
    const info = this.db.prepare(`
      UPDATE product_variants 
      SET current_stock = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStock, variantId);
    return info.changes > 0;
  }
}
