import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../../electron/main/database';
import { AuthService } from '../../electron/main/services/auth/authService';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import { CategoryRepository } from '../../electron/main/repositories/categoryRepository';
import { BrandRepository } from '../../electron/main/repositories/brandRepository';
import { SupplierRepository } from '../../electron/main/repositories/supplierRepository';
import { CustomerRepository } from '../../electron/main/repositories/customerRepository';
import { PurchaseService } from '../../electron/main/services/purchaseService';
import { SalesService } from '../../electron/main/services/salesService';
import { ReturnService } from '../../electron/main/services/returnService';
import { ExpenseService } from '../../electron/main/services/expenseService';
import { DashboardService } from '../../electron/main/services/dashboardService';
import { ReportService } from '../../electron/main/services/reportService';
import { BackupService } from '../../electron/main/services/backupService';
import { RestoreService } from '../../electron/main/services/restoreService';

const E2E_DB_PATH = path.join(__dirname, '../../test_production_e2e.db');

describe('Phase 10 — 25-Step End-to-End Real-Shop Business Simulation Suite', () => {
  let db: Database.Database;

  beforeEach(() => {
    closeDatabase();
    try {
      if (fs.existsSync(E2E_DB_PATH)) fs.unlinkSync(E2E_DB_PATH);
    } catch {
      // Ignore file locks during setup
    }

    db = initDatabase(E2E_DB_PATH);
  });

  afterEach(() => {
    closeDatabase();
    try {
      if (fs.existsSync(E2E_DB_PATH)) fs.unlinkSync(E2E_DB_PATH);
    } catch {
      // Ignore file locks during teardown
    }
  });

  it('Executes complete 25-Step Real-World Business Simulation cleanly from Setup to Restore', async () => {
    // 1. Initial Setup Check
    const authService = new AuthService(db);
    expect(authService.checkInitialSetup().setupRequired).toBe(true);

    // 2. Perform First-Time Store & Owner Setup
    const setupRes = await authService.firstTimeSetup({
      shopName: 'Texora Retail Hub',
      shopPhone: '9876543210',
      shopAddress: '123 Textile Street',
      gstNumber: '33AAAAA0000A1Z5',
      ownerName: 'Store Owner',
      adminUsername: 'owner1',
      adminPassword: 'password123',
    });
    expect(setupRes.success).toBe(true);

    // 3. Login Owner & Verify Authentication
    const loginRes = await authService.login('owner1', 'password123');
    expect(loginRes.success).toBe(true);
    const ownerUserId = loginRes.user?.id;

    // 4. Create Category
    const catRepo = new CategoryRepository(db);
    const catId = catRepo.create({ name: 'Silk Sarees', description: 'Pure Silk Sarees' });
    expect(catId).toBeGreaterThan(0);

    // 5. Create Brand
    const brandRepo = new BrandRepository(db);
    const brandId = brandRepo.create({ name: 'Kanchipuram Silks' });
    expect(brandId).toBeGreaterThan(0);

    // 6. Create Master Product
    const prodRepo = new ProductRepository(db);
    const productId = prodRepo.createProduct({
      name: 'Kanchipuram Zari Brocade Silk Saree',
      category_id: catId,
      brand_id: brandId,
      material: 'Pure Mulberry Silk',
    });
    expect(productId).toBeGreaterThan(0);

    // 7. Create Product Variant 1 & Variant 2
    const variantId = prodRepo.createVariant({
      product_id: productId,
      sku: 'SKU-KAN-MAROON',
      barcode: '8901234567890',
      size: 'Free Size',
      color: 'Royal Maroon',
      purchase_price: 4000,
      selling_price: 8500,
      tax_rate: 5,
      minimum_stock: 5,
      current_stock: 0,
    });
    expect(variantId).toBeGreaterThan(0);

    const variant2Id = prodRepo.createVariant({
      product_id: productId,
      sku: 'SKU-KAN-[#2818cf]',
      barcode: '8901234567891',
      size: 'Free Size',
      color: 'Navy Blue',
      purchase_price: 4500,
      selling_price: 9500,
      tax_rate: 5,
      minimum_stock: 5,
      current_stock: 10,
    });
    expect(variant2Id).toBeGreaterThan(0);

    // 8. Register Supplier
    const supplierRepo = new SupplierRepository(db);
    const supplierId = supplierRepo.create({
      supplier_code: 'SUP-001',
      company_name: 'Texora Weavers Pvt Ltd',
      phone: '9443322110',
      city: 'Kanchipuram',
    });
    expect(supplierId).toBeGreaterThan(0);

    // 9. Create Purchase Order (20 units @ ₹4000 = ₹80,000; Paid ₹50,000, Outstanding ₹30,000)
    const purchaseService = new PurchaseService(db);
    const purchaseRes = purchaseService.createPurchase({
      supplier_id: supplierId,
      subtotal: 80000,
      discount: 0,
      tax: 0,
      total: 80000,
      payment_method: 'BANK_TRANSFER',
      paid_amount: 50000,
      notes: 'Initial Bulk Purchase',
      items: [
        {
          product_variant_id: variantId,
          quantity: 20,
          unit_cost: 4000,
          tax_rate: 0,
        },
      ],
    }, ownerUserId);
    expect(purchaseRes.success).toBe(true);
    const purchaseId = purchaseRes.purchaseId!;

    // 10. Verify Stock automatically increased to 20 units
    let variant = prodRepo.getVariantById(variantId);
    expect(variant?.current_stock).toBe(20);

    // 11. Register Customer
    const custRepo = new CustomerRepository(db);
    const customerId = custRepo.create({
      customer_code: 'CUST-001',
      name: 'Ananya Sharma',
      phone: '9876501234',
      city: 'Coimbatore',
    });
    expect(customerId).toBeGreaterThan(0);

    // 12. POS Sale (2 units @ ₹8500 = ₹17,000 + ₹850 Tax = ₹17,850; Paid Cash ₹10,000 + UPI ₹7,850)
    const salesService = new SalesService(db);
    const saleRes = salesService.createSale({
      customer_id: customerId,
      items: [
        {
          product_variant_id: variantId,
          quantity: 2,
          unit_price: 8500,
          discount: 0,
          tax: 850,
        },
      ],
      payments: [
        { payment_method: 'CASH', amount: 10000 },
        { payment_method: 'UPI', amount: 7850 },
      ],
      subtotal: 17000,
      discount: 0,
      tax: 850,
      total: 17850,
      created_by: ownerUserId,
    });
    expect(saleRes.success).toBe(true);
    const saleId = saleRes.saleId!;

    // 13. Verify Stock automatically deducted to 18 units
    variant = prodRepo.getVariantById(variantId);
    expect(variant?.current_stock).toBe(18);

    // 14. Verify Invoice Details
    const saleDetails = salesService.getSaleDetails(saleId);
    expect(saleDetails.sale.total).toBe(17850);
    expect(saleDetails.sale.balance_amount).toBe(0);

    // 15. Perform Sales Return (1 unit resalable, refund ₹8,925 CASH)
    const returnService = new ReturnService(db);
    const returnRes = returnService.processReturn({
      sale_id: saleId,
      customer_id: customerId,
      refund_method: 'CASH',
      reason: 'Wrong Color Choice',
      items: [
        {
          sale_item_id: saleDetails.items[0].id,
          product_variant_id: variantId,
          quantity: 1,
          refund_amount: 8925,
          condition: 'RESALABLE',
        },
      ],
    }, ownerUserId);
    expect(returnRes.success).toBe(true);

    // 16. Verify Stock restored to 19 units
    variant = prodRepo.getVariantById(variantId);
    expect(variant?.current_stock).toBe(19);

    // 17. Perform Product Exchange (Return Maroon Saree, replacement Navy Blue Saree)
    const exchangeRes = returnService.processExchange({
      original_sale_id: saleId,
      returned_variant_id: variantId,
      returned_quantity: 1,
      replacement_variant_id: variant2Id,
      replacement_quantity: 1,
    });
    expect(exchangeRes.success).toBe(true);
    expect(exchangeRes.differenceAmount).toBe(1000); // 9500 - 8500 = 1000

    // 18. Register Credit Sale (3 units = ₹26,775; Paid ₹10,000; Outstanding = ₹16,775)
    const creditSaleRes = salesService.createSale({
      customer_id: customerId,
      items: [
        {
          product_variant_id: variantId,
          quantity: 3,
          unit_price: 8500,
          discount: 0,
          tax: 1275,
        },
      ],
      payments: [
        { payment_method: 'CREDIT', amount: 10000 },
      ],
      subtotal: 25500,
      discount: 0,
      tax: 1275,
      total: 26775,
      created_by: ownerUserId,
    });
    expect(creditSaleRes.success).toBe(true);
    const creditSaleId = creditSaleRes.saleId!;

    // 19. Record Customer Outstanding Payment of ₹6,775 against credit sale
    db.prepare(`
      INSERT INTO payments (sale_id, payment_method, amount, reference_number, notes)
      VALUES (?, 'UPI', ?, 'UPI123456789', 'Partial Customer Settlement')
    `).run(creditSaleId, 6775);
    db.prepare(`
      UPDATE sales 
      SET paid_amount = paid_amount + 6775, balance_amount = total - (paid_amount + 6775)
      WHERE id = ?
    `).run(creditSaleId);

    const updatedSale: any = db.prepare('SELECT * FROM sales WHERE id = ?').get(creditSaleId);
    expect(updatedSale.balance_amount).toBe(10000);

    // 20. Record Supplier Outstanding Payment of ₹20,000 against purchase
    db.prepare(`
      UPDATE purchases
      SET paid_amount = paid_amount + 20000, balance_amount = total - (paid_amount + 20000)
      WHERE id = ?
    `).run(purchaseId);

    const updatedPurchase: any = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    expect(updatedPurchase.balance_amount).toBe(10000);

    // 21. Log Shop Expense
    const expenseService = new ExpenseService(db);
    const expenseRes = expenseService.createExpense({
      category_name: 'UTILITIES',
      description: 'Monthly Store Electricity Bill',
      amount: 3500,
      payment_method: 'UPI',
    });
    expect(expenseRes.success).toBe(true);

    // 22. Check Executive Dashboard KPIs
    const dashboardService = new DashboardService(db);
    const kpis = dashboardService.getKPIs();
    expect(kpis.today_bills).toBeGreaterThan(0);
    expect(kpis.total_expenses).toBe(3500);

    // 23. Check Financial P&L Report
    const reportService = new ReportService(db);
    const finReport = reportService.getFinancialReport({});
    expect(finReport.grossSales).toBeGreaterThan(0);
    expect(finReport.netOperatingResult).toBeDefined();

    // 24. Create SHA-256 Checksummed Database Backup
    const backupRes = await BackupService.createBackup('e2e_production_test_backup.db');
    expect(backupRes.success).toBe(true);
    expect(backupRes.sha256).toBeDefined();

    // 25. Execute Fail-Safe Restore with Emergency Snapshot
    const restoreRes = await RestoreService.restoreBackup('e2e_production_test_backup.db', ownerUserId);
    expect(restoreRes.success).toBe(true);

    // Final Post-Restore Health Verification
    const postCheck = BackupService.checkIntegrity(getDatabase());
    expect(postCheck.healthy).toBe(true);
  });
});
