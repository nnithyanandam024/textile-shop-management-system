import Database from 'better-sqlite3';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { ProductRepository } from '../repositories/productRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface CreatePurchaseInput {
  purchase_number: string;
  supplier_id: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paid_amount?: number;
  notes?: string;
  items: {
    product_variant_id: number;
    quantity: number;
    unit_cost: number;
    discount?: number;
    tax?: number;
    total: number;
  }[];
}

export class PurchaseService {
  private purchaseRepo: PurchaseRepository;
  private productRepo: ProductRepository;
  private stockRepo: StockRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.purchaseRepo = new PurchaseRepository(db);
    this.productRepo = new ProductRepository(db);
    this.stockRepo = new StockRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  createPurchase(input: CreatePurchaseInput): { success: boolean; purchaseId?: number; error?: string } {
    if (!input.purchase_number || !input.supplier_id || input.items.length === 0) {
      return { success: false, error: 'Purchase number, supplier, and items are required.' };
    }

    try {
      const transaction = this.db.transaction(() => {
        // 1. Create Purchase Header
        const purchaseId = this.purchaseRepo.createPurchase({
          purchase_number: input.purchase_number,
          supplier_id: input.supplier_id,
          subtotal: input.subtotal,
          discount: input.discount,
          tax: input.tax,
          total: input.total,
          paid_amount: input.paid_amount ?? input.total,
          notes: input.notes,
        });

        // 2. Create Items & Increase Stock
        for (const item of input.items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (!variant) {
            throw new Error(`Variant ${item.product_variant_id} does not exist.`);
          }

          const prevStock = variant.current_stock;
          const newStock = prevStock + item.quantity;

          this.purchaseRepo.createPurchaseItem({
            purchase_id: purchaseId,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            discount: item.discount,
            tax: item.tax,
            total: item.total,
          });

          // Increase Variant Stock
          this.productRepo.updateVariantStock(item.product_variant_id, newStock);

          // Stock Ledger Entry
          this.stockRepo.createTransaction({
            product_variant_id: item.product_variant_id,
            transaction_type: 'PURCHASE',
            quantity: item.quantity,
            reference_type: 'PURCHASE',
            reference_id: purchaseId,
            previous_quantity: prevStock,
            new_quantity: newStock,
            notes: `Purchase Order #${input.purchase_number}`,
          });
        }

        // 3. Audit Log
        this.auditRepo.log({
          action: 'CREATE_PURCHASE',
          entity_type: 'PURCHASE',
          entity_id: purchaseId,
          new_value: `PO #${input.purchase_number} - Total ₹${input.total}`,
        });

        return purchaseId;
      });

      const purchaseId = transaction();
      return { success: true, purchaseId };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }
}
