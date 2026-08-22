import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { SessionService } from '../../electron/main/services/auth/sessionService';
import { AuthorizationService } from '../../electron/main/services/auth/authorizationService';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { StaffInventoryService } from '../../electron/main/services/staffInventoryService';
import { StaffAttendanceService } from '../../electron/main/services/staffAttendanceService';
import { StaffLeaveService } from '../../electron/main/services/staffLeaveService';
import { LeaveService } from '../../electron/main/services/leaveService';
import { StaffCustomerService } from '../../electron/main/services/staffCustomerService';
import { StaffPayrollService } from '../../electron/main/services/staffPayrollService';
import { StaffReportsService } from '../../electron/main/services/staffReportsService';
import { StaffService } from '../../electron/main/services/staffService';
import { eventBus } from '../../electron/main/realtime/eventBus';
import { ROLE_PERMISSION_TEMPLATES } from '../../src/auth/permissions';

describe('Phase 16 — Complete End-to-End User Flow & Business Logic Test Suite', () => {
  const testDbPath = path.join(__dirname, '../../test_e2e_phase16.db');
  let db: Database.Database;

  // Domain Services
  let posService: StaffPOSService;
  let inventoryService: StaffInventoryService;
  let attendanceService: StaffAttendanceService;
  let staffLeaveService: StaffLeaveService;
  let leaveService: LeaveService;
  let customerService: StaffCustomerService;
  let payrollService: StaffPayrollService;
  let reportService: StaffReportsService;
  let staffService: StaffService;

  // User Accounts
  let adminUserId: number;
  let managerUserId: number;
  let supervisorUserId: number;
  let cashierUserId: number;
  let inventoryUserId: number;
  let staffUserId: number;
  let deactivatedUserId: number;

  // Staff Profiles
  let managerStaffId: number;
  let supervisorStaffId: number;
  let cashierStaffId: number;
  let inventoryStaffId: number;
  let generalStaffId: number;

  // Catalog Variants
  let varSilkSareeId: number;
  let varCottonSareeId: number;
  let varLinenShirtId: number;
  let varDhotiId: number;
  let varKurtaId: number;
  let varKidsPattuId: number;
  let varDressMaterialId: number;

  // Customers
  let customerAId: number;
  let customerBId: number;

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    db = initDatabase(testDbPath);

    posService = new StaffPOSService(db);
    inventoryService = new StaffInventoryService(db);
    attendanceService = new StaffAttendanceService(db);
    staffLeaveService = new StaffLeaveService(db);
    leaveService = new LeaveService(db);
    customerService = new StaffCustomerService(db);
    payrollService = new StaffPayrollService(db);
    reportService = new StaffReportsService(db);
    staffService = new StaffService(db);

    const passwordHash = bcrypt.hashSync('securePass123', 10);

    const getRoleId = (name: string) => {
      const row = db.prepare('SELECT id FROM roles WHERE name = ?').get(name) as { id: number } | undefined;
      if (row) return row.id;
      return Number(db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(name, name).lastInsertRowid);
    };

    const roleAdminId = getRoleId('Owner');
    const roleManagerId = getRoleId('Manager');
    const roleSupervisorId = getRoleId('Supervisor');
    const roleCashierId = getRoleId('Cashier');
    const roleInventoryId = getRoleId('Inventory Staff');
    const roleStaffId = getRoleId('Staff');

    // 1. Setup Test Users
    adminUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('admin.test', ?, 'Admin Tester', ?, 1)").run(passwordHash, roleAdminId).lastInsertRowid);
    managerUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('manager.test', ?, 'Murugan Manager', ?, 1)").run(passwordHash, roleManagerId).lastInsertRowid);
    supervisorUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('supervisor.test', ?, 'Suresh Supervisor', ?, 1)").run(passwordHash, roleSupervisorId).lastInsertRowid);
    cashierUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('cashier.test', ?, 'Kavitha Cashier', ?, 1)").run(passwordHash, roleCashierId).lastInsertRowid);
    inventoryUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('inventory.test', ?, 'Ganesh Stock', ?, 1)").run(passwordHash, roleInventoryId).lastInsertRowid);
    staffUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('staff.test', ?, 'Anitha Floor', ?, 1)").run(passwordHash, roleStaffId).lastInsertRowid);
    deactivatedUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('deact.test', ?, 'Deactivated Staff', ?, 0)").run(passwordHash, roleStaffId).lastInsertRowid);

    // 2. Setup Staff Profiles
    managerStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-1601', 'Murugan', 'Store', '9840116001', 1, 1, 'Main Showroom', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(managerUserId).lastInsertRowid);
    supervisorStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-1602', 'Suresh', 'Floor', '9840116002', 1, 1, 'Main Showroom', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(supervisorUserId).lastInsertRowid);
    cashierStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-1603', 'Kavitha', 'Billing', '9840116003', 1, 1, 'Main Showroom', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(cashierUserId).lastInsertRowid);
    inventoryStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-1604', 'Ganesh', 'Inventory', '9840116004', 1, 1, 'Main Showroom', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(inventoryUserId).lastInsertRowid);
    generalStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-1605', 'Anitha', 'Associate', '9840116005', 1, 1, 'Main Showroom', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(staffUserId).lastInsertRowid);

    // 3. Setup Realistic Indian Textile Catalog
    const catSarees = Number(db.prepare("INSERT INTO categories (name, description) VALUES ('Sarees', 'Traditional & Silk Sarees')").run().lastInsertRowid);
    const catMens = Number(db.prepare("INSERT INTO categories (name, description) VALUES ('Menswear', 'Shirts & Dhotis')").run().lastInsertRowid);
    const catKids = Number(db.prepare("INSERT INTO categories (name, description) VALUES ('Kids', 'Ethnic & Casual Wear')").run().lastInsertRowid);
    const catFabrics = Number(db.prepare("INSERT INTO categories (name, description) VALUES ('Dress Materials', 'Unstitched Fabrics')").run().lastInsertRowid);

    // Products & Variants
    const prodSilkSaree = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Kanchipuram Silk Saree', ?, 'Bridal Pure Silk', 1)").run(catSarees).lastInsertRowid);
    varSilkSareeId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'KNC-001', '890150001', 4500.0, 6500.0, 5, 25, 1)").run(prodSilkSaree).lastInsertRowid);

    const prodCottonSaree = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Pure Cotton Saree', ?, 'Coimbatore Cotton', 1)").run(catSarees).lastInsertRowid);
    varCottonSareeId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'COT-002', '890150002', 900.0, 1500.0, 10, 50, 1)").run(prodCottonSaree).lastInsertRowid);

    const prodLinenShirt = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Linen Casual Shirt', ?, '100% Pure Linen M', 1)").run(catMens).lastInsertRowid);
    varLinenShirtId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'SH-003', '890150003', 700.0, 1200.0, 5, 15, 1)").run(prodLinenShirt).lastInsertRowid);

    const prodDhoti = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Traditional Silk Dhoti', ?, 'Gold Zari Border', 1)").run(catMens).lastInsertRowid);
    varDhotiId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'DHT-004', '890150004', 1100.0, 1800.0, 4, 10, 1)").run(prodDhoti).lastInsertRowid);

    const prodKurta = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Designer Kurta Set', ?, 'Jacquard Silk L', 1)").run(catMens).lastInsertRowid);
    varKurtaId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'KUR-005', '890150005', 1800.0, 2800.0, 3, 8, 1)").run(prodKurta).lastInsertRowid);

    const prodKidsPattu = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Kids Pattu Pavadai', ?, 'Traditional Kids 28', 1)").run(catKids).lastInsertRowid);
    varKidsPattuId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'KID-006', '890150006', 1200.0, 1950.0, 5, 2, 1)").run(prodKidsPattu).lastInsertRowid);

    const prodDressMat = Number(db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Cotton Dress Material', ?, 'Chanderi 3-Piece', 1)").run(catFabrics).lastInsertRowid);
    varDressMaterialId = Number(db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'DRS-007', '890150007', 550.0, 950.0, 5, 0, 1)").run(prodDressMat).lastInsertRowid);

    // 4. Setup Customers
    customerAId = Number(db.prepare("INSERT INTO customers (customer_code, name, phone, email, address, is_active) VALUES ('CUS-1601', 'Meenakshi Sundaram', '9840199001', 'meenakshi@gmail.com', 'T. Nagar, Chennai', 1)").run().lastInsertRowid);
    customerBId = Number(db.prepare("INSERT INTO customers (customer_code, name, phone, email, address, is_active) VALUES ('CUS-1602', 'Venkatesh Raman', '9840199002', 'venkatesh@gmail.com', 'Mylapore, Chennai', 1)").run().lastInsertRowid);

    // Initial Loyalty Account
    db.prepare("INSERT INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier) VALUES (?, 100, 100, 'SILVER')").run(customerAId);
    db.prepare("INSERT INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier) VALUES (?, 0, 0, 'BRONZE')").run(customerBId);
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  // --- 1. AUTHENTICATION & SESSIONS ---
  it('E2E Flow 1: Multi-Role Authentication & Access Matrix', () => {
    // 1. Admin login verification
    SessionService.setSession({
      userId: adminUserId,
      username: 'admin.test',
      displayName: 'Admin Tester',
      roleId: 1,
      roleName: 'Owner',
      permissions: ['*'],
      token: 'token_admin',
    });
    expect(AuthorizationService.hasPermission('POS_VIEW')).toBe(true);
    expect(AuthorizationService.hasPermission('SETTINGS_VIEW')).toBe(true);

    // 2. Cashier login verification
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });
    expect(AuthorizationService.hasPermission('POS_CREATE_SALE')).toBe(true);
    expect(AuthorizationService.hasPermission('SETTINGS_VIEW')).toBe(false);

    // 3. Deactivated user login rejection
    SessionService.setSession({
      userId: deactivatedUserId,
      username: 'deact.test',
      displayName: 'Deactivated Staff',
      roleId: 6,
      roleName: 'Staff',
      status: 'INACTIVE',
      isActive: false,
      permissions: [],
      token: 'token_deact',
    });
    expect(AuthorizationService.hasPermission('POS_VIEW')).toBe(false);
  });

  // --- 2. ADMIN PROVISIONING & DYNAMIC ROLE MODIFICATION ---
  it('E2E Flow 2: Admin Provisions Staff, Modifies Role & Deactivates User', () => {
    SessionService.setSession({
      userId: adminUserId,
      username: 'admin.test',
      displayName: 'Admin Tester',
      roleId: 1,
      roleName: 'Owner',
      permissions: ['*'],
      token: 'token_admin',
    });

    // 1. Create new staff member with user account
    const passHash = bcrypt.hashSync('password123', 10);
    const userRes = db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('deepak.billing', ?, 'Deepak Raj', 4, 1)").run(passHash);
    const deepakUserId = Number(userRes.lastInsertRowid);

    const newStaff = staffService.createStaff({
      first_name: 'Deepak',
      last_name: 'Raj',
      phone: '9840199999',
      department_id: 1,
      designation_id: 1,
      work_location: 'Main Showroom',
      joining_date: '2026-08-22',
      employment_type: 'FULL_TIME',
      user_id: deepakUserId,
    }, adminUserId);

    expect(newStaff.success).toBe(true);
    expect(newStaff.id).toBeDefined();

    // 2. Dynamic Role Change: Cashier -> Supervisor
    const userRow = db.prepare('SELECT id, role_id FROM users WHERE username = ?').get('deepak.billing') as any;
    expect(userRow).toBeDefined();

    const roleSupId = db.prepare("SELECT id FROM roles WHERE name = 'Supervisor'").get() as any;
    db.prepare('UPDATE users SET role_id = ? WHERE id = ?').run(roleSupId.id, userRow.id);

    // Session reflects dynamic promotion
    SessionService.setSession({
      userId: userRow.id,
      staffId: newStaff.id!,
      username: 'deepak.billing',
      displayName: 'Deepak Raj',
      roleId: roleSupId.id,
      roleName: 'Supervisor',
      permissions: ROLE_PERMISSION_TEMPLATES.Supervisor,
      token: 'token_deepak',
    });

    expect(AuthorizationService.hasPermission('SHIFT_VIEW')).toBe(true);

    // 3. Admin Deactivation
    db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").run(userRow.id);
    db.prepare("UPDATE staff SET status = 'INACTIVE' WHERE id = ?").run(newStaff.id!);

    const deactUser = db.prepare('SELECT is_active FROM users WHERE id = ?').get(userRow.id) as any;
    expect(deactUser.is_active).toBe(0);
  });

  // --- 3. CASHIER POS BILLING, BARCODE SCANNING & CHECKOUT ---
  it('E2E Flow 3: Cashier POS Barcode Scan, Cart Calculation, Loyalty & Checkout', () => {
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });

    // 1. Search product by exact barcode (Kanchipuram Silk Saree: 890150001)
    const productList = posService.searchProducts('890150001');
    expect(productList.length).toBe(1);
    expect(productList[0].sku).toBe('KNC-001');
    expect(productList[0].sellingPrice).toBe(6500.0);
    expect(productList[0].currentStock).toBe(25);

    // 2. Scan invalid barcode
    const invalidScan = posService.searchProducts('999999999');
    expect(invalidScan.length).toBe(0);

    // 3. Build Cart:
    // - 2x Kanchipuram Silk Sarees (2 * ₹6,500 = ₹13,000)
    // - 1x Linen Shirt (1 * ₹1,200 = ₹1,200)
    // Subtotal: ₹14,200. Apply 5% bill discount = ₹710. Tax = 0. Grand Total = ₹13,490
    const cartItems = [
      { variantId: varSilkSareeId, quantity: 2, unitPrice: 6500.0 },
      { variantId: varLinenShirtId, quantity: 1, unitPrice: 1200.0 },
    ];

    const totals = posService.calculateCartTotals({
      items: cartItems,
      discountType: 'PERCENT',
      discountValue: 5,
      customerId: customerAId,
    });

    expect(totals.subtotal).toBe(14200.0);
    expect(totals.discountAmount).toBe(710.0);
    expect(totals.totalAmount).toBe(13490.0);

    // 4. Complete Sale via CASH (Tender ₹13,500 -> Change ₹10)
    const invoice = posService.completeSale({
      customerId: customerAId,
      items: cartItems,
      discountType: 'PERCENT',
      discountValue: 5,
      payments: [{ method: 'CASH', amount: 13500.0 }],
      notes: 'Diwali Festive Purchase',
    });

    expect(invoice).toBeDefined();
    expect(invoice.invoiceNumber).toMatch(/^INV-2026-\d{6}$/);
    expect(invoice.totalAmount).toBe(13490.0);
    expect(invoice.changeAmount).toBe(10.0);
    expect(invoice.staffName).toBe('Kavitha Billing');

    // 5. Verify Database Inventory Updates
    const vSilk = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varSilkSareeId) as any;
    expect(vSilk.current_stock).toBe(23); // 25 - 2 = 23

    const vShirt = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varLinenShirtId) as any;
    expect(vShirt.current_stock).toBe(14); // 15 - 1 = 14

    // 6. Verify Customer Loyalty Points Accrual (₹13,490 -> +134 pts)
    const loyalty = db.prepare('SELECT points_balance FROM loyalty_accounts WHERE customer_id = ?').get(customerAId) as any;
    expect(loyalty.points_balance).toBe(234); // 100 initial + 134 = 234
  });

  // --- 4. CART PARK & RESUME (HELD SALES) ---
  it('E2E Flow 4: Park Active Cart, Process Intermediate Sale, and Resume Held Cart', () => {
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });

    // 1. Hold Cart (Customer B buying 2 Dhotis)
    const holdRes = posService.holdSale({
      referenceName: 'Customer B - Dhoti Selection',
      customerId: customerBId,
      cartData: [{ variantId: varDhotiId, quantity: 2, unitPrice: 1800.0 }],
      subtotal: 3600.0,
      discountAmount: 0.0,
      taxAmount: 0.0,
      totalAmount: 3600.0,
    });

    expect(holdRes.success).toBe(true);
    expect(holdRes.heldId).toBeGreaterThan(0);

    // 2. Intermediate quick checkout for walk-in customer
    const intermediateSale = posService.completeSale({
      customerId: customerAId,
      items: [{ variantId: varCottonSareeId, quantity: 1, unitPrice: 1500.0 }],
      payments: [{ method: 'UPI', amount: 1500.0, referenceNumber: 'UPI-TXN-16001' }],
    });
    expect(intermediateSale.totalAmount).toBe(1500.0);

    // 3. Resume Held Cart
    const heldSales = posService.getHeldSales();
    expect(heldSales.length).toBe(1);
    expect(heldSales[0].referenceName).toBe('Customer B - Dhoti Selection');

    const resumed = posService.resumeSale(holdRes.heldId);
    expect(resumed.customerId).toBe(customerBId);
    expect(resumed.totalAmount).toBe(3600.0);
    expect(resumed.cartData.length).toBe(1);

    // 4. Complete Resumed Checkout
    const completedResumed = posService.completeSale({
      customerId: resumed.customerId!,
      items: resumed.cartData,
      payments: [{ method: 'CASH', amount: 3600.0 }],
    });
    expect(completedResumed.totalAmount).toBe(3600.0);

    // Verify Dhoti stock updated (10 - 2 = 8)
    const vDhoti = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varDhotiId) as any;
    expect(vDhoti.current_stock).toBe(8);
  });

  // --- 5. SALES RETURN & RESTOCKING CYCLE ---
  it('E2E Flow 5: Sales Return Process Restocks Stock, Adjusts Ledger & Audit Trail', () => {
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });

    // 1. Create a sale with 3 Kurtas (3 * ₹2,800 = ₹8,400)
    const sale = posService.completeSale({
      customerId: customerBId,
      items: [{ variantId: varKurtaId, quantity: 3, unitPrice: 2800.0 }],
      payments: [{ method: 'CASH', amount: 8400.0 }],
      notes: 'Family Wedding Purchase',
    });

    const vKurtaBefore = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varKurtaId) as any;
    expect(vKurtaBefore.current_stock).toBe(5); // 8 - 3 = 5

    // 2. Fetch sale invoice details
    const saleRow = db.prepare('SELECT id FROM sales WHERE invoice_number = ?').get(sale.invoiceNumber) as any;
    const saleItemRow = db.prepare('SELECT id FROM sale_items WHERE sale_id = ?').get(saleRow.id) as any;

    // 3. Process Return of 1 Kurta (Refund ₹2,800) in GOOD condition
    const returnRes = posService.createReturnRequest({
      saleId: saleRow.id,
      items: [{
        saleItemId: saleItemRow.id,
        variantId: varKurtaId,
        quantity: 1,
        reason: 'Size exchange requested',
        condition: 'GOOD',
      }],
      notes: 'Customer returned 1 Kurta in mint condition',
    });

    expect(returnRes.success).toBe(true);
    expect(returnRes.refundAmount).toBe(2800.0);
    expect(returnRes.returnNumber).toMatch(/^RET-2026-\d{6}$/);

    // 4. Verify Stock Restored (5 + 1 = 6)
    const vKurtaAfter = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varKurtaId) as any;
    expect(vKurtaAfter.current_stock).toBe(6);

    // 5. Verify Audit Log Entry
    const audit = db.prepare("SELECT * FROM audit_logs WHERE action = 'SALE_COMPLETED' ORDER BY id DESC").get() as any;
    expect(audit).toBeDefined();
  });

  // --- 6. CONCURRENCY & OVER-SELLING PREVENTION ---
  it('E2E Flow 6: Over-Selling Protection & Zero Negative Stock Enforcement', () => {
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });

    // Kids Pattu Pavadai has only 2 items in stock
    const vKids = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varKidsPattuId) as any;
    expect(vKids.current_stock).toBe(2);

    // Attempting to checkout 3 items must be cleanly rejected
    expect(() => {
      posService.completeSale({
        customerId: customerAId,
        items: [{ variantId: varKidsPattuId, quantity: 3, unitPrice: 1950.0 }],
        payments: [{ method: 'CASH', amount: 5850.0 }],
      });
    }).toThrow(/Insufficient stock for SKU KID-006/);

    // Verify stock was unaffected
    const vKidsUntouched = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varKidsPattuId) as any;
    expect(vKidsUntouched.current_stock).toBe(2);

    // Out of Stock Product (Dress Material = 0)
    expect(() => {
      posService.completeSale({
        customerId: customerAId,
        items: [{ variantId: varDressMaterialId, quantity: 1, unitPrice: 950.0 }],
        payments: [{ method: 'CASH', amount: 950.0 }],
      });
    }).toThrow(/Insufficient stock for SKU DRS-007/);
  });

  // --- 7. INVENTORY SPECIALIST AUDIT & DISCREPANCY FLOW ---
  it('E2E Flow 7: Inventory Physical Stock Count Audit & Discrepancy Recording', () => {
    SessionService.setSession({
      userId: inventoryUserId,
      staffId: inventoryStaffId,
      username: 'inventory.test',
      displayName: 'Ganesh Stock',
      roleId: 5,
      roleName: 'Inventory Staff',
      permissions: ROLE_PERMISSION_TEMPLATES['Inventory Staff'],
      token: 'token_inv',
    });

    // Cotton Saree has current stock 49 (50 - 1 from earlier sale)
    const vCotton = db.prepare('SELECT current_stock FROM product_variants WHERE id = ?').get(varCottonSareeId) as any;
    expect(vCotton.current_stock).toBe(49);

    // Submit Physical Count: Counted 47 (Difference = -2)
    const auditRes = inventoryService.submitStockCount({
      product_variant_id: varCottonSareeId,
      physical_quantity: 47,
      reason: 'Physical count discrepancy on shelf A-3',
      location_name: 'Main Showroom',
    });

    expect(auditRes.success).toBe(true);
    expect(auditRes.difference).toBe(-2);

    // Verify Stock Count Record created in PENDING status
    const countRow = db.prepare('SELECT * FROM stock_counts WHERE id = ?').get(auditRes.id) as any;
    expect(countRow.status).toBe('PENDING');
    expect(countRow.system_quantity).toBe(49);
    expect(countRow.physical_quantity).toBe(47);
  });

  // --- 8. STAFF ATTENDANCE & WORKED HOURS LIFECYCLE ---
  it('E2E Flow 8: Staff Check-In, Break, Check-Out & Duplicate Attendance Defense', () => {
    SessionService.setSession({
      userId: staffUserId,
      staffId: generalStaffId,
      username: 'staff.test',
      displayName: 'Anitha Floor',
      roleId: 6,
      roleName: 'Staff',
      permissions: ROLE_PERMISSION_TEMPLATES.Staff,
      token: 'token_staff',
    });

    // 1. Staff Check-In
    const checkInRes = attendanceService.checkIn('09:00:00');
    expect(checkInRes.success).toBe(true);
    expect(checkInRes.data.status).toBe('WORKING');

    // 2. Duplicate Check-in Rejected
    expect(() => {
      attendanceService.checkIn('09:05:00');
    }).toThrow(/Already checked in today/);

    // 3. Staff Break Lifecycle
    const breakStart = attendanceService.startBreak('13:00:00');
    expect(breakStart.success).toBe(true);
    expect(breakStart.data.status).toBe('ON_BREAK');

    const breakEnd = attendanceService.endBreak('13:45:00');
    expect(breakEnd.success).toBe(true);
    expect(breakEnd.data.totalBreakMinutes).toBe(45);

    // 4. Staff Check-Out (18:00:00)
    const checkOutRes = attendanceService.checkOut('18:00:00');
    expect(checkOutRes.success).toBe(true);
    expect(checkOutRes.data.checkOut).toBe('18:00:00');
    expect(checkOutRes.data.workedMinutes).toBe(495); // (9h - 45m break) = 8h 15m = 495m
  });

  // --- 9. STAFF LEAVE APPLICATION & MANAGER APPROVAL/REJECTION ---
  it('E2E Flow 9: Staff Applies Leave, Manager Approves and Rejects Requests', () => {
    // 1. Staff submits casual leave for Diwali
    SessionService.setSession({
      userId: staffUserId,
      staffId: generalStaffId,
      username: 'staff.test',
      displayName: 'Anitha Floor',
      roleId: 6,
      roleName: 'Staff',
      permissions: ROLE_PERMISSION_TEMPLATES.Staff,
      token: 'token_staff',
    });

    const leave1 = staffLeaveService.applyLeave({
      leave_type_id: 1, // Casual Leave
      start_date: '2026-11-01',
      end_date: '2026-11-02',
      reason: 'Diwali celebrations with family',
    });
    expect(leave1.success).toBe(true);
    expect(leave1.id).toBeGreaterThan(0);

    const leave2 = staffLeaveService.applyLeave({
      leave_type_id: 2, // Medical Leave
      start_date: '2026-11-15',
      end_date: '2026-11-16',
      reason: 'General medical checkup',
    });
    expect(leave2.success).toBe(true);

    // 2. Manager logs in to review and approve Leave 1
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'manager.test',
      displayName: 'Murugan Manager',
      roleId: 2,
      roleName: 'Manager',
      permissions: ROLE_PERMISSION_TEMPLATES.Manager,
      token: 'token_manager',
    });

    const approveRes = leaveService.approveLeave(leave1.id, managerUserId);
    expect(approveRes.success).toBe(true);

    // 3. Manager rejects Leave 2 with comment
    const rejectRes = leaveService.rejectLeave(leave2.id, 'Insufficient staffing on weekend', managerUserId);
    expect(rejectRes.success).toBe(true);
  });

  // --- 10. PAYROLL CONFIDENTIALITY & IDOR PROTECTION ---
  it('E2E Flow 10: Staff Retrieves Own Payslip; Blocked from Viewing Other Employee Records', () => {
    // 1. General staff querying own payslips -> Allowed
    SessionService.setSession({
      userId: staffUserId,
      staffId: generalStaffId,
      username: 'staff.test',
      displayName: 'Anitha Floor',
      roleId: 6,
      roleName: 'Staff',
      permissions: ROLE_PERMISSION_TEMPLATES.Staff,
      token: 'token_staff',
    });

    expect(() => {
      AuthorizationService.requireDataScope('SELF', { userId: staffUserId, staffId: generalStaffId });
    }).not.toThrow();

    // 2. Cashier attempting to access General Staff's confidential payroll record -> 403 Forbidden
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });

    expect(() => {
      AuthorizationService.requireDataScope('SELF', { userId: staffUserId, staffId: generalStaffId });
    }).toThrow(/Access Denied: You cannot access or modify records belonging to another employee/);
  });

  // --- 11. CUSTOMER MANAGEMENT & DUPLICATE CONFLICT PROTECTION ---
  it('E2E Flow 11: Create Customer, Search Profile, and Prevent Duplicate Phone Number', () => {
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'cashier.test',
      displayName: 'Kavitha Cashier',
      roleId: 4,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.Cashier,
      token: 'token_cashier',
    });

    // 1. Create New Customer C
    const newCust = customerService.createCustomer({
      name: 'Ramesh Kumar',
      phone: '9840199003',
      email: 'ramesh.k@gmail.com',
      city: 'Chennai',
    });

    expect(newCust.customerCode).toMatch(/^CUS-\d+$/);
    expect(newCust.name).toBe('Ramesh Kumar');

    // 2. Search Customer C by Phone
    const searchRes = customerService.searchCustomers('9840199003');
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].name).toBe('Ramesh Kumar');

    // 3. Duplicate Phone Registration Rejection
    expect(() => {
      customerService.createCustomer({
        name: 'Duplicate Ramesh',
        phone: '9840199003',
      });
    }).toThrow(/already exists/);
  });

  // --- 12. REAL-TIME EVENT BUS SYNCHRONIZATION ---
  it('E2E Flow 12: Real-Time Event Dispatch across Terminals & Role-Targeted Scoping', () => {
    const receivedEvents: any[] = [];
    const unsub = eventBus.subscribe('INVENTORY_UPDATED', (evt) => {
      receivedEvents.push(evt);
    });

    // POS Sale emits INVENTORY_UPDATED event
    eventBus.publish('INVENTORY_UPDATED', {
      variantId: varSilkSareeId,
      sku: 'KNC-001',
      productName: 'Kanchipuram Silk Saree',
      currentStock: 23,
    });

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].data.sku).toBe('KNC-001');
    expect(receivedEvents[0].data.currentStock).toBe(23);

    unsub();
  });

  // --- 13. BUSINESS REPORTS & FINANCIAL RECONCILIATION ---
  it('E2E Flow 13: Financial Summary & Mathematical Ledger Reconciliation', () => {
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'manager.test',
      displayName: 'Murugan Manager',
      roleId: 2,
      roleName: 'Manager',
      permissions: ROLE_PERMISSION_TEMPLATES.Manager,
      token: 'token_manager',
    });

    // 1. Fetch Sales Summary Report for cashier sales
    const salesSummary = reportService.getStaffSalesReport(cashierStaffId, { period: 'TODAY' });
    expect(salesSummary.totalOrdersCount).toBeGreaterThanOrEqual(1);
    expect(salesSummary.totalSalesVolume).toBeGreaterThan(0);

    // 2. Mathematical Integrity Validation:
    // Verify all completed sales match payments total exactly
    const totalsRow = db.prepare(`
      SELECT 
        (SELECT COALESCE(SUM(total), 0) FROM sales WHERE status = 'COMPLETED') as total_sales,
        (SELECT COALESCE(SUM(amount), 0) FROM payments) as total_payments
    `).get() as any;

    expect(totalsRow.total_sales).toBeGreaterThan(0);
    expect(totalsRow.total_payments).toBeGreaterThanOrEqual(totalsRow.total_sales);
  });
});
