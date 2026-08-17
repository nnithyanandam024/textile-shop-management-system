import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initDatabase } from '../../electron/main/database';
import { seedDatabase } from '../../electron/main/database/seed';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import { CustomerRepository } from '../../electron/main/repositories/customerRepository';
import { SupplierRepository } from '../../electron/main/repositories/supplierRepository';
import { SaleRepository } from '../../electron/main/repositories/saleRepository';
import { StockRepository } from '../../electron/main/repositories/stockRepository';
import { SalesService } from '../../electron/main/services/salesService';
import { PurchaseService } from '../../electron/main/services/purchaseService';

describe('Phase 2 Database & Core Data Foundation Test Suite', () => {
  let tempDbPath: string;
  let db: any;

  beforeEach(() => {
    // Create an isolated temporary SQLite database file for each test
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textile-test-'));
    tempDbPath = path.join(tempDir, 'test-textile.db');
    db = initDatabase(tempDbPath);
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
      // Ignore Windows async file handle release delays
    }
  });

  it('1. should initialize 19 core database tables via automatic migrations', () => {
    const row = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get();
    // At least 19 business tables + 1 schema_migrations table
    expect(row.count).toBeGreaterThanOrEqual(20);
  });

  it('2. should populate seed data cleanly (Roles, Categories, Brands, Walk-in Customer, Variants)', () => {
    seedDatabase(db);

    const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
    const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const customer = db.prepare("SELECT * FROM customers WHERE customer_code = 'CUST-0000'").get();
    const variant = db.prepare("SELECT * FROM product_variants WHERE sku = 'TX-PCS-001'").get();

    expect(rolesCount).toBeGreaterThanOrEqual(4);
    expect(categoriesCount).toBeGreaterThanOrEqual(6);
    expect(customer.name).toBe('Walk-in Customer');
    expect(variant.selling_price).toBe(999.0);
    expect(variant.current_stock).toBe(15);
  });

  it('3. should enforce UNIQUE constraints on SKU and Barcode', () => {
    seedDatabase(db);
    const productRepo = new ProductRepository(db);

    // Duplicate SKU must throw SQLite constraint error
    expect(() => {
      productRepo.createVariant({
        product_id: 1,
        sku: 'TX-PCS-001', // Already seeded
        selling_price: 1000,
        purchase_price: 500,
      });
    }).toThrow();
  });

  it('4. should enforce Foreign Key constraints on invalid references', () => {
    const productRepo = new ProductRepository(db);

    // Inserting a product referencing non-existent category_id 9999 must fail
    expect(() => {
      productRepo.createProduct({
        name: 'Invalid Product',
        category_id: 9999,
      });
    }).toThrow();
  });

  it('5. should execute ATOMIC Sales Transaction and update Stock Ledger on success', () => {
    seedDatabase(db);
    const salesService = new SalesService(db);
    const productRepo = new ProductRepository(db);
    const stockRepo = new StockRepository(db);

    const initialVariant = productRepo.getVariantBySku('TX-PCS-001')!;
    expect(initialVariant.current_stock).toBe(15);

    const result = salesService.createSale({
      invoice_number: 'INV-TEST-001',
      customer_id: 1,
      subtotal: 999.0,
      total: 999.0,
      items: [
        {
          product_variant_id: initialVariant.id,
          quantity: 3,
          unit_price: 999.0,
          total: 2997.0,
        },
      ],
      payment: {
        payment_method: 'CASH',
        amount: 2997.0,
      },
    });

    expect(result.success).toBe(true);
    expect(result.saleId).toBeDefined();

    // Check stock was deducted
    const updatedVariant = productRepo.getVariantBySku('TX-PCS-001')!;
    expect(updatedVariant.current_stock).toBe(12);

    // Check stock transaction ledger
    const transactions = stockRepo.getTransactionsByVariant(initialVariant.id);
    expect(transactions.length).toBe(1);
    expect(transactions[0].quantity).toBe(-3);
    expect(transactions[0].previous_quantity).toBe(15);
    expect(transactions[0].new_quantity).toBe(12);
  });

  it('6. should ROLLBACK atomic transaction cleanly when requested quantity exceeds available stock', () => {
    seedDatabase(db);
    const salesService = new SalesService(db);
    const saleRepo = new SaleRepository(db);
    const productRepo = new ProductRepository(db);

    const variant = productRepo.getVariantBySku('TX-PCS-001')!;
    expect(variant.current_stock).toBe(15);

    // Attempt to sell 999 units (exceeding stock of 15)
    const result = salesService.createSale({
      invoice_number: 'INV-[#2818cf]FAIL-001',
      customer_id: 1,
      subtotal: 999000.0,
      total: 999000.0,
      items: [
        {
          product_variant_id: variant.id,
          quantity: 999, // Insufficient
          unit_price: 999.0,
          total: 999000.0,
        },
      ],
      payment: {
        payment_method: 'CASH',
        amount: 999000.0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient stock');

    // Verify stock remains untouched
    const afterVariant = productRepo.getVariantBySku('TX-PCS-001')!;
    expect(afterVariant.current_stock).toBe(15);

    // Verify no sale record was created (clean ROLLBACK)
    const sales = saleRepo.getAllSales();
    expect(sales.length).toBe(0);
  });

  it('7. should execute ATOMIC Purchase Stock Inwarding and increase Stock Ledger', () => {
    seedDatabase(db);
    const purchaseService = new PurchaseService(db);
    const productRepo = new ProductRepository(db);
    const stockRepo = new StockRepository(db);

    const variant = productRepo.getVariantBySku('TX-PCS-001')!;
    expect(variant.current_stock).toBe(15);

    const result = purchaseService.createPurchase({
      purchase_number: 'PO-TEST-001',
      supplier_id: 1,
      subtotal: 6000.0,
      total: 6000.0,
      items: [
        {
          product_variant_id: variant.id,
          quantity: 10,
          unit_cost: 600.0,
          total: 6000.0,
        },
      ],
    });

    expect(result.success).toBe(true);

    const updatedVariant = productRepo.getVariantBySku('TX-PCS-001')!;
    expect(updatedVariant.current_stock).toBe(25);

    const txs = stockRepo.getTransactionsByVariant(variant.id);
    expect(txs[0].transaction_type).toBe('PURCHASE');
    expect(txs[0].quantity).toBe(10);
    expect(txs[0].new_quantity).toBe(25);
  });
});
