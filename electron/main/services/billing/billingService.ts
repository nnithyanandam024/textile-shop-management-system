import Database from 'better-sqlite3';
import { getDatabase } from '../../database';
import { SaleRepository } from '../../repositories/saleRepository';
import { InvoiceSequenceRepository } from '../../repositories/invoiceSequenceRepository';
import { BillingCalculationEngine, BillCalculationInput } from './billingCalculationEngine';
import log from '../../logger';

export interface CheckoutPaymentInput {
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  amount: number;
  reference_number?: string;
  notes?: string;
}

export interface CheckoutSaleRequest {
  customerId: number;
  calculationInput: BillCalculationInput;
  payments: CheckoutPaymentInput[];
  notes?: string;
  isTaxInvoice?: boolean;
  userId?: number;
  approvedBy?: number;
}

export interface CheckoutSaleResult {
  success: boolean;
  saleId?: number;
  invoiceNumber?: string;
  grandTotal?: number;
  error?: string;
}

export class BillingService {
  /**
   * Processes POS bill checkout atomically in a single database transaction
   */
  public static checkoutSale(request: CheckoutSaleRequest, dbInstance?: Database.Database): CheckoutSaleResult {
    const db = dbInstance || getDatabase();
    const saleRepo = new SaleRepository(db);
    const seqRepo = new InvoiceSequenceRepository(db);

    try {
      const calcResult = BillingCalculationEngine.calculateBill(request.calculationInput);
      const totalPayable = calcResult.grandTotal;

      // 1. Verify payment total matches payable amount
      const totalPaid = request.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
      if (Math.abs(totalPaid - totalPayable) > 0.99) {
        return {
          success: false,
          error: `Payment amount mismatch. Total payable: ₹${totalPayable}, Total payment entered: ₹${totalPaid}.`,
        };
      }

      // 2. Validate stock availability for all items
      for (const item of calcResult.items) {
        const variantRow = db.prepare('SELECT current_stock, sku FROM product_variants WHERE id = ?').get(item.variantId) as { current_stock: number; sku: string } | undefined;
        if (!variantRow) {
          return {
            success: false,
            error: `Product variant with ID ${item.variantId} (${item.sku}) was not found in inventory.`,
          };
        }
        if (variantRow.current_stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${item.productName} (${variantRow.sku}). Available: ${variantRow.current_stock}, Requested: ${item.quantity}.`,
          };
        }
      }

      // 3. Execute Atomic Transaction
      const executeTransaction = db.transaction(() => {
        // A. Generate Next Sequential Invoice Number
        const invoiceNumber = seqRepo.getNextInvoiceNumber('INV');

        // B. Insert Sale Master Record
        const saleId = saleRepo.createSale({
          invoice_number: invoiceNumber,
          customer_id: request.customerId,
          subtotal: calcResult.subtotal,
          discount: calcResult.totalDiscount,
          discount_type: request.calculationInput.billDiscountType || 'FIXED',
          discount_reason: request.calculationInput.billDiscountValue ? 'Bill Discount' : undefined,
          tax: calcResult.totalTaxAmount,
          round_off_amount: calcResult.roundOffAmount,
          cgst_amount: calcResult.cgstAmount,
          sgst_amount: calcResult.sgstAmount,
          igst_amount: calcResult.igstAmount,
          total: calcResult.grandTotal,
          paid_amount: totalPaid,
          balance_amount: Math.max(0, calcResult.grandTotal - totalPaid),
          status: 'COMPLETED',
          notes: request.notes,
          created_by: request.userId,
          approved_by: request.approvedBy,
          is_tax_invoice: request.isTaxInvoice ? 1 : 0,
        });

        // C. Insert Sale Items with snapshots & Decrement Stock
        for (const item of calcResult.items) {
          saleRepo.createSaleItem({
            sale_id: saleId,
            product_variant_id: item.variantId,
            product_name_snapshot: item.productName,
            sku_snapshot: item.sku,
            hsn_code_snapshot: item.hsnCode,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discountAmount,
            discount_amount: item.discountAmount,
            tax: item.taxAmount,
            tax_rate: item.taxRate,
            tax_amount: item.taxAmount,
            total: item.lineTotal,
          });

          // Atomically decrement stock
          const prevStockRow = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(item.variantId) as { current_stock: number };
          const newStock = Math.max(0, prevStockRow.current_stock - item.quantity);

          db.prepare('UPDATE product_variants SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, item.variantId);

          // Create stock audit transaction record
          db.prepare(`
            INSERT INTO stock_transactions (
              product_variant_id, transaction_type, quantity, previous_quantity, new_quantity, notes, created_by
            ) VALUES (?, 'SALE', ?, ?, ?, ?, ?)
          `).run(
            item.variantId,
            -item.quantity,
            prevStockRow.current_stock,
            newStock,
            `POS Sale Invoice: ${invoiceNumber}`,
            request.userId || null
          );
        }

        // D. Insert Payment Records
        for (const payment of request.payments) {
          saleRepo.createPayment({
            sale_id: saleId,
            payment_method: payment.payment_method,
            amount: payment.amount,
            reference_number: payment.reference_number,
          });
        }

        // E. Update Customer Lifetime Metrics
        if (request.customerId && request.customerId > 0) {
          const hasCreditPayment = request.payments.some((p) => p.payment_method === 'CREDIT');
          const creditAmount = request.payments
            .filter((p) => p.payment_method === 'CREDIT')
            .reduce((sum, p) => sum + p.amount, 0);

          db.prepare(`
            UPDATE customers
            SET total_purchases = total_purchases + ?,
                outstanding_balance = outstanding_balance + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(calcResult.grandTotal, creditAmount, request.customerId);
        }

        return { saleId, invoiceNumber, grandTotal: calcResult.grandTotal };
      });

      const txResult = executeTransaction();
      log.info(`[BillingService] Successfully finalized invoice ${txResult.invoiceNumber} for ₹${txResult.grandTotal}`);

      return {
        success: true,
        saleId: txResult.saleId,
        invoiceNumber: txResult.invoiceNumber,
        grandTotal: txResult.grandTotal,
      };
    } catch (err: any) {
      log.error('[BillingService] Failed to checkout sale:', err);
      return {
        success: false,
        error: err.message || 'Internal database error during sale checkout.',
      };
    }
  }

  /**
   * Retrieves complete invoice details with store settings for printing/PDF
   */
  public static getFullInvoiceData(saleId: number, dbInstance?: Database.Database) {
    const db = dbInstance || getDatabase();
    const saleRepo = new SaleRepository(db);

    const sale = saleRepo.getSaleById(saleId);
    if (!sale) return null;

    const items = saleRepo.getSaleItems(saleId);
    const payments = saleRepo.getPayments(saleId);

    // Fetch store branding settings
    const settingsRows = db.prepare("SELECT key, value FROM settings WHERE key IN ('shop_name', 'shop_address', 'shop_phone', 'shop_email', 'shop_gst', 'currency_symbol')").all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((r) => { settingsMap[r.key] = r.value; });

    return {
      sale,
      items,
      payments,
      shopName: settingsMap['shop_name'] || 'ரத்னா விலாஸ் (Ratna Vilas)',
      shopAddress: settingsMap['shop_address'] || '123 Cross Cut Road, Gandhipuram, Coimbatore, TN - 641012',
      shopPhone: settingsMap['shop_phone'] || '+91 98765 43210',
      shopEmail: settingsMap['shop_email'] || 'contact@ratnavilas.com',
      shopGst: settingsMap['shop_gst'] || '33AAAAA0000A1Z5',
      currencySymbol: settingsMap['currency_symbol'] || '₹',
      amountInWords: BillingCalculationEngine.amountToWords(sale.total),
    };
  }
}
