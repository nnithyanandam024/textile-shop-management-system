import Database from 'better-sqlite3';
import { SaleRepository } from '../repositories/saleRepository';
import { ProductRepository } from '../repositories/productRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreateSaleItemInput {
  product_variant_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax?: number;
}

export interface CreatePaymentInput {
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  amount: number;
  reference_number?: string;
}

export interface CreateSaleInput {
  customer_id?: number;
  items: CreateSaleItemInput[];
  payments: CreatePaymentInput[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  created_by?: number;
}

export class SalesService {
  private saleRepo: SaleRepository;
  private productRepo: ProductRepository;
  private stockRepo: StockRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.saleRepo = new SaleRepository(db);
    this.productRepo = new ProductRepository(db);
    this.stockRepo = new StockRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const countRow: any = this.db.prepare('SELECT COUNT(*) as count FROM sales').get();
    const seq = String((countRow?.count || 0) + 1).padStart(6, '0');
    return `INV-${year}-${seq}`;
  }

  createSale(input: CreateSaleInput): { success: boolean; saleId?: number; invoiceNumber?: string; error?: string } {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Cannot complete sale with an empty cart.' };
    }
    const payments = input.payments && input.payments.length > 0
      ? input.payments
      : [{ payment_method: 'CASH' as const, amount: input.total }];

    // Validate payment total matches invoice total (unless credit sale)
    const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const isCreditSale = payments.some((p) => p.payment_method === 'CREDIT');

    if (!isCreditSale && paidTotal < input.total) {
      return { success: false, error: `Insufficient payment amount. Total is ₹${input.total}, but paid amount is ₹${paidTotal}.` };
    }

    try {
      const transaction = this.db.transaction(() => {
        // 1. Re-check stock for all cart items before committing
        for (const item of input.items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (!variant) {
            throw new Error(`Variant ID ${item.product_variant_id} no longer exists.`);
          }
          if (variant.current_stock < item.quantity) {
            throw new Error(`Insufficient stock for ${variant.sku}. Available: ${variant.current_stock}, Requested: ${item.quantity}.`);
          }
        }

        // 2. Generate Invoice Number & Create Sale Header
        const invoiceNumber = this.generateInvoiceNumber();
        const saleId = this.saleRepo.createSale({
          invoice_number: invoiceNumber,
          customer_id: input.customer_id || 1, // Default Walk-in Customer (ID 1)
          subtotal: input.subtotal,
          discount: input.discount || 0,
          tax: input.tax || 0,
          total: input.total,
          paid_amount: paidTotal,
          balance_amount: Math.max(0, input.total - paidTotal),
          status: 'COMPLETED',
          created_by: input.created_by,
        });

        // 3. Create Sale Items & Deduct Stock Atomically
        for (const item of input.items) {
          const lineTotal = item.quantity * item.unit_price - (item.discount || 0);

          this.saleRepo.createSaleItem({
            sale_id: saleId,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: lineTotal,
          });

          // Deduct Stock
          const variant = this.productRepo.getVariantById(item.product_variant_id)!;
          const prevStock = variant.current_stock;
          const newStock = prevStock - item.quantity;

          this.productRepo.updateVariantStock(item.product_variant_id, newStock);

          // Write Stock Ledger Transaction
          this.stockRepo.createTransaction({
            product_variant_id: item.product_variant_id,
            transaction_type: 'SALE',
            quantity: -item.quantity,
            reference_type: 'SALE_INVOICE',
            reference_id: saleId,
            previous_quantity: prevStock,
            new_quantity: newStock,
            notes: `Sale Checkout: Invoice ${invoiceNumber}`,
            created_by: input.created_by,
          });
        }

        // 4. Create Payments
        for (const p of payments) {
          this.saleRepo.createPayment({
            sale_id: saleId,
            payment_method: p.payment_method,
            amount: p.amount,
            reference_number: p.reference_number,
          });
        }

        // 5. Create Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'SALE_CREATED',
          entity_type: 'SALE',
          entity_id: saleId,
          new_value: `Completed Sale ${invoiceNumber} for Total ₹${input.total}`,
        });

        return { saleId, invoiceNumber };
      });

      const res = transaction();
      return { success: true, saleId: res.saleId, invoiceNumber: res.invoiceNumber };
    } catch (error: any) {
      log.error('Failed to complete sale transaction:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  cancelSale(saleId: number, actorUserId?: number): { success: boolean; error?: string } {
    try {
      const transaction = this.db.transaction(() => {
        const sale = this.saleRepo.getSaleById(saleId);
        if (!sale) {
          throw new Error('Sale invoice not found.');
        }
        if (sale.status === 'CANCELLED') {
          throw new Error('Sale is already cancelled.');
        }

        // 1. Update Sale Status
        this.db.prepare("UPDATE sales SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(saleId);

        // 2. Reverse Stock for all Sale Items
        const items = this.saleRepo.getSaleItems(saleId);
        for (const item of items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (variant) {
            const prevStock = variant.current_stock;
            const newStock = prevStock + item.quantity;

            this.productRepo.updateVariantStock(item.product_variant_id, newStock);

            this.stockRepo.createTransaction({
              product_variant_id: item.product_variant_id,
              transaction_type: 'RETURN',
              quantity: item.quantity,
              reference_type: 'SALE_CANCELLATION',
              reference_id: saleId,
              previous_quantity: prevStock,
              new_quantity: newStock,
              notes: `Cancelled Invoice ${sale.invoice_number} stock reversal`,
              created_by: actorUserId,
            });
          }
        }

        // 3. Audit Log
        this.auditRepo.log({
          user_id: actorUserId,
          action: 'SALE_CANCELLED',
          entity_type: 'SALE',
          entity_id: saleId,
          old_value: `Invoice ${sale.invoice_number} Total ₹${sale.total}`,
          new_value: 'Cancelled & Stock Restored',
        });

        return true;
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      log.error('Failed to cancel sale:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  getSaleDetails(saleId: number) {
    const sale = this.saleRepo.getSaleById(saleId);
    const items = this.saleRepo.getSaleItems(saleId);
    const payments = this.saleRepo.getPayments(saleId);
    return { sale, items, payments };
  }
}
