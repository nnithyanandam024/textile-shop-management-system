import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { SessionService } from '../../electron/main/services/auth/sessionService';
import path from 'path';
import fs from 'fs';

describe('Staff Portal — Phase 9 Test Suite (POS & Sales Operations)', () => {
  const testDbPath = path.join(__dirname, '../.test_db/test_staff_portal_phase9.db');
  let db: Database.Database;
  let service: StaffPOSService;

  let staff1Id: number;
  let staff2Id: number;
  let user1Id: number;
  let user2Id: number;
  let supervisorUserId: number;
  let supervisorRoleId: number;
  let supervisorStaffId: number;

  let variant1Id: number;
  let variant2Id: number;
  let variant3Id: number;

  let walkInCustomerId: number;
  let regularCustomerId: number;

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    db = initDatabase(testDbPath);
    service = new StaffPOSService(db);

    // Setup Roles
    const existingSup = db.prepare("SELECT id FROM roles WHERE name = 'SUPERVISOR'").get() as { id: number } | undefined;
    if (existingSup) {
      supervisorRoleId = existingSup.id;
    } else {
      const supRoleRes = db.prepare("INSERT INTO roles (name, description) VALUES ('SUPERVISOR', 'Floor Supervisor')").run();
      supervisorRoleId = Number(supRoleRes.lastInsertRowid);
    }

    // Setup Users
    const u1Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun.pos', '$2b$10$cs0yM087j3wvSiH1QUHlUecLA9Z1qWvXGgYxLsmkI40xXW3f', 'Arun Kumar (Floor Staff)', 3)
    `).run();
    user1Id = Number(u1Res.lastInsertRowid);

    const u2Res = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('priya.pos', '$2b$10$cs0yM087j3wvSiH1QUHlUecLA9Z1qWvXGgYxLsmkI40xXW3f', 'Priya Sharma (Staff)', 3)
    `).run();
    user2Id = Number(u2Res.lastInsertRowid);

    const supRes = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('karthik.sup', '$2b$10$cs0yM087j3wvSiH1QUHlUecLA9Z1qWvXGgYxLsmkI40xXW3f', 'Karthik Raja (Supervisor)', ?)
    `).run(supervisorRoleId);
    supervisorUserId = Number(supRes.lastInsertRowid);

    // Setup Staff
    const s1Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0001', 'Arun', 'Kumar', '9876543210', 'arun@texora.shop',
        1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(user1Id);
    staff1Id = Number(s1Res.lastInsertRowid);

    const s2Res = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0002', 'Priya', 'Sharma', '9876500002', 'priya@texora.shop',
        1, 1, 'Branch 02', '2026-02-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(user2Id);
    staff2Id = Number(s2Res.lastInsertRowid);

    const sSupRes = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0003', 'Karthik', 'Raja', '9876500003', 'karthik@texora.shop',
        1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(supervisorUserId);
    supervisorStaffId = Number(sSupRes.lastInsertRowid);

    // Setup Categories & Brands
    const catRes = db.prepare(`
      INSERT INTO categories (name, description) VALUES ('Sarees', 'Traditional Silk & Cotton Sarees')
    `).run();
    const catId = Number(catRes.lastInsertRowid);

    const catShirtsRes = db.prepare(`
      INSERT INTO categories (name, description) VALUES ('Shirts', 'Men Shirts')
    `).run();
    const catShirtsId = Number(catShirtsRes.lastInsertRowid);

    const brandRes = db.prepare(`
      INSERT INTO brands (name, description) VALUES ('Texora Heritage', 'Premium Line')
    `).run();
    const brandId = Number(brandRes.lastInsertRowid);

    // Setup Products
    const p1Res = db.prepare(`
      INSERT INTO products (name, category_id, brand_id, material, description, is_active)
      VALUES ('Royal Cotton Saree', ?, ?, 'Pure Cotton', 'Handloom cotton', 1)
    `).run(catId, brandId);
    const p1Id = Number(p1Res.lastInsertRowid);

    const p2Res = db.prepare(`
      INSERT INTO products (name, category_id, brand_id, material, description, is_active)
      VALUES ('Classic Formal Shirt', ?, ?, 'Linen', 'Executive slim fit', 1)
    `).run(catShirtsId, brandId);
    const p2Id = Number(p2Res.lastInsertRowid);

    // Setup Variants
    const v1Res = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SAR-1023', '8901234567890', 'Free Size', 'Royal Blue', 'Traditional', 800, 1500,
        5, 20, 1
      )
    `).run(p1Id);
    variant1Id = Number(v1Res.lastInsertRowid);

    const v2Res = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SH-2010', '8901234567891', 'L (40)', 'Pure White', 'Solid', 450, 1200,
        5, 10, 1
      )
    `).run(p2Id);
    variant2Id = Number(v2Res.lastInsertRowid);

    const v3Res = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SH-2011', '8901234567892', 'XL (42)', 'Pure White', 'Solid', 450, 1200,
        5, 1, 1
      )
    `).run(p2Id);
    variant3Id = Number(v3Res.lastInsertRowid);

    // Setup Customers
    const c1Res = db.prepare(`
      INSERT INTO customers (customer_code, name, phone, email, is_active)
      VALUES ('CUST-0001', 'Walk-in Customer', NULL, NULL, 1)
    `).run();
    walkInCustomerId = Number(c1Res.lastInsertRowid);

    const c2Res = db.prepare(`
      INSERT INTO customers (customer_code, name, phone, email, is_active)
      VALUES ('CUST-0002', 'Ramesh Kumar', '9876543210', 'ramesh@gmail.com', 1)
    `).run();
    regularCustomerId = Number(c2Res.lastInsertRowid);
  });

  afterAll(() => {
    SessionService.clearSession();
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Multi-Criteria Product Search & Direct Barcode Scan Lookup', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      role: 'STAFF',
    });

    // 1. Multi-criteria search
    const results = service.searchProducts('Cotton Saree');
    expect(results.length).toBe(1);
    expect(results[0].sku).toBe('SAR-1023');
    expect(results[0].sellingPrice).toBe(1500);
    expect(results[0].currentStock).toBe(20);
    expect(results[0].status).toBe('IN_STOCK');

    // 2. Barcode exact lookup
    const scanned = service.getProductByBarcode('8901234567890');
    expect(scanned).not.toBeNull();
    expect(scanned?.sku).toBe('SAR-1023');
    expect(scanned?.productName).toBe('Royal Cotton Saree');

    // 3. Search non-existent barcode
    const notFound = service.getProductByBarcode('9999999999999');
    expect(notFound).toBeNull();
  });

  it('Test 2: Customer Selection & Quick Registration', () => {
    // 1. Search existing customers
    const custs = service.getCustomers('Ramesh');
    expect(custs.length).toBe(1);
    expect(custs[0].name).toBe('Ramesh Kumar');

    // 2. Quick create new customer
    const newCust = service.quickCreateCustomer({
      name: 'Ananya Iyer',
      phone: '9840112233',
      email: 'ananya@iyer.com',
      address: 'T Nagar, Chennai',
    });

    expect(newCust.success).toBe(true);
    expect(newCust.customer.name).toBe('Ananya Iyer');
    expect(newCust.customer.customer_code).toContain('CUST-');

    // 3. Customer purchase history initial state
    const history = service.getCustomerHistory(newCust.customer.id);
    expect(history.orderCount).toBe(0);
    expect(history.lifetimeSpend).toBe(0);
  });

  it('Test 3: Role-Based Discount Cap Enforcement (Staff 5% limit vs Supervisor 20%)', () => {
    // 1. Staff session (Floor Staff max discount: 5%)
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Subtotal: 2 * ₹1,500 = ₹3,000. 5% discount = ₹150
    const allowed = service.calculateCartTotals({
      items: [{ variantId: variant1Id, quantity: 2, unitPrice: 1500 }],
      discountType: 'PERCENT',
      discountValue: 5,
    });
    expect(allowed.subtotal).toBe(3000);
    expect(allowed.discountAmount).toBe(150);
    expect(allowed.totalAmount).toBe(2850);

    // Exceeding Staff limit (e.g. 10%) should throw error
    expect(() =>
      service.calculateCartTotals({
        items: [{ variantId: variant1Id, quantity: 2, unitPrice: 1500 }],
        discountType: 'PERCENT',
        discountValue: 10,
      })
    ).toThrow('Discount exceeds your authorized limit of 5%');

    // 2. Supervisor session (Supervisor max discount: 20%)
    SessionService.setSession({
      staffId: supervisorStaffId,
      userId: supervisorUserId,
      username: 'karthik.sup',
      displayName: 'Karthik Raja',
      roleId: supervisorRoleId,
      roleName: 'SUPERVISOR',
      permissions: [],
    });

    const supAllowed = service.calculateCartTotals({
      items: [{ variantId: variant1Id, quantity: 2, unitPrice: 1500 }],
      discountType: 'PERCENT',
      discountValue: 15,
    });
    expect(supAllowed.discountAmount).toBe(450); // 15% of 3000 = 450
    expect(supAllowed.totalAmount).toBe(2550);
  });

  it('Test 4: Cash Payment & Change Calculation', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Buy 2 sarees (₹3,000) with 5% discount (₹150) -> Total: ₹2,850. Tendered ₹3,000 -> Change ₹150
    const invoice = service.completeSale({
      customerId: regularCustomerId,
      items: [{ variantId: variant1Id, quantity: 2, unitPrice: 1500 }],
      discountType: 'PERCENT',
      discountValue: 5,
      payments: [{ method: 'CASH', amount: 3000 }],
      notes: 'Festival Cash Payment',
    });

    expect(invoice.invoiceNumber).toContain('INV-');
    expect(invoice.totalAmount).toBe(2850);
    expect(invoice.paidAmount).toBe(2850);
    expect(invoice.changeAmount).toBe(150);
    expect(invoice.paymentMethod).toBe('CASH');

    // Verify stock deducted from 20 -> 18
    const updatedV1 = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant1Id) as any;
    expect(updatedV1.current_stock).toBe(18);
  });

  it('Test 5: Split Payment Validation (Cash + UPI)', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // 1 saree (₹1,500) + 1 shirt (₹1,200) = Subtotal ₹2,700. No discount -> Total: ₹2,700
    // Split: Cash ₹1,000 + UPI ₹1,700 = ₹2,700
    const invoice = service.completeSale({
      customerId: regularCustomerId,
      items: [
        { variantId: variant1Id, quantity: 1, unitPrice: 1500 },
        { variantId: variant2Id, quantity: 1, unitPrice: 1200 },
      ],
      payments: [
        { method: 'CASH', amount: 1000 },
        { method: 'UPI', amount: 1700, referenceNumber: 'UPI99887766' },
      ],
    });

    expect(invoice.totalAmount).toBe(2700);
    expect(invoice.payments.length).toBe(2);
    expect(invoice.paymentMethod).toBe('SPLIT');

    // Verify stocks: V1 (18 -> 17), V2 (10 -> 9)
    const v1 = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant1Id) as any;
    const v2 = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant2Id) as any;
    expect(v1.current_stock).toBe(17);
    expect(v2.current_stock).toBe(9);
  });

  it('Test 6: Stock Protection & Over-Selling Prevention', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Variant 3 has only 1 unit in stock
    const v3 = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant3Id) as any;
    expect(v3.current_stock).toBe(1);

    // Attempting to sell 2 units should fail
    expect(() =>
      service.completeSale({
        customerId: walkInCustomerId,
        items: [{ variantId: variant3Id, quantity: 2, unitPrice: 1200 }],
        payments: [{ method: 'CASH', amount: 2400 }],
      })
    ).toThrow('Insufficient stock for SKU SH-2011');

    // Verify stock is untouched (remains 1)
    const untouched = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant3Id) as any;
    expect(untouched.current_stock).toBe(1);
  });

  it('Test 7: Hold & Resume Cart Lifecycle', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // 1. Hold cart
    const holdRes = service.holdSale({
      referenceName: 'Ramesh Kumar (2 Sarees)',
      customerId: regularCustomerId,
      cartData: {
        cart: [{ variantId: variant1Id, quantity: 2, unitPrice: 1500 }],
        discountType: 'PERCENT',
        discountValue: 0,
      },
      subtotal: 3000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 3000,
    });

    expect(holdRes.success).toBe(true);
    expect(holdRes.heldId).toBeGreaterThan(0);

    // 2. Query held carts
    const activeHeld = service.getHeldSales();
    expect(activeHeld.length).toBe(1);
    expect(activeHeld[0].referenceName).toBe('Ramesh Kumar (2 Sarees)');

    // 3. Resume held cart
    const resumed = service.resumeSale(holdRes.heldId);
    expect(resumed.status).toBe('RESUMED');
    expect(resumed.cartData.cart.length).toBe(1);

    // 4. Held list should now be empty
    const remainingHeld = service.getHeldSales();
    expect(remainingHeld.length).toBe(0);
  });

  it('Test 8: Sales Return Processing & Inventory Restocking', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Create a sale first: 2 shirts (variant 2, stock = 9 -> 7)
    const sale = service.completeSale({
      customerId: regularCustomerId,
      items: [{ variantId: variant2Id, quantity: 2, unitPrice: 1200 }],
      payments: [{ method: 'UPI', amount: 2400, referenceNumber: 'UPI12345' }],
    });

    const v2BeforeReturn = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant2Id) as any;
    expect(v2BeforeReturn.current_stock).toBe(7);

    // Return 1 shirt in 'GOOD' condition
    const saleItem = sale.items[0];
    const returnRes = service.createReturnRequest({
      saleId: sale.id,
      items: [
        {
          saleItemId: saleItem.id,
          variantId: variant2Id,
          quantity: 1,
          reason: 'WRONG_SIZE',
          condition: 'GOOD',
        },
      ],
      notes: 'Exchanged for different size',
    });

    expect(returnRes.success).toBe(true);
    expect(returnRes.returnNumber).toContain('RET-');
    expect(returnRes.refundAmount).toBe(1200);

    // Verify stock restocked from 7 -> 8
    const v2AfterReturn = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(variant2Id) as any;
    expect(v2AfterReturn.current_stock).toBe(8);
  });

  it('Test 9: Personal Sales Summary & Commission Calculation', () => {
    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.pos',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Get today's sales summary for Arun
    const summary = service.getMySales({ period: 'ALL' });
    expect(summary.totalOrdersCount).toBeGreaterThanOrEqual(3);
    expect(summary.totalSalesVolume).toBeGreaterThan(0);
    expect(summary.commissionRate).toBe(1.5);
    expect(summary.commissionEarned).toBe(Math.round((summary.totalSalesVolume * 1.5) / 100));
    expect(summary.recentSales.length).toBeGreaterThan(0);
  });

  it('Test 10: Strict Staff Session Isolation', () => {
    // Switch session to Priya (staff 2)
    SessionService.setSession({
      staffId: staff2Id,
      userId: user2Id,
      username: 'priya.pos',
      displayName: 'Priya Sharma',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Priya has completed 0 sales so far
    const priyaSummary = service.getMySales({ period: 'ALL' });
    expect(priyaSummary.totalOrdersCount).toBe(0);
    expect(priyaSummary.totalSalesVolume).toBe(0);
    expect(priyaSummary.commissionEarned).toBe(0);
    expect(priyaSummary.recentSales.length).toBe(0);
  });
});
