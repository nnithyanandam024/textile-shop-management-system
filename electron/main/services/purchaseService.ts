import Database from 'better-sqlite3';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { ProductRepository } from '../repositories/productRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreatePurchaseItemInput {
  product_variant_id: number;
  quantity: number;
  unit_cost: number;
  discount?: number;
  tax?: number;
}

export interface CreatePurchaseInput {
  supplier_id: number;
  supplier_invoice_number?: string;
  items: CreatePurchaseItemInput[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paid_amount?: number;
  payment_method?: string;
  notes?: string;
  created_by?: number;
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

  generatePurchaseNumber(): string {
    const year = new Date().getFullYear();
    const countRow: any = this.db.prepare('SELECT COUNT(*) as count FROM purchases').get();
    const seq = String((countRow?.count || 0) + 1).padStart(6, '0');
    return `PUR-${year}-${seq}`;
  }

  createPurchase(input: CreatePurchaseInput): { success: boolean; purchaseId?: number; purchaseNumber?: string; error?: string } {
    if (!input.supplier_id) {
      return { success: false, error: 'Supplier is required for purchase entry.' };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'At least one purchase item is required.' };
    }

    try {
      const transaction = this.db.transaction(() => {
        const purchaseNumber = this.generatePurchaseNumber();
        const paidAmount = input.paid_amount || 0;

        // 1. Create Purchase Header
        const purchaseId = this.purchaseRepo.createPurchase({
          purchase_number: purchaseNumber,
          supplier_id: input.supplier_id,
          subtotal: input.subtotal,
          discount: input.discount || 0,
          tax: input.tax || 0,
          total: input.total,
          paid_amount: paidAmount,
          notes: input.supplier_invoice_number ? `Supplier Inv: ${input.supplier_invoice_number}` : input.notes,
        });

        // 2. Create Purchase Items & Increase Stock Atomically
        for (const item of input.items) {
          if (item.quantity <= 0 || item.unit_cost < 0) {
            throw new Error('Quantity must be greater than 0 and unit cost cannot be negative.');
          }

          const lineTotal = item.quantity * item.unit_cost - (item.discount || 0);

          this.purchaseRepo.createPurchaseItem({
            purchase_id: purchaseId,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: lineTotal,
          });

          // Increase Variant Stock
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (!variant) {
            throw new Error(`Variant ID ${item.product_variant_id} does not exist.`);
          }

          const prevStock = variant.current_stock;
          const newStock = prevStock + item.quantity;

          this.productRepo.updateVariantStock(item.product_variant_id, newStock);

          // Write Stock Ledger Entry
          this.stockRepo.createTransaction({
            product_variant_id: item.product_variant_id,
            transaction_type: 'PURCHASE',
            quantity: item.quantity,
            reference_type: 'PURCHASE_ORDER',
            reference_id: purchaseId,
            previous_quantity: prevStock,
            new_quantity: newStock,
            notes: `Stock Inward: Purchase ${purchaseNumber}`,
            created_by: input.created_by,
          });
        }

        // 3. Create Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'CREATE_PURCHASE',
          entity_type: 'PURCHASE',
          entity_id: purchaseId,
          new_value: `Recorded Purchase ${purchaseNumber} for Total ₹${input.total}`,
        });

        return { purchaseId, purchaseNumber };
      });

      const res = transaction();
      return { success: true, purchaseId: res.purchaseId, purchaseNumber: res.purchaseNumber };
    } catch (error: any) {
      log.error('Failed to record purchase entry:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  cancelPurchase(purchaseId: number, actorUserId?: number): { success: boolean; error?: string } {
    try {
      const transaction = this.db.transaction(() => {
        const purchase = this.purchaseRepo.getPurchaseById(purchaseId);
        if (!purchase) throw new Error('Purchase order not found.');
        if (purchase.status === 'CANCELLED') throw new Error('Purchase is already cancelled.');

        const items = this.purchaseRepo.getPurchaseItems(purchaseId);

        // Check if stock is available to reverse
        for (const item of items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (variant && variant.current_stock < item.quantity) {
            throw new Error(`Cannot cancel purchase. Purchased quantity for ${variant.sku} is ${item.quantity}, but current stock is only ${variant.current_stock}.`);
          }
        }

        // Update Purchase Status
        this.db.prepare("UPDATE purchases SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(purchaseId);

        // Deduct Stock Reversal
        for (const item of items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (variant) {
            const prevStock = variant.current_stock;
            const newStock = prevStock - item.quantity;

            this.productRepo.updateVariantStock(item.product_variant_id, newStock);

            this.stockRepo.createTransaction({
              product_variant_id: item.product_variant_id,
              transaction_type: 'RETURN',
              quantity: -item.quantity,
              reference_type: 'PURCHASE_CANCELLATION',
              reference_id: purchaseId,
              previous_quantity: prevStock,
              new_quantity: newStock,
              notes: `Cancelled Purchase ${purchase.purchase_number} stock deduction`,
              created_by: actorUserId,
            });
          }
        }

        // Audit Log
        this.auditRepo.log({
          user_id: actorUserId,
          action: 'PURCHASE_CANCELLED',
          entity_type: 'PURCHASE',
          entity_id: purchaseId,
          old_value: `Purchase ${purchase.purchase_number} Total ₹${purchase.total}`,
          new_value: 'Cancelled & Stock Deducted',
        });

        return true;
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      log.error('Failed to cancel purchase:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}
