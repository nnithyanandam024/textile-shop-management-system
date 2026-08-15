import Database from 'better-sqlite3';
import { ProductRepository } from '../repositories/productRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreateProductInput {
  name: string;
  category_id: number;
  brand_id?: number;
  material?: string;
  description?: string;
  image_path?: string;
  variants: {
    sku?: string;
    barcode?: string;
    size?: string;
    color?: string;
    pattern?: string;
    purchase_price: number;
    selling_price: number;
    tax_rate?: number;
    minimum_stock?: number;
    initial_stock?: number;
  }[];
}

export class ProductService {
  private productRepo: ProductRepository;
  private stockRepo: StockRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.productRepo = new ProductRepository(db);
    this.stockRepo = new StockRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  generateSku(productName: string, color?: string, size?: string, sequence?: number): string {
    const pPrefix = productName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'TX');
    const cPrefix = color ? color.substring(0, 3).toUpperCase() : 'ALL';
    const sPrefix = size ? size.toUpperCase() : 'FS';
    const seqStr = String(sequence || Math.floor(100 + Math.random() * 900));
    return `${pPrefix}-${cPrefix}-${sPrefix}-${seqStr}`;
  }

  generateBarcode(): string {
    const timestamp = Date.now().toString().slice(-9);
    const rand = Math.floor(100 + Math.random() * 900).toString();
    return `890${timestamp}${rand}`;
  }

  createProductWithVariants(input: CreateProductInput, actorUserId?: number): { success: boolean; productId?: number; error?: string } {
    if (!input.name || !input.category_id || !input.variants || input.variants.length === 0) {
      return { success: false, error: 'Product Name, Category, and at least one Variant are required.' };
    }

    try {
      const transaction = this.db.transaction(() => {
        // 1. Create Master Product
        const productId = this.productRepo.createProduct({
          name: input.name,
          category_id: input.category_id,
          brand_id: input.brand_id,
          material: input.material,
          description: input.description,
        });

        // 2. Create Variants
        let seq = 101;
        for (const v of input.variants) {
          if (v.purchase_price < 0 || v.selling_price < 0) {
            throw new Error('Purchase and Selling prices must be greater than or equal to 0.');
          }

          const sku = v.sku || this.generateSku(input.name, v.color, v.size, seq++);
          const barcode = v.barcode || this.generateBarcode();
          const initialStock = v.initial_stock || 0;

          // Check SKU Uniqueness
          const existingSku = this.productRepo.getVariantBySku(sku);
          if (existingSku) {
            throw new Error(`SKU '${sku}' is already assigned to another variant.`);
          }

          const variantId = this.productRepo.createVariant({
            product_id: productId,
            sku,
            barcode,
            size: v.size,
            color: v.color,
            pattern: v.pattern,
            purchase_price: v.purchase_price,
            selling_price: v.selling_price,
            tax_rate: v.tax_rate ?? 0.0,
            minimum_stock: v.minimum_stock ?? 5,
            current_stock: initialStock,
          });

          // Record Initial Stock Transaction
          if (initialStock > 0) {
            this.stockRepo.createTransaction({
              product_variant_id: variantId,
              transaction_type: 'PURCHASE',
              quantity: initialStock,
              reference_type: 'INITIAL_STOCK',
              previous_quantity: 0,
              new_quantity: initialStock,
              notes: 'Initial Stock on Creation',
              created_by: actorUserId,
            });
          }
        }

        // 3. Audit Log
        this.auditRepo.log({
          user_id: actorUserId,
          action: 'CREATE_PRODUCT',
          entity_type: 'PRODUCT',
          entity_id: productId,
          new_value: `Created product '${input.name}' with ${input.variants.length} variant(s)`,
        });

        return productId;
      });

      const productId = transaction();
      return { success: true, productId };
    } catch (error: any) {
      log.error('Failed to create product with variants:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  deactivateProduct(productId: number, actorUserId?: number): { success: boolean; error?: string } {
    try {
      const info = this.db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(productId);
      if (info.changes > 0) {
        // Also deactivate variants
        this.db.prepare('UPDATE product_variants SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?').run(productId);
        
        this.auditRepo.log({
          user_id: actorUserId,
          action: 'DEACTIVATE_PRODUCT',
          entity_type: 'PRODUCT',
          entity_id: productId,
        });

        return { success: true };
      }
      return { success: false, error: 'Product not found.' };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }
}
