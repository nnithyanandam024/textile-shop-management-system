import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffInventoryService } from '../../electron/main/services/staffInventoryService';
import { SessionService, AuthUserSession } from '../../electron/main/services/auth/sessionService';
import { PasswordService } from '../../electron/main/services/auth/passwordService';

describe('Staff Portal — Phase 8 Test Suite (Staff Inventory & Product Operations)', () => {
  let db: Database.Database;
  let dbPath: string;
  let inventoryService: StaffInventoryService;
  let staff1Id: number;
  let staff2Id: number;
  let varCottonSareeId: number;
  let varSilkSareeId: number;
  let varFormalShirtId: number;
  let po1Id: number;

  beforeEach(() => {
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase8_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
    db = initDatabase(dbPath);
    inventoryService = new StaffInventoryService(db);

    // Setup Roles
    db.prepare(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'STAFF', 'Floor Staff & Cashier');
    `).run();

    // Setup Department & Designation
    let depRow = db.prepare(`SELECT id FROM departments WHERE department_code = 'DEP-001'`).get() as any;
    let depId = depRow?.id;
    if (!depId) {
      const depRes = db.prepare(`
        INSERT INTO departments (department_code, name, status) VALUES ('DEP-001', 'Storefront Sales', 'ACTIVE')
      `).run();
      depId = Number(depRes.lastInsertRowid);
    }

    let desRow = db.prepare(`SELECT id FROM designations WHERE designation_code = 'DES-001'`).get() as any;
    let desId = desRow?.id;
    if (!desId) {
      const desRes = db.prepare(`
        INSERT INTO designations (designation_code, name, department_id, status) VALUES ('DES-001', 'Sales & Inventory Associate', ?, 'ACTIVE')
      `).run(depId);
      desId = Number(desRes.lastInsertRowid);
    }

    // Setup Staff 1 (Arun Kumar)
    const pwHash = PasswordService.hashPasswordSync('password123');
    const u1Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun.kumar', ?, 'Arun Kumar', 3)
    `).run(pwHash);
    const u1Id = Number(u1Res.lastInsertRowid);

    const s1Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0001', 'Arun', 'Kumar', '9876543210', 'arun@texora.shop',
        ?, ?, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(depId, desId, u1Id);
    staff1Id = Number(s1Res.lastInsertRowid);

    // Setup Staff 2 (Priya Sharma)
    const u2Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('priya.sharma', ?, 'Priya Sharma', 3)
    `).run(pwHash);
    const u2Id = Number(u2Res.lastInsertRowid);

    const s2Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0002', 'Priya', 'Sharma', '9876500002', 'priya@texora.shop',
        ?, ?, 'Branch 02', '2026-02-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(depId, desId, u2Id);
    staff2Id = Number(s2Res.lastInsertRowid);

    // Setup Categories & Brands
    const catRes = db.prepare(`
      INSERT INTO categories (name, description) VALUES ('Sarees', 'Traditional & Designer Sarees')
    `).run();
    const catId = Number(catRes.lastInsertRowid);

    const catShirtsRes = db.prepare(`
      INSERT INTO categories (name, description) VALUES ('Shirts', 'Men Executive Wear')
    `).run();
    const catShirtsId = Number(catShirtsRes.lastInsertRowid);

    const brandRes = db.prepare(`
      INSERT INTO brands (name, description) VALUES ('Texora Heritage', 'Premium In-House Line')
    `).run();
    const brandId = Number(brandRes.lastInsertRowid);

    // Setup Products
    const p1Res = db.prepare(`
      INSERT INTO products (name, category_id, brand_id, material, description, is_active)
      VALUES ('Royal Cotton Saree', ?, ?, 'Pure Cotton', 'Handwoven traditional cotton saree', 1)
    `).run(catId, brandId);
    const p1Id = Number(p1Res.lastInsertRowid);

    const p2Res = db.prepare(`
      INSERT INTO products (name, category_id, brand_id, material, description, is_active)
      VALUES ('Kanchipuram Silk Saree', ?, ?, 'Pure Silk', 'Zari border silk saree', 1)
    `).run(catId, brandId);
    const p2Id = Number(p2Res.lastInsertRowid);

    const p3Res = db.prepare(`
      INSERT INTO products (name, category_id, brand_id, material, description, is_active)
      VALUES ('Classic Formal Shirt', ?, ?, 'Linen Cotton', 'Slim-fit executive wear', 1)
    `).run(catShirtsId, brandId);
    const p3Id = Number(p3Res.lastInsertRowid);

    // Setup Product Variants
    // 1. Royal Cotton Saree (Stock = 18, Min = 5 -> IN_STOCK)
    const v1Res = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SAR-1023', '8901234567890', 'Free Size', 'Royal Blue', 'Traditional Paisley', 800, 1499,
        5, 18, 1
      )
    `).run(p1Id);
    varCottonSareeId = Number(v1Res.lastInsertRowid);

    // 2. Silk Saree (Stock = 3, Min = 5 -> LOW_STOCK)
    const v2Res = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SAR-1002', '8901234567891', 'Free Size', 'Crimson Red', 'Zari Brocade', 3500, 5999,
        5, 3, 1
      )
    `).run(p2Id);
    varSilkSareeId = Number(v2Res.lastInsertRowid);

    // 3. Formal Shirt (Stock = 0, Min = 10 -> OUT_OF_STOCK)
    const v3Res = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SH-2010', '8901234567892', 'L (40)', 'Pure White', 'Solid', 450, 999,
        10, 0, 1
      )
    `).run(p3Id);
    varFormalShirtId = Number(v3Res.lastInsertRowid);

    // Setup Supplier & Purchase Order for Receiving
    const supRes = db.prepare(`
      INSERT INTO suppliers (supplier_code, company_name, contact_person, phone, email, is_active)
      VALUES ('SUP-001', 'ABC Textiles Mill', 'Ramesh Patel', '9898989898', 'abc@textiles.com', 1)
    `).run();
    const supId = Number(supRes.lastInsertRowid);

    const poRes = db.prepare(`
      INSERT INTO purchases (
        purchase_number, supplier_id, purchase_date, subtotal, discount, tax, total, paid_amount, balance_amount, status
      ) VALUES (
        'PO-1024', ?, '2026-08-20', 50000, 0, 2500, 52500, 0, 52500, 'PENDING'
      )
    `).run(supId);
    po1Id = Number(poRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO purchase_items (purchase_id, product_variant_id, quantity, unit_cost, discount, tax, total)
      VALUES
        (?, ?, 50, 800, 0, 0, 40000),
        (?, ?, 30, 3500, 0, 0, 105000)
    `).run(po1Id, varCottonSareeId, po1Id, varSilkSareeId);
  });

  afterEach(() => {
    closeDatabase();
    SessionService.clearSession();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore
      }
    }
  });

  it('Test 1: Multi-Criteria Product Search (Name, SKU, Color, Size)', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    // Search by color "Royal Blue"
    const resBlue = inventoryService.searchProducts('Royal Blue');
    expect(resBlue.items.length).toBe(1);
    expect(resBlue.items[0].sku).toBe('SAR-1023');

    // Search by SKU "SAR-1002"
    const resSku = inventoryService.searchProducts('SAR-1002');
    expect(resSku.items.length).toBe(1);
    expect(resSku.items[0].productName).toBe('Kanchipuram Silk Saree');

    // Search by partial text "Saree"
    const resSaree = inventoryService.searchProducts('Saree');
    expect(resSaree.items.length).toBe(2);
  });

  it('Test 2: Barcode Lookup & Product Details Resolution', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    // Barcode scan "8901234567890"
    const res = inventoryService.searchProducts('8901234567890');
    expect(res.items.length).toBe(1);
    expect(res.items[0].barcode).toBe('8901234567890');

    // Retrieve full product details
    const details = inventoryService.getProductDetails(varCottonSareeId);
    expect(details.material).toBe('Pure Cotton');
    expect(details.sellingPrice).toBe(1499);
    expect(details.currentStock).toBe(18);
    expect(details.status).toBe('IN_STOCK');
  });

  it('Test 3: Stock Status Determination (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    const cotton = inventoryService.getProductDetails(varCottonSareeId);
    const silk = inventoryService.getProductDetails(varSilkSareeId);
    const shirt = inventoryService.getProductDetails(varFormalShirtId);

    expect(cotton.status).toBe('IN_STOCK'); // 18 > 5
    expect(silk.status).toBe('LOW_STOCK'); // 3 <= 5
    expect(shirt.status).toBe('OUT_OF_STOCK'); // 0 <= 0
  });

  it('Test 4: Low Stock Alert Filtering', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    const lowStockList = inventoryService.getLowStockItems();
    expect(lowStockList.length).toBeGreaterThanOrEqual(1);
    expect(lowStockList.some((p) => p.sku === 'SAR-1002')).toBe(true);
  });

  it('Test 5: Stock Count Discrepancy Submission (System 18, Physical 17 -> Diff -1, Stock remains 18)', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    // Staff performs count on Royal Cotton Saree: Physical = 17 (System = 18)
    const countRes = inventoryService.submitStockCount({
      product_variant_id: varCottonSareeId,
      physical_quantity: 17,
      reason: 'Damaged garment found on rack B',
      location_name: 'Main Shop',
    });

    expect(countRes.success).toBe(true);
    expect(countRes.difference).toBe(-1);

    // CRITICAL: Verify stock remains 18 (not modified directly)
    const productAfter = inventoryService.getProductDetails(varCottonSareeId);
    expect(productAfter.currentStock).toBe(18);

    // Verify pending record in database
    const countRow = db.prepare(`SELECT * FROM stock_counts WHERE id = ?`).get(countRes.id) as any;
    expect(countRow.status).toBe('PENDING');
    expect(countRow.difference).toBe(-1);
  });

  it('Test 6: Stock Transfer Request Workflow (Validate quantity and submit PENDING request)', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    // Request transfer of 5 pcs from Main Shop to Branch 02
    const transferRes = inventoryService.createTransferRequest({
      product_variant_id: varCottonSareeId,
      from_location: 'Main Shop',
      to_location: 'Branch 02',
      quantity: 5,
      reason: 'Branch replenishment for weekend sale',
    });

    expect(transferRes.success).toBe(true);

    const transfers = inventoryService.getTransferRequests();
    expect(transfers.length).toBe(1);
    expect(transfers[0].quantity).toBe(5);
    expect(transfers[0].status).toBe('PENDING');

    // Attempting to transfer more than available stock throws error
    expect(() => {
      inventoryService.createTransferRequest({
        product_variant_id: varCottonSareeId,
        from_location: 'Main Shop',
        to_location: 'Branch 02',
        quantity: 999,
        reason: 'Excess request',
      });
    }).toThrow(/Insufficient stock/);
  });

  it('Test 7: Purchase Order Receiving Verification with Discrepancy Reporting', () => {
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    const poList = inventoryService.getPurchaseOrdersForReceiving();
    expect(poList.length).toBe(1);
    expect(poList[0].purchaseNumber).toBe('PO-1024');

    // Submit receiving report: 50 Cotton Sarees received (exact), 28 Silk Sarees received (2 missing)
    const recRes = inventoryService.submitReceivingReport({
      purchase_id: po1Id,
      notes: 'Consignment box #2 received with 2 missing silk sarees',
      items: [
        { product_variant_id: varCottonSareeId, received_quantity: 50 },
        { product_variant_id: varSilkSareeId, received_quantity: 28, notes: '2 pcs missing in sealed carton' },
      ],
    });

    expect(recRes.success).toBe(true);

    const recRow = db.prepare(`SELECT * FROM stock_receiving_records WHERE id = ?`).get(recRes.id) as any;
    expect(recRow.status).toBe('PENDING_VERIFICATION');

    const recItems = db.prepare(`SELECT * FROM stock_receiving_items WHERE receiving_record_id = ?`).all(recRes.id) as any[];
    expect(recItems.length).toBe(2);
    const silkItem = recItems.find((i) => i.product_variant_id === varSilkSareeId);
    expect(silkItem.difference).toBe(-2);
  });

  it('Test 8: Strict Session Isolation & Inventory Activity History', () => {
    // Staff 1 performs stock count
    SessionService.setSession({
      userId: 1,
      staffId: staff1Id,
      username: 'arun.kumar',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    inventoryService.submitStockCount({
      product_variant_id: varCottonSareeId,
      physical_quantity: 18,
      reason: 'Routine count',
    });

    const s1History = inventoryService.getInventoryHistory();
    expect(s1History.length).toBe(1);

    // Switch session to Staff 2 (Priya)
    SessionService.setSession({
      userId: 2,
      staffId: staff2Id,
      username: 'priya.sharma',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: ['self.inventory.view'],
    });

    // Staff 2 history is empty (isolated)
    const s2History = inventoryService.getInventoryHistory();
    expect(s2History.length).toBe(0);
  });
});
