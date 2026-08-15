import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initDatabase } from '../../electron/main/database';
import { ProductService } from '../../electron/main/services/productService';
import { InventoryService } from '../../electron/main/services/inventoryService';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import { SessionService } from '../../electron/main/services/auth/sessionService';

import { seedDatabase } from '../../electron/main/database/seed';

describe('Phase 4 Product & Inventory Management Test Suite', () => {
  let tempDbPath: string;
  let db: any;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-test-'));
    tempDbPath = path.join(tempDir, 'test-inv.db');
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
      // Ignore Windows async handle release delays
    }
    SessionService.clearSession();
  });

  it('1. should create Master Product with Matrix Variants and auto-generate SKUs', () => {
    const productService = new ProductService(db);
    const productRepo = new ProductRepository(db);

    const res = productService.createProductWithVariants({
      name: "Men's Silk Linen Shirt",
      category_id: 1,
      brand_id: 1,
      material: 'Linen',
      variants: [
        { color: 'Blue', size: 'M', purchase_price: 500, selling_price: 999, minimum_stock: 5, initial_stock: 20 },
        { color: 'Blue', size: 'L', purchase_price: 500, selling_price: 999, minimum_stock: 5, initial_stock: 15 },
        { color: 'White', size: 'M', purchase_price: 500, selling_price: 999, minimum_stock: 5, initial_stock: 10 },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.productId).toBeDefined();

    const variants = productRepo.getAllVariants();
    expect(variants.length).toBeGreaterThanOrEqual(3);

    const blueM = variants.find((v) => v.color === 'Blue' && v.size === 'M')!;
    expect(blueM.sku).toContain('MEN-BLU-M');
    expect(blueM.current_stock).toBe(20);
  });

  it('2. should reject duplicate SKU or negative pricing', () => {
    const productService = new ProductService(db);

    const res = productService.createProductWithVariants({
      name: 'Dup Test Shirt',
      category_id: 1,
      variants: [
        { sku: 'DUP-SKU-001', purchase_price: -100, selling_price: 999 }, // Negative purchase price
      ],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('greater than or equal to 0');
  });

  it('3. should process Stock Adjustments and write Stock Ledger history', () => {
    const productService = new ProductService(db);
    const inventoryService = new InventoryService(db);
    const productRepo = new ProductRepository(db);

    const createRes = productService.createProductWithVariants({
      name: 'Cotton Saree Traditional',
      category_id: 2,
      variants: [
        { sku: 'TX-[#2818cf]SAR-001', color: 'Gold', size: 'Free Size', purchase_price: 1500, selling_price: 2999, initial_stock: 10 },
      ],
    });

    const variant = productRepo.getVariantBySku('TX-[#2818cf]SAR-001')!;
    expect(variant.current_stock).toBe(10);

    // Increase Stock by +5
    const adjResult = inventoryService.adjustStock({
      product_variant_id: variant.id,
      quantity_change: 5,
      transaction_type: 'ADJUSTMENT',
      notes: 'Received extra shipment',
    });

    expect(adjResult.success).toBe(true);
    expect(adjResult.newStock).toBe(15);

    const history = inventoryService.getStockHistory(variant.id);
    expect(history.length).toBe(2); // Initial Stock + Adjustment
    expect(history[0].quantity).toBe(5);
    expect(history[0].new_quantity).toBe(15);
  });

  it('4. should ENFORCE Negative Stock Prevention Rule (block excess deduction)', () => {
    const productService = new ProductService(db);
    const inventoryService = new InventoryService(db);
    const productRepo = new ProductRepository(db);

    productService.createProductWithVariants({
      name: 'Low Stock Pants',
      category_id: 1,
      variants: [
        { sku: 'TX-PNT-001', purchase_price: 400, selling_price: 799, initial_stock: 3 },
      ],
    });

    const variant = productRepo.getVariantBySku('TX-PNT-001')!;
    expect(variant.current_stock).toBe(3);

    // Attempt to deduct 5 units (when current stock is 3)
    const result = inventoryService.adjustStock({
      product_variant_id: variant.id,
      quantity_change: -5,
      transaction_type: 'DAMAGE',
      notes: 'Water damaged',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient stock');

    // Verify stock remains untouched at 3
    const unchangedVariant = productRepo.getVariantBySku('TX-PNT-001')!;
    expect(unchangedVariant.current_stock).toBe(3);
  });

  it('5. should accurately detect Low-Stock and Out-of-Stock variants and calculate metrics', () => {
    const productService = new ProductService(db);
    const inventoryService = new InventoryService(db);

    productService.createProductWithVariants({
      name: 'Metrics Test Product',
      category_id: 1,
      variants: [
        { sku: 'TX-MET-NORMAL', minimum_stock: 5, initial_stock: 15, purchase_price: 100, selling_price: 200 },
        { sku: 'TX-MET-LOW', minimum_stock: 5, initial_stock: 2, purchase_price: 100, selling_price: 200 },
        { sku: 'TX-MET-OUT', minimum_stock: 5, initial_stock: 0, purchase_price: 100, selling_price: 200 },
      ],
    });

    const metrics = inventoryService.getMetrics();
    expect(metrics.lowStockCount).toBeGreaterThanOrEqual(1);
    expect(metrics.outOfStockCount).toBeGreaterThanOrEqual(1);

    const lowStockList = inventoryService.getLowStockVariants();
    expect(lowStockList.some((v) => v.sku === 'TX-MET-LOW')).toBe(true);

    const outStockList = inventoryService.getOutOfStockVariants();
    expect(outStockList.some((v) => v.sku === 'TX-MET-OUT')).toBe(true);
  });

  it('6. should deactivate product and associated variants safely', () => {
    const productService = new ProductService(db);
    const productRepo = new ProductRepository(db);

    const createRes = productService.createProductWithVariants({
      name: 'Deactivate Shirt',
      category_id: 1,
      variants: [
        { sku: 'TX-DEC-001', purchase_price: 100, selling_price: 200, initial_stock: 10 },
      ],
    });

    const deactRes = productService.deactivateProduct(createRes.productId!);
    expect(deactRes.success).toBe(true);

    const products = productRepo.getAllProducts();
    expect(products.some((p) => p.id === createRes.productId)).toBe(false);
  });
});
