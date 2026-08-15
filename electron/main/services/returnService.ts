import Database from 'better-sqlite3';
import { SaleRepository } from '../repositories/saleRepository';
import { ProductRepository } from '../repositories/productRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface ReturnItemInput {
  sale_item_id: number;
  product_variant_id: number;
  quantity: number;
  unit_price: number;
  condition: 'RESALABLE' | 'DAMAGED';
  reason?: string;
}

export interface ProcessReturnInput {
  sale_id: number;
  items: ReturnItemInput[];
  refund_method: string;
  refund_reference?: string;
  reason?: string;
  created_by?: number;
}

export interface ProcessExchangeInput {
  original_sale_id: number;
  returned_variant_id: number;
  returned_quantity: number;
  replacement_variant_id: number;
  replacement_quantity: number;
  payment_method?: string;
  reference_number?: string;
  reason?: string;
  created_by?: number;
}

export class ReturnService {
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

  generateReturnNumber(): string {
    const year = new Date().getFullYear();
    const countRow: any = this.db.prepare('SELECT COUNT(*) as count FROM returns').get();
    const seq = String((countRow?.count || 0) + 1).padStart(6, '0');
    return `RTN-${year}-${seq}`;
  }

  generateExchangeNumber(): string {
    const year = new Date().getFullYear();
    const countRow: any = this.db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action = 'PRODUCT_EXCHANGE'").get();
    const seq = String((countRow?.count || 0) + 1).padStart(6, '0');
    return `EXC-${year}-${seq}`;
  }

  processReturn(input: ProcessReturnInput): { success: boolean; returnId?: number; returnNumber?: string; refundAmount?: number; error?: string } {
    if (!input.sale_id) return { success: false, error: 'Sale ID is required.' };
    if (!input.items || input.items.length === 0) return { success: false, error: 'At least one return item is required.' };

    try {
      const transaction = this.db.transaction(() => {
        const sale = this.saleRepo.getSaleById(input.sale_id);
        if (!sale) throw new Error('Original sale invoice not found.');

        const returnNumber = this.generateReturnNumber();
        let totalRefund = 0;

        // 1. Create Return Header
        const info = this.db.prepare(`
          INSERT INTO returns (
            return_number, sale_id, customer_id, return_type, refund_amount, reason, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          returnNumber,
          input.sale_id,
          sale.customer_id,
          input.refund_method,
          0,
          input.reason || 'Sales Return',
          input.created_by || null
        );
        const returnId = Number(info.lastInsertRowid);

        // 2. Validate Items & Process Return Items
        for (const item of input.items) {
          if (item.quantity <= 0) throw new Error('Return quantity must be greater than 0.');

          // Validate against original sale item
          const saleItem: any = this.db.prepare('SELECT * FROM sale_items WHERE id = ?').get(item.sale_item_id);
          if (!saleItem) throw new Error(`Sale item ID ${item.sale_item_id} not found.`);

          // Check previously returned quantity
          const returnedRow: any = this.db.prepare(`
            SELECT COALESCE(SUM(quantity), 0) as total_returned 
            FROM return_items 
            WHERE sale_item_id = ?
          `).get(item.sale_item_id);
          
          const prevReturned = returnedRow?.total_returned || 0;
          const eligibleQty = saleItem.quantity - prevReturned;

          if (item.quantity > eligibleQty) {
            throw new Error(`Cannot return ${item.quantity} units. Only ${eligibleQty} units are eligible for return.`);
          }

          const lineRefund = item.quantity * item.unit_price;
          totalRefund += lineRefund;

          // Insert Return Item
          this.db.prepare(`
            INSERT INTO return_items (
              return_id, sale_item_id, product_variant_id, quantity, refund_amount, condition, reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            returnId,
            item.sale_item_id,
            item.product_variant_id,
            item.quantity,
            lineRefund,
            item.condition,
            item.reason || null
          );

          // Inventory & Stock Ledger Handling
          const variant = this.productRepo.getVariantById(item.product_variant_id);
          if (variant) {
            const prevStock = variant.current_stock;
            
            if (item.condition === 'RESALABLE') {
              // Increase Sellable Stock
              const newStock = prevStock + item.quantity;
              this.productRepo.updateVariantStock(item.product_variant_id, newStock);

              this.stockRepo.createTransaction({
                product_variant_id: item.product_variant_id,
                transaction_type: 'SALES_RETURN',
                quantity: item.quantity,
                reference_type: 'RETURN',
                reference_id: returnId,
                previous_quantity: prevStock,
                new_quantity: newStock,
                notes: `Sales Return ${returnNumber} (Resalable)`,
                created_by: input.created_by,
              });
            } else {
              // Damaged condition: Log to stock ledger without increasing sellable inventory
              this.stockRepo.createTransaction({
                product_variant_id: item.product_variant_id,
                transaction_type: 'SALES_RETURN_DAMAGED',
                quantity: 0,
                reference_type: 'RETURN',
                reference_id: returnId,
                previous_quantity: prevStock,
                new_quantity: prevStock,
                notes: `Sales Return ${returnNumber} (Damaged Stock Logged - ${item.quantity} units)`,
                created_by: input.created_by,
              });
            }
          }
        }

        // Update Total Refund Amount in Return Header
        this.db.prepare('UPDATE returns SET refund_amount = ? WHERE id = ?').run(totalRefund, returnId);

        // Security Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'SALE_RETURN',
          entity_type: 'RETURN',
          entity_id: returnId,
          new_value: `Processed Return ${returnNumber} for Invoice ${sale.invoice_number} (Refund ₹${totalRefund})`,
        });

        return { returnId, returnNumber, refundAmount: totalRefund };
      });

