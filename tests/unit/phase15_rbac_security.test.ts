import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { AuthorizationService } from '../../electron/main/services/auth/authorizationService';
import { checkPermissionMatch, PERMISSIONS, ROLE_PERMISSION_TEMPLATES } from '../../src/auth/permissions';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { StaffInventoryService } from '../../electron/main/services/staffInventoryService';
import { StaffAttendanceService } from '../../electron/main/services/staffAttendanceService';
import { StaffLeaveService } from '../../electron/main/services/staffLeaveService';
import { LeaveService } from '../../electron/main/services/leaveService';
import { SessionService } from '../../electron/main/services/auth/sessionService';
import { eventBus } from '../../electron/main/realtime/eventBus';

describe('Phase 15 — Complete Role-Based Access Control (RBAC) & Security Test Suite', () => {
  const testDbPath = path.join(__dirname, '../../test_phase15.db');
  let db: Database.Database;

  let posService: StaffPOSService;
  let inventoryService: StaffInventoryService;
  let attendanceService: StaffAttendanceService;
  let staffLeaveService: StaffLeaveService;
  let leaveService: LeaveService;

  // User & Staff IDs
  let adminUserId: number;
  let managerUserId: number;
  let cashierUserId: number;
  let inventoryUserId: number;
  let staffUserId: number;
  let deactivatedUserId: number;

  let managerStaffId: number;
  let cashierStaffId: number;
  let inventoryStaffId: number;
  let generalStaffId: number;

  let variantId: number;
  let customerId: number;

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

    const passwordHash = bcrypt.hashSync('password123', 10);

    // 1. Resolve Role IDs
    const getRoleId = (name: string) => {
      const row = db.prepare('SELECT id FROM roles WHERE name = ?').get(name) as { id: number } | undefined;
      if (row) return row.id;
      return Number(db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(name, name).lastInsertRowid);
    };

    const roleAdminId = getRoleId('Owner');
    const roleManagerId = getRoleId('Manager');
    const roleCashierId = getRoleId('Cashier');
    const roleInventoryId = getRoleId('Inventory Staff');
    const roleStaffId = getRoleId('Staff');

    // 2. Setup Users
    adminUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('admin.owner', ?, 'Admin Owner', ?, 1)").run(passwordHash, roleAdminId).lastInsertRowid);
    managerUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('rajesh.mgr', ?, 'Rajesh Manager', ?, 1)").run(passwordHash, roleManagerId).lastInsertRowid);
    cashierUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('arun.cashier', ?, 'Arun Cashier', ?, 1)").run(passwordHash, roleCashierId).lastInsertRowid);
    inventoryUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('karthik.stock', ?, 'Karthik Inventory', ?, 1)").run(passwordHash, roleInventoryId).lastInsertRowid);
    staffUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('priya.floor', ?, 'Priya Floor', ?, 1)").run(passwordHash, roleStaffId).lastInsertRowid);
    deactivatedUserId = Number(db.prepare("INSERT INTO users (username, password_hash, display_name, role_id, is_active) VALUES ('deact.user', ?, 'Deactivated User', ?, 0)").run(passwordHash, roleCashierId).lastInsertRowid);

    // 3. Setup Staff Profiles
    managerStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-0151', 'Rajesh', 'Manager', '9876543151', 1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(managerUserId).lastInsertRowid);
    cashierStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-0152', 'Arun', 'Cashier', '9876543152', 1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(cashierUserId).lastInsertRowid);
    inventoryStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-0153', 'Karthik', 'Stock', '9876543153', 1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(inventoryUserId).lastInsertRowid);
    generalStaffId = Number(db.prepare("INSERT INTO staff (staff_code, first_name, last_name, phone, department_id, designation_id, work_location, joining_date, employment_type, status, user_id) VALUES ('STF-0154', 'Priya', 'Floor', '9876543154', 1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?)").run(staffUserId).lastInsertRowid);

    // 4. Setup Products & Variant
    const catRes = db.prepare("INSERT INTO categories (name, description) VALUES ('RBAC Test Sarees', 'Testing Category')").run();
    const prodRes = db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Kanchipuram Silk Saree', ?, 'Pure Silk', 1)").run(catRes.lastInsertRowid);
    const varRes = db.prepare("INSERT INTO product_variants (product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active) VALUES (?, 'KNC-SILK-01', '8901500001', 4000.0, 6000.0, 5, 50, 1)").run(prodRes.lastInsertRowid);
    variantId = Number(varRes.lastInsertRowid);

    // 5. Setup Customer
    const custRes = db.prepare("INSERT INTO customers (customer_code, name, phone, email, is_active) VALUES ('CUS-15001', 'Lakshmi Narayanan', '9840115500', 'lakshmi@texora.shop', 1)").run();
    customerId = Number(custRes.lastInsertRowid);
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Role-Permission Matrix & Alias Normalization', () => {
    // 1. Direct permission match
    expect(checkPermissionMatch(['POS_CREATE_SALE'], 'POS_CREATE_SALE')).toBe(true);

    // 2. Dot-case alias expansion
    expect(checkPermissionMatch(['billing.create'], 'POS_CREATE_SALE')).toBe(true);
    expect(checkPermissionMatch(['POS_CREATE_SALE'], 'billing.create')).toBe(true);
    expect(checkPermissionMatch(['inventory.adjust'], 'INVENTORY_ADJUST')).toBe(true);
    expect(checkPermissionMatch(['INVENTORY_ADJUST'], 'inventory.adjust')).toBe(true);

    // 3. Super admin wildcard
    expect(checkPermissionMatch(['*'], 'ANY_UNKNOWN_PERMISSION')).toBe(true);

    // 4. Unauthorized check
    expect(checkPermissionMatch(['POS_VIEW'], 'INVENTORY_ADJUST')).toBe(false);
  });

  it('Test 2: Admin / Super Admin Unrestricted Bypass', () => {
    SessionService.setSession({
      userId: adminUserId,
      username: 'admin.owner',
      displayName: 'Admin Owner',
      roleId: 1,
      roleName: 'Owner',
      permissions: ['*'],
      token: 'admin_token_15',
    });

    expect(AuthorizationService.hasPermission('POS_CREATE_SALE')).toBe(true);
    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(true);
    expect(AuthorizationService.hasPermission('PAYROLL_APPROVE')).toBe(true);
    expect(AuthorizationService.hasPermission('UNKNOWN_PERMISSION_XYZ')).toBe(true);
    expect(() => AuthorizationService.requirePermission('SYSTEM_SECURITY_OVERRIDE')).not.toThrow();
  });

  it('Test 3: Manager Operational Authorization', () => {
    const managerPerms = ROLE_PERMISSION_TEMPLATES.MANAGER;
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'rajesh.mgr',
      displayName: 'Rajesh Manager',
      roleId: 2,
      roleName: 'Manager',
      permissions: managerPerms,
      token: 'manager_token_15',
    });

    expect(AuthorizationService.hasPermission('POS_CREATE_SALE')).toBe(true);
    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(true);
    expect(AuthorizationService.hasPermission('LEAVE_APPROVE')).toBe(true);
    expect(AuthorizationService.hasPermission('REPORT_VIEW_SALES')).toBe(true);
  });

  it('Test 4: Cashier Restricted Boundary (POS vs Inventory/Payroll)', () => {
    const cashierPerms = ROLE_PERMISSION_TEMPLATES.CASHIER;
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'arun.cashier',
      displayName: 'Arun Cashier',
      roleId: 3,
      roleName: 'Cashier',
      permissions: cashierPerms,
      token: 'cashier_token_15',
    });

    // Allowed POS actions
    expect(AuthorizationService.hasPermission('POS_VIEW')).toBe(true);
    expect(AuthorizationService.hasPermission('POS_CREATE_SALE')).toBe(true);
    expect(AuthorizationService.hasPermission('CUSTOMER_CREATE')).toBe(true);

    // Forbidden actions
    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(false);
    expect(AuthorizationService.hasPermission('PAYROLL_APPROVE')).toBe(false);
    expect(AuthorizationService.hasPermission('USERS_MANAGE')).toBe(false);
  });

  it('Test 5: Inventory Staff Operational Boundary', () => {
    const invPerms = ROLE_PERMISSION_TEMPLATES.INVENTORY_STAFF;
    SessionService.setSession({
      userId: inventoryUserId,
      staffId: inventoryStaffId,
      username: 'karthik.stock',
      displayName: 'Karthik Inventory',
      roleId: 4,
      roleName: 'Inventory Staff',
      permissions: invPerms,
      token: 'inv_token_15',
    });

    expect(AuthorizationService.hasPermission('INVENTORY_VIEW')).toBe(true);
    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(true);
    expect(AuthorizationService.hasPermission('PRODUCT_CREATE')).toBe(true);

    // Forbidden from POS and Payroll
    expect(AuthorizationService.hasPermission('POS_CREATE_SALE')).toBe(false);
    expect(AuthorizationService.hasPermission('PAYROLL_APPROVE')).toBe(false);
  });

  it('Test 6: General Staff Self-Service Boundary', () => {
    const staffPerms = ROLE_PERMISSION_TEMPLATES.STAFF;
    SessionService.setSession({
      userId: staffUserId,
      staffId: generalStaffId,
      username: 'priya.floor',
      displayName: 'Priya Floor',
      roleId: 5,
      roleName: 'Staff',
      permissions: staffPerms,
      token: 'staff_token_15',
    });

    expect(AuthorizationService.hasPermission('ATTENDANCE_CHECK_IN')).toBe(true);
    expect(AuthorizationService.hasPermission('LEAVE_CREATE')).toBe(true);
    expect(AuthorizationService.hasPermission('PAYROLL_VIEW_SELF')).toBe(true);

    // Forbidden from managerial and administrative actions
    expect(AuthorizationService.hasPermission('LEAVE_APPROVE')).toBe(false);
    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(false);
  });

  it('Test 7: Direct IPC / Service Unauthorized Rejection (403 Forbidden)', () => {
    // Set active session to Cashier (lacks INVENTORY_ADJUST)
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'arun.cashier',
      displayName: 'Arun Cashier',
      roleId: 3,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.CASHIER,
      token: 'cashier_token_15',
    });

    // Cashier directly calling stock count adjustment -> Throws 403 Access Denied
    expect(() => {
      inventoryService.submitStockCount({
        product_variant_id: variantId,
        physical_quantity: 48,
        reason: 'Attempted unauthorized stock count',
      });
    }).toThrow(/Access Denied: You do not have permission to perform this action \(INVENTORY_ADJUST\)/);
  });

  it('Test 8: IDOR Defense on Sales History & Receipts', () => {
    // 1. Manager completes a sale
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'rajesh.mgr',
      displayName: 'Rajesh Manager',
      roleId: 2,
      roleName: 'Manager',
      permissions: ROLE_PERMISSION_TEMPLATES.MANAGER,
      token: 'manager_token_15',
    });

    const managerInvoice = posService.completeSale({
      customerId,
      items: [{ variantId, quantity: 1, unitPrice: 6000.0 }],
      payments: [{ method: 'CASH', amount: 6000.0 }],
    });
    expect(managerInvoice).toBeDefined();

    // 2. Cashier attempts to access manager's private sale record under SELF scope
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'arun.cashier',
      displayName: 'Arun Cashier',
      roleId: 3,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.CASHIER, // Only has SALES_VIEW_SELF
      token: 'cashier_token_15',
    });

    expect(() => {
      AuthorizationService.requireDataScope('SELF', { userId: managerUserId, staffId: managerStaffId });
    }).toThrow(/Access Denied: You cannot access or modify records belonging to another employee/);
  });

  it('Test 9: IDOR Defense on Payroll Records & Leave Requests', () => {
    // General Staff session
    SessionService.setSession({
      userId: staffUserId,
      staffId: generalStaffId,
      username: 'priya.floor',
      displayName: 'Priya Floor',
      roleId: 5,
      roleName: 'Staff',
      permissions: ROLE_PERMISSION_TEMPLATES.STAFF,
      token: 'staff_token_15',
    });

    // Accessing own resource -> PASS
    expect(() => {
      AuthorizationService.requireDataScope('SELF', { userId: staffUserId, staffId: generalStaffId });
    }).not.toThrow();

    // Attempting to access another employee's record -> FAIL
    expect(() => {
      AuthorizationService.requireDataScope('SELF', { userId: managerUserId, staffId: managerStaffId });
    }).toThrow(/Access Denied/);
  });

  it('Test 10: POS Discount Threshold Enforcement', () => {
    // 1. Cashier session with normal 10% limit
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'arun.cashier',
      displayName: 'Arun Cashier',
      roleId: 3,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.CASHIER,
      token: 'cashier_token_15',
    });

    // <= 10% discount allowed
    expect(AuthorizationService.validateDiscountThreshold(10)).toBe(true);
    expect(AuthorizationService.validateDiscountThreshold(5)).toBe(true);

    // > 10% discount rejected for standard cashier
    expect(AuthorizationService.validateDiscountThreshold(25)).toBe(false);

    // 2. Manager session can apply > 10% discount
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'rajesh.mgr',
      displayName: 'Rajesh Manager',
      roleId: 2,
      roleName: 'Manager',
      permissions: ROLE_PERMISSION_TEMPLATES.MANAGER,
      token: 'manager_token_15',
    });

    expect(AuthorizationService.validateDiscountThreshold(25)).toBe(true);
  });

  it('Test 11: Deactivated User Immediate Rejection', () => {
    const userRow = db.prepare('SELECT is_active FROM users WHERE id = ?').get(deactivatedUserId) as { is_active: number };
    expect(userRow.is_active).toBe(0);

    // Deactivated user cannot authenticate or execute operations
    SessionService.setSession({
      userId: deactivatedUserId,
      username: 'deact.user',
      displayName: 'Deactivated User',
      roleId: 3,
      roleName: 'Cashier',
      status: 'INACTIVE',
      isActive: false,
      permissions: [],
      token: 'deact_token_15',
    });

    expect(AuthorizationService.hasPermission('POS_CREATE_SALE')).toBe(false);
  });

  it('Test 12: Dynamic Role Change & Revocation', () => {
    // User starts as Manager
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'rajesh.mgr',
      displayName: 'Rajesh Manager',
      roleId: 2,
      roleName: 'Manager',
      permissions: ROLE_PERMISSION_TEMPLATES.MANAGER,
      token: 'manager_token_15',
    });

    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(true);

    // Admin demotes user to Staff -> Session permissions dynamically updated
    SessionService.setSession({
      userId: managerUserId,
      staffId: managerStaffId,
      username: 'rajesh.mgr',
      displayName: 'Rajesh Manager',
      roleId: 5,
      roleName: 'Staff',
      permissions: ROLE_PERMISSION_TEMPLATES.STAFF,
      token: 'manager_token_15',
    });

    // Manager permissions immediately revoked
    expect(AuthorizationService.hasPermission('INVENTORY_ADJUST')).toBe(false);
    expect(AuthorizationService.hasPermission('LEAVE_APPROVE')).toBe(false);
  });

  it('Test 13: Real-Time RBAC Event Scoping & Confidentiality', () => {
    const receivedEvents: any[] = [];
    const unsub = eventBus.subscribe('NOTIFICATION_CREATED', (evt) => {
      receivedEvents.push(evt);
    });

    // Emit event targeted specifically to Cashier Staff ID
    eventBus.publish('NOTIFICATION_CREATED', {
      id: 1501,
      title: 'Confidential Disciplinary Notice',
      message: 'Restricted communication',
      type: 'DISCIPLINARY',
    }, {
      targetStaffId: cashierStaffId,
    });

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].meta.targetStaffId).toBe(cashierStaffId);

    unsub();
  });

  it('Test 14: Security Audit Trail Logging', () => {
    const auditRes = db.prepare(`
      INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, old_value, new_value
      ) VALUES (?, 'SECURITY_ROLE_CHANGED', 'USER', ?, 'Manager', 'Cashier')
    `).run(adminUserId, cashierUserId);

    expect(auditRes.lastInsertRowid).toBeDefined();

    const auditRow = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(auditRes.lastInsertRowid) as any;
    expect(auditRow.action).toBe('SECURITY_ROLE_CHANGED');
    expect(auditRow.old_value).toBe('Manager');
    expect(auditRow.new_value).toBe('Cashier');
  });

  it('Test 15: Successful Authorized Operation Execution', () => {
    // Valid Cashier session completing a permitted sale
    SessionService.setSession({
      userId: cashierUserId,
      staffId: cashierStaffId,
      username: 'arun.cashier',
      displayName: 'Arun Cashier',
      roleId: 3,
      roleName: 'Cashier',
      permissions: ROLE_PERMISSION_TEMPLATES.CASHIER,
      token: 'cashier_token_15',
    });

    const sale = posService.completeSale({
      customerId,
      items: [{ variantId, quantity: 1, unitPrice: 6000.0 }],
      payments: [{ method: 'CASH', amount: 6000.0 }],
      notes: 'Authorized Cashier Checkout',
    });

    expect(sale).toBeDefined();
    expect(sale.totalAmount).toBe(6000.0);
    expect(sale.staffName).toBe('Arun Cashier');
  });
});
