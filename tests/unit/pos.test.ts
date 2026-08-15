import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initDatabase } from '../../electron/main/database';
import { seedDatabase } from '../../electron/main/database/seed';
import { ProductService } from '../../electron/main/services/productService';
import { SalesService } from '../../electron/main/services/salesService';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import { StockRepository } from '../../electron/main/repositories/stockRepository';
import { SaleRepository } from '../../electron/main/repositories/saleRepository';
import { SessionService } from '../../electron/main/services/auth/sessionService';

describe('Phase 5 POS & Billing System Test Suite', () => {
  let tempDbPath: string;
  let db: any;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-test-'));
    tempDbPath = path.join(tempDir, 'test-pos.db');
    db = initDatabase(tempDbPath);
    seedDatabase(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    try {
      if (fs.existsSync(tempDbPath)) {
        const tempDir = path.dirname(tempDbPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore Windows handle release delays
    }
    SessionService.clearSession();
  });

  it('1. should process atomic checkout sale, deduct stock, and write stock ledger entries', () => {
    const productService = new ProductService(db);
    const salesService = new SalesService(db);
    const productRepo = new ProductRepository(db);
    const stockRepo = new StockRepository(db);
    const saleRepo = new SaleRepository(db);

    // Create a product variant
    productService.createProductWithVariants({
      name: "Men's Cotton Formal Shirt",
      category_id: 1,
      variants: [
        { sku: 'SH-COT-BLU-M', barcode: '890123456789', purchase_price: 500, selling_price: 1000, initial_stock: 20 },
      ],
    });

    const variant = productRepo.getVariantBySku('SH-COT-BLU-M')!;
    expect(variant.current_stock).toBe(20);

    // Perform Checkout for 3 items
    const saleRes = salesService.createSale({
      customer_id: undefined, // Walk-in customer
      items: [
        { product_variant_id: variant.id, quantity: 3, unit_price: 1000, discount: 0 },
      ],
      payments: [
        { payment_method: 'CASH', amount: 3150 },
      ],
      subtotal: 3000,
      discount: 0,
      tax: 150,
      total: 3150,
    });

    if (!saleRes.success) console.error('Test 1 error:', saleRes.error);
    expect(saleRes.success).toBe(true);
    expect(saleRes.saleId).toBeDefined();
    expect(saleRes.invoiceNumber).toContain('INV-');

    // Verify Variant Stock is deducted to 17
    const updatedVariant = productRepo.getVariantBySku('SH-COT-BLU-M')!;
    expect(updatedVariant.current_stock).toBe(17);

    // Verify Stock Ledger entry recorded (Type: SALE, quantity: -3)
    const txList = stockRepo.getTransactionsByVariant(variant.id);
    expect(txList.length).toBe(2); // Initial Stock + Sale
    const saleTx = txList.find((t) => t.transaction_type === 'SALE')!;
    expect(saleTx.quantity).toBe(-3);
    expect(saleTx.new_quantity).toBe(17);

    // Verify Sale Record
    const sale = saleRepo.getSaleById(saleRes.saleId!)!;
    expect(sale.total).toBe(3150);
    expect(sale.status).toBe('COMPLETED');
  });

  it('2. should support Split Payments (Cash + UPI)', () => {
    const productService = new ProductService(db);
    const salesService = new SalesService(db);
    const productRepo = new ProductRepository(db);

    productService.createProductWithVariants({
      name: 'Silk Saree Royal',
      category_id: 2,
      variants: [
        { sku: 'SAR-ROY-GOLD', purchase_price: 2000, selling_price: 5000, initial_stock: 10 },
      ],
    });

    const variant = productRepo.getVariantBySku('SAR-ROY-GOLD')!;

    // Perform Split Payment Checkout: ₹2000 Cash + ₹3000 UPI
    const saleRes = salesService.createSale({
      items: [
        { product_variant_id: variant.id, quantity: 1, unit_price: 5000 },
      ],
      payments: [
        { payment_method: 'CASH', amount: 2000 },
        { payment_method: 'UPI', amount: 3000, reference_number: 'UPI987654' },
      ],
      subtotal: 5000,
      total: 5000,
    });

    expect(saleRes.success).toBe(true);

    const saleRepo = new SaleRepository(db);
    const payments = saleRepo.getPayments(saleRes.saleId!);
    expect(payments.length).toBe(2);
    expect(payments.some((p) => p.payment_method === 'CASH' && p.amount === 2000)).toBe(true);
    expect(payments.some((p) => p.payment_method === 'UPI' && p.amount === 3000)).toBe(true);
  });

  it('3. should ROLL BACK transaction and reject sale if stock is insufficient', () => {
    const productService = new ProductService(db);
    const salesService = new SalesService(db);
    const productRepo = new ProductRepository(db);
    const saleRepo = new SaleRepository(db);

    productService.createProductWithVariants({
      name: 'Low Stock Kurti',
      category_id: 2,
      variants: [
        { sku: 'KUR-LOW-001', purchase_price: 300, selling_price: 600, initial_stock: 2 },
      ],
    });

    const variant = productRepo.getVariantBySku('KUR-LOW-001')!;

    // Attempt to sell 5 units when stock is only 2
    const saleRes = salesService.createSale({
      items: [
        { product_variant_id: variant.id, quantity: 5, unit_price: 600 },
      ],
      payments: [
        { payment_method: 'CASH', amount: 3000 },
      ],
      subtotal: 3000,
      total: 3000,
    });

    expect(saleRes.success).toBe(false);
    expect(saleRes.error).toContain('Insufficient stock');

    // Verify stock remains untouched at 2
    const unchangedVariant = productRepo.getVariantBySku('KUR-LOW-001')!;
    expect(unchangedVariant.current_stock).toBe(2);

    // Verify no sales records created
    const allSales = saleRepo.getAllSales();
    expect(allSales.length).toBe(0);
  });

  it('4. should process Sale Cancellation and restore inventory stock', () => {
    const productService = new ProductService(db);
    const salesService = new SalesService(db);
    const productRepo = new ProductRepository(db);
    const saleRepo = new SaleRepository(db);

    productService.createProductWithVariants({
      name: 'Cancel Test Denim',
      category_id: 1,
      variants: [
        { sku: 'DNM-CAN-32', purchase_price: 700, selling_price: 1400, initial_stock: 10 },
      ],
    });

    const variant = productRepo.getVariantBySku('DNM-CAN-32')!;

    // Complete sale of 2 units
    const saleRes = salesService.createSale({
      items: [
        { product_variant_id: variant.id, quantity: 2, unit_price: 1400 },
      ],
      payments: [
        { payment_method: 'CASH', amount: 2800 },
      ],
      subtotal: 2800,
      total: 2800,
    });

    expect(productRepo.getVariantBySku('DNM-CAN-32')!.current_stock).toBe(8);

    // Cancel Sale
    const cancelRes = salesService.cancelSale(saleRes.saleId!);
    expect(cancelRes.success).toBe(true);

    // Verify Stock restored back to 10
    const restoredVariant = productRepo.getVariantBySku('DNM-CAN-32')!;
    expect(restoredVariant.current_stock).toBe(10);

    // Verify Sale status is CANCELLED
    const cancelledSale = saleRepo.getSaleById(saleRes.saleId!)!;
    expect(cancelledSale.status).toBe('CANCELLED');
  });
});
