import Database from 'better-sqlite3';
import { ProductRepository, VariantRow } from '../repositories/productRepository';
import { StockRepository, StockTransactionRow } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface InventoryMetrics {
  totalVariants: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export class InventoryService {
  private productRepo: ProductRepository;
  private stockRepo: StockRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.productRepo = new ProductRepository(db);
    this.stockRepo = new StockRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getMetrics(): InventoryMetrics {
    const variants = this.productRepo.getAllVariants();
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const v of variants) {
      totalStockUnits += v.current_stock;
      if (v.current_stock === 0) {
        outOfStockCount++;
      } else if (v.current_stock <= v.minimum_stock) {
        lowStockCount++;
      }
    }

    return {
      totalVariants: variants.length,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
    };
  }

  getLowStockVariants(): VariantRow[] {
    const variants = this.productRepo.getAllVariants();
    return variants.filter((v) => v.current_stock > 0 && v.current_stock <= v.minimum_stock);
  }

  getOutOfStockVariants(): VariantRow[] {
    const variants = this.productRepo.getAllVariants();
    return variants.filter((v) => v.current_stock === 0);
  }

  getStockHistory(variantId?: number): StockTransactionRow[] {
    if (variantId) {
      return this.stockRepo.getTransactionsByVariant(variantId);
    }
    return this.stockRepo.getAllTransactions();
  }

  adjustStock(input: {
    product_variant_id: number;
    quantity_change: number; // positive for addition, negative for deduction
    transaction_type: 'ADJUSTMENT' | 'DAMAGE' | 'PURCHASE' | 'RETURN';
    notes: string;
    created_by?: number;
  }): { success: boolean; newStock?: number; error?: string } {
    if (!input.product_variant_id || input.quantity_change === 0 || !input.notes) {
      return { success: false, error: 'Variant ID, Quantity Change (non-zero), and Reason notes are required.' };
    }

    try {
      const transaction = this.db.transaction(() => {
        const variant = this.productRepo.getVariantById(input.product_variant_id);
        if (!variant) {
          throw new Error('Product variant not found.');
        }

        const prevStock = variant.current_stock;
        const newStock = prevStock + input.quantity_change;

        // Negative Stock Prevention Rule
        if (newStock < 0) {
          throw new Error(`Insufficient stock. Current stock is ${prevStock}, requested deduction is ${Math.abs(input.quantity_change)}.`);
        }

        // Update Variant Stock
        this.productRepo.updateVariantStock(input.product_variant_id, newStock);

        // Record Stock Ledger Transaction
        this.stockRepo.createTransaction({
          product_variant_id: input.product_variant_id,
          transaction_type: input.transaction_type,
          quantity: input.quantity_change,
          reference_type: 'STOCK_ADJUSTMENT',
          previous_quantity: prevStock,
          new_quantity: newStock,
          notes: input.notes,
          created_by: input.created_by,
        });

        // Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'STOCK_ADJUSTMENT',
          entity_type: 'PRODUCT_VARIANT',
          entity_id: input.product_variant_id,
          old_value: `Stock: ${prevStock}`,
          new_value: `Stock: ${newStock} (${input.transaction_type}: ${input.quantity_change > 0 ? '+' : ''}${input.quantity_change}, Reason: ${input.notes})`,
        });

        return newStock;
      });

      const newStock = transaction();
      return { success: true, newStock };
    } catch (error: any) {
      log.error('Stock adjustment error:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}