      const res = transaction();
      return { success: true, returnId: res.returnId, returnNumber: res.returnNumber, refundAmount: res.refundAmount };
    } catch (error: any) {
      log.error('Failed to process sales return:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  processExchange(input: ProcessExchangeInput): { success: boolean; exchangeNumber?: string; differenceAmount?: number; error?: string } {
    try {
      const transaction = this.db.transaction(() => {
        const sale = this.saleRepo.getSaleById(input.original_sale_id);
        if (!sale) throw new Error('Original sale invoice not found.');

        const retVar = this.productRepo.getVariantById(input.returned_variant_id);
        const repVar = this.productRepo.getVariantById(input.replacement_variant_id);

        if (!retVar || !repVar) throw new Error('Invalid product variant selected for exchange.');

        // Check replacement stock
        if (repVar.current_stock < input.replacement_quantity) {
          throw new Error(`Insufficient stock for replacement variant ${repVar.sku}. Available stock is ${repVar.current_stock}.`);
        }

        const exchangeNumber = this.generateExchangeNumber();
        const returnedValue = retVar.selling_price * input.returned_quantity;
        const replacementValue = repVar.selling_price * input.replacement_quantity;
        const difference = replacementValue - returnedValue;

        // 1. Swap Stock Atomically
        // Returned variant (+ Qty)
        const prevRetStock = retVar.current_stock;
        const newRetStock = prevRetStock + input.returned_quantity;
        this.productRepo.updateVariantStock(input.returned_variant_id, newRetStock);
        this.stockRepo.createTransaction({
          product_variant_id: input.returned_variant_id,
          transaction_type: 'EXCHANGE_IN',
          quantity: input.returned_quantity,
          reference_type: 'EXCHANGE',
          previous_quantity: prevRetStock,
          new_quantity: newRetStock,
          notes: `Exchange Inward ${exchangeNumber}`,
          created_by: input.created_by,
        });

        // Replacement variant (- Qty)
        const prevRepStock = repVar.current_stock;
        const newRepStock = prevRepStock - input.replacement_quantity;
        this.productRepo.updateVariantStock(input.replacement_variant_id, newRepStock);
        this.stockRepo.createTransaction({
          product_variant_id: input.replacement_variant_id,
          transaction_type: 'EXCHANGE_OUT',
          quantity: -input.replacement_quantity,
          reference_type: 'EXCHANGE',
          previous_quantity: prevRepStock,
          new_quantity: newRepStock,
          notes: `Exchange Outward ${exchangeNumber}`,
          created_by: input.created_by,
        });

        // Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'PRODUCT_EXCHANGE',
          entity_type: 'SALE',
          entity_id: input.original_sale_id,
          new_value: `Completed Exchange ${exchangeNumber}: Swapped ${retVar.sku} for ${repVar.sku} (Difference ₹${difference})`,
        });

        return { exchangeNumber, differenceAmount: difference };
      });

      const res = transaction();
      return { success: true, exchangeNumber: res.exchangeNumber, differenceAmount: res.differenceAmount };
    } catch (error: any) {
      log.error('Failed to process product exchange:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  getAllReturns(): any[] {
    return this.db.prepare(`
      SELECT r.*, r.return_type as refund_method, s.invoice_number, c.name as customer_name
      FROM returns r
      JOIN sales s ON r.sale_id = s.id
      LEFT JOIN customers c ON r.customer_id = c.id
      ORDER BY r.id DESC
    `).all();
  }
}
