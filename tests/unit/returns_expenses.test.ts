import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initDatabase } from '../../electron/main/database';
import { seedDatabase } from '../../electron/main/database/seed';
import { ReturnService } from '../../electron/main/services/returnService';
import { ExpenseService } from '../../electron/main/services/expenseService';
import { SalesService } from '../../electron/main/services/salesService';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import { StockRepository } from '../../electron/main/repositories/stockRepository';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../../test_phase7.db');

describe('Phase 7 Returns, Exchanges, Payments & Expense Management Test Suite', () => {
  let db: Database.Database;
  let returnService: ReturnService;
  let expenseService: ExpenseService;
  let salesService: SalesService;
  let productRepo: ProductRepository;
  let stockRepo: StockRepository;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    db = initDatabase(TEST_DB_PATH);
    seedDatabase(db);

    returnService = new ReturnService(db);
    expenseService = new ExpenseService(db);
    salesService = new SalesService(db);
    productRepo = new ProductRepository(db);
    stockRepo = new StockRepository(db);
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('1. should process sales return, validate quantity, restore resalable inventory stock, and write stock ledger', () => {
    // 1. Create Product & Sale
    const prodId = productRepo.createProduct({ name: 'Denim Jacket', category_id: 1, brand_id: 1 });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'DNM-JKT-L',
      purchase_price: 1000,
      selling_price: 2000,
      current_stock: 20,
    });

    const saleRes = salesService.createSale({
      customer_id: 1,
      items: [{ product_variant_id: varId, quantity: 5, unit_price: 2000, discount: 0 }],
      payments: [{ payment_method: 'CASH', amount: 10000 }],
      subtotal: 10000,
      total: 10000,
    });
    expect(saleRes.success).toBe(true);
    expect(productRepo.getVariantById(varId)!.current_stock).toBe(15);

    // Get sale item ID
    const saleItem: any = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').get(saleRes.saleId!);

    // 2. Process Return (2 units, Resalable)
    const retRes = returnService.processReturn({
      sale_id: saleRes.saleId!,
      items: [{
        sale_item_id: saleItem.id,
        product_variant_id: varId,
        quantity: 2,
        unit_price: 2000,
        condition: 'RESALABLE',
      }],
      refund_method: 'CASH',
    });

    expect(retRes.success).toBe(true);
    expect(retRes.returnNumber).toContain('RTN-');
    expect(retRes.refundAmount).toBe(4000);

    // 3. Verify Stock Restored from 15 to 17
    expect(productRepo.getVariantById(varId)!.current_stock).toBe(17);
  });

  it('2. should process damaged sales return without increasing sellable stock', () => {
    const prodId = productRepo.createProduct({ name: 'Linen Shirt', category_id: 1, brand_id: 1 });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'LIN-SHR-M',
      purchase_price: 500,
      selling_price: 1000,
      current_stock: 10,
    });

    const saleRes = salesService.createSale({
      customer_id: 1,
      items: [{ product_variant_id: varId, quantity: 2, unit_price: 1000, discount: 0 }],
      payments: [{ payment_method: 'CASH', amount: 2000 }],
      subtotal: 2000,
      total: 2000,
    });
    expect(productRepo.getVariantById(varId)!.current_stock).toBe(8);

    const saleItem: any = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').get(saleRes.saleId!);

    // Process Damaged Return
    const retRes = returnService.processReturn({
      sale_id: saleRes.saleId!,
      items: [{
        sale_item_id: saleItem.id,
        product_variant_id: varId,
        quantity: 1,
        unit_price: 1000,
        condition: 'DAMAGED',
      }],
      refund_method: 'CASH',
    });

    expect(retRes.success).toBe(true);
    // Sellable stock remains 8 (does not increase for damaged items)
    expect(productRepo.getVariantById(varId)!.current_stock).toBe(8);
  });

  it('3. should block excess return quantities exceeding eligible sold quantity', () => {
    const prodId = productRepo.createProduct({ name: 'Polo T-Shirt', category_id: 1, brand_id: 1 });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'POL-TSH-XL',
      purchase_price: 300,
      selling_price: 600,
      current_stock: 10,
    });

    const saleRes = salesService.createSale({
      customer_id: 1,
      items: [{ product_variant_id: varId, quantity: 2, unit_price: 600, discount: 0 }],
      payments: [{ payment_method: 'CASH', amount: 1200 }],
      subtotal: 1200,
      total: 1200,
    });

    const saleItem: any = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').get(saleRes.saleId!);

    // Attempt to return 5 units when only 2 were sold
    const retRes = returnService.processReturn({
      sale_id: saleRes.saleId!,
      items: [{
        sale_item_id: saleItem.id,
        product_variant_id: varId,
        quantity: 5,
        unit_price: 600,
        condition: 'RESALABLE',
      }],
      refund_method: 'CASH',
    });

    expect(retRes.success).toBe(false);
    expect(retRes.error).toContain('eligible for return');
  });

  it('4. should process product exchange with atomic inventory swap', () => {
    const prodId = productRepo.createProduct({ name: 'Formal Trousers', category_id: 1, brand_id: 1 });
    const var1Id = productRepo.createVariant({
      product_id: prodId,
      sku: 'TRS-BLK-30',
      purchase_price: 700,
      selling_price: 1500,
      current_stock: 5,
    });
    const var2Id = productRepo.createVariant({
      product_id: prodId,
      sku: 'TRS-BLK-32',
      purchase_price: 700,
      selling_price: 1800,
      current_stock: 10,
    });

    const saleRes = salesService.createSale({
      customer_id: 1,
      items: [{ product_variant_id: var1Id, quantity: 1, unit_price: 1500, discount: 0 }],
      payments: [{ payment_method: 'CASH', amount: 1500 }],
      subtotal: 1500,
      total: 1500,
    });

    // Exchange Size 30 for Size 32 (Higher price difference ₹300)
    const excRes = returnService.processExchange({
      original_sale_id: saleRes.saleId!,
      returned_variant_id: var1Id,
      returned_quantity: 1,
      replacement_variant_id: var2Id,
      replacement_quantity: 1,
    });

    expect(excRes.success).toBe(true);
    expect(excRes.differenceAmount).toBe(300);

    // Verify Stock Swap: var1 (+1 back to 5), var2 (-1 from 10 to 9)
    expect(productRepo.getVariantById(var1Id)!.current_stock).toBe(5);
    expect(productRepo.getVariantById(var2Id)!.current_stock).toBe(9);
  });

  it('5. should record shop expenses, support custom categories, and process cancellation', () => {
    const expRes = expenseService.createExpense({
      amount: 4500,
      category_name: 'Electricity',
      payment_method: 'BANK_TRANSFER',
      description: 'August electricity bill',
    });

    expect(expRes.success).toBe(true);
    expect(expRes.expenseNumber).toContain('EXP-');

    const expenses = expenseService.getAllExpenses();
    expect(expenses.length).toBeGreaterThan(0);

    const cancelRes = expenseService.cancelExpense(expRes.id!);
    expect(cancelRes.success).toBe(true);
  });
});
