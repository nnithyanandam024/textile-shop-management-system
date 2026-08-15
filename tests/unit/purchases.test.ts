import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initDatabase } from '../../electron/main/database';
import { seedDatabase } from '../../electron/main/database/seed';
import { CustomerService } from '../../electron/main/services/customerService';
import { SupplierService } from '../../electron/main/services/supplierService';
import { PurchaseService } from '../../electron/main/services/purchaseService';
import { SalesService } from '../../electron/main/services/salesService';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import { StockRepository } from '../../electron/main/repositories/stockRepository';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../../test_phase6.db');

describe('Phase 6 Customers, Suppliers & Purchase Management Test Suite', () => {
  let db: Database.Database;
  let customerService: CustomerService;
  let supplierService: SupplierService;
  let purchaseService: PurchaseService;
  let salesService: SalesService;
  let productRepo: ProductRepository;
  let stockRepo: StockRepository;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    db = initDatabase(TEST_DB_PATH);
    seedDatabase(db);
    customerService = new CustomerService(db);
    supplierService = new SupplierService(db);
    purchaseService = new PurchaseService(db);
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

  it('1. should register customer with unique code CUS-XXXXXX and manage credit limit', () => {
    const res = customerService.createCustomer({
      name: 'Ramesh Textiles',
      phone: '9876543210',
      email: 'ramesh@example.com',
      credit_limit: 15000,
    });

    expect(res.success).toBe(true);
    expect(res.code).toContain('CUS-');

    const profile = customerService.getCustomerProfile(res.id!);
    expect(profile.success).toBe(true);
    expect(profile.customer.name).toBe('Ramesh Textiles');
    expect(profile.customer.credit_limit).toBe(15000);
  });

  it('2. should register supplier with unique code SUP-XXXXXX', () => {
    const res = supplierService.createSupplier({
      company_name: 'Texora Mills Ltd',
      contact_person: 'Suresh Kumar',
      phone: '9988776655',
      gst_number: '33AAAAA0000A1Z5',
    });

    expect(res.success).toBe(true);
    expect(res.code).toContain('SUP-');

    const profile = supplierService.getSupplierProfile(res.id!);
    expect(profile.success).toBe(true);
    expect(profile.supplier.company_name).toBe('Texora Mills Ltd');
  });

  it('3. should process atomic purchase order inward, increase inventory stock, and write stock ledger entries', () => {
    // 1. Create Supplier & Product
    const supRes = supplierService.createSupplier({ company_name: 'Super Fabrics' });
    const prodId = productRepo.createProduct({
      name: 'Cotton Fabric Roll',
      category_id: 1,
      brand_id: 1,
    });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'COT-ROLL-100',
      purchase_price: 400,
      selling_price: 800,
      current_stock: 10,
    });

    // 2. Execute Purchase Inward (Buy 50 units)
    const purchaseRes = purchaseService.createPurchase({
      supplier_id: supRes.id!,
      supplier_invoice_number: 'SUP-INV-101',
      items: [
        { product_variant_id: varId, quantity: 50, unit_cost: 400 },
      ],
      subtotal: 20000,
      total: 20000,
      paid_amount: 15000,
    });

    expect(purchaseRes.success).toBe(true);
    expect(purchaseRes.purchaseNumber).toContain('PUR-');

    // 3. Verify Stock Increased from 10 to 60
    const updatedVar = productRepo.getVariantById(varId);
    expect(updatedVar!.current_stock).toBe(60);

    // 4. Verify Stock Ledger Entry
    const transactions = stockRepo.getTransactionsByVariant(varId);
    expect(transactions.some((t) => t.transaction_type === 'PURCHASE' && t.quantity === 50)).toBe(true);
  });

  it('4. should process customer payment receiving', () => {
    const custRes = customerService.createCustomer({ name: 'Anand Kumar', credit_limit: 10000 });
    const payRes = customerService.receiveCustomerPayment(custRes.id!, 2500, 'UPI');
    expect(payRes.success).toBe(true);
  });

  it('5. should process supplier payment payout', () => {
    const supRes = supplierService.createSupplier({ company_name: 'Vardhman Yarns' });
    const payRes = supplierService.makeSupplierPayment(supRes.id!, 5000, 'BANK_TRANSFER');
    expect(payRes.success).toBe(true);
  });

  it('6. should test complete supply chain integration (Purchase Stock In -> POS Sale Stock Out -> Customer Credit -> Payment)', () => {
    // 1. Create Supplier & Customer
    const sup = supplierService.createSupplier({ company_name: 'Global Silks' });
    const cust = customerService.createCustomer({ name: 'Priya Fabrics', credit_limit: 50000 });

    // 2. Create Product with initial stock 0
    const prodId = productRepo.createProduct({ name: 'Silk Saree', category_id: 1, brand_id: 1 });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'SLK-SAR-RED',
      purchase_price: 2000,
      selling_price: 4000,
      current_stock: 0,
    });

    // 3. Purchase 100 Sarees (Stock Inward)
    const purRes = purchaseService.createPurchase({
      supplier_id: sup.id!,
      items: [{ product_variant_id: varId, quantity: 100, unit_cost: 2000 }],
      subtotal: 200000,
      total: 200000,
      paid_amount: 150000,
    });
    expect(purRes.success).toBe(true);
    expect(productRepo.getVariantById(varId)!.current_stock).toBe(100);

    // 4. POS Sale 5 Sarees to Priya Fabrics (Stock Outward)
    const saleRes = salesService.createSale({
      customer_id: cust.id!,
      items: [{ product_variant_id: varId, quantity: 5, unit_price: 4000, discount: 0 }],
      payments: [{ payment_method: 'CASH', amount: 20000 }],
      subtotal: 20000,
      total: 20000,
    });
    expect(saleRes.success).toBe(true);
    expect(productRepo.getVariantById(varId)!.current_stock).toBe(95);

    // 5. Verify Ledger
    const transactions = stockRepo.getTransactionsByVariant(varId);
    expect(transactions.length).toBe(2); // 1 PURCHASE (+100), 1 SALE (-5)
  });
});
