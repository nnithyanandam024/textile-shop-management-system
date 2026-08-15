import Database from 'better-sqlite3';
import { SaleRepository } from '../repositories/saleRepository';
import { ProductRepository } from '../repositories/productRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface CreateSaleInput {
  invoice_number: string;
  customer_id: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paid_amount?: number;
  notes?: string;
  created_by?: number;
  items: {
    product_variant_id: number;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax?: number;
    total: number;
  }[];
  payment: {
    payment_method: string;
    amount: number;
    reference_number?: string;
  };
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

  createSale(input: CreateSaleInput): { success: boolean; saleId?: number; error?: string } {
    // Validate Input
    if (!input.invoice_number || !input.customer_id || input.items.length === 0) {
      return { success: false, error: 'Invoice number, customer, and at least one item are required.' };
    }

    if (input.total < 0) {
      return { success: false, error: 'Sale total cannot be negative.' };
    }

    try {
      // Execute inside ATOMIC TRANSACTION
      const transaction = this.db.transaction(() => {
        // 1. Check stock availability for all items before making changes
        for (const item of input.items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (!variant) {
            throw new Error(`Product variant with ID ${item.product_variant_id} does not exist.`);
          }
          if (variant.current_stock < item.quantity) {
            throw new Error(`Insufficient stock for SKU ${variant.sku}. Current: ${variant.current_stock}, Requested: ${item.quantity}`);
          }
        }

        // 2. Create Sale Header
        const saleId = this.saleRepo.createSale({
          invoice_number: input.invoice_number,
          customer_id: input.customer_id,
          subtotal: input.subtotal,
          discount: input.discount,
          tax: input.tax,
          total: input.total,
          paid_amount: input.paid_amount ?? input.total,
          notes: input.notes,
          created_by: input.created_by,
        });

        // 3. Create Sale Items & Deduct Stock
        for (const item of input.items) {
          const variant = this.productRepo.getVariantById(item.product_variant_id)!;
          const prevStock = variant.current_stock;
          const newStock = prevStock - item.quantity;

          this.saleRepo.createSaleItem({
            sale_id: saleId,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            tax: item.tax,
            total: item.total,
          });

          // Deduct Stock
          this.productRepo.updateVariantStock(item.product_variant_id, newStock);

          // Audit Stock Transaction Ledger
          this.stockRepo.createTransaction({
            product_variant_id: item.product_variant_id,
            transaction_type: 'SALE',
            quantity: -item.quantity,
            reference_type: 'SALE',
            reference_id: saleId,
            previous_quantity: prevStock,
            new_quantity: newStock,
            notes: `Sale Invoice #${input.invoice_number}`,
            created_by: input.created_by,
          });
        }

        // 4. Record Payment
        this.saleRepo.createPayment({
          sale_id: saleId,
          payment_method: input.payment.payment_method,
          amount: input.payment.amount,
          reference_number: input.payment.reference_number,
        });

        // 5. Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'CREATE_SALE',
          entity_type: 'SALE',
          entity_id: saleId,
          new_value: `Invoice #${input.invoice_number} - Total ₹${input.total}`,
        });

        return saleId;
      });

      const saleId = transaction();
      return { success: true, saleId };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }
}
