import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { authApi } from '../../src/api/authApi';
import { staffApi } from '../../src/api/staffApi';
import { attendanceApi } from '../../src/api/attendanceApi';
import { leaveApi } from '../../src/api/leaveApi';
import { payrollApi } from '../../src/api/payrollApi';
import { inventoryApi } from '../../src/api/inventoryApi';
import { productApi } from '../../src/api/productApi';
import { salesApi } from '../../src/api/salesApi';
import { customerApi } from '../../src/api/customerApi';
import { notificationApi } from '../../src/api/notificationApi';
import { reportApi } from '../../src/api/reportApi';
import { settingsApi } from '../../src/api/settingsApi';
import { StorageManager } from '../../src/utils/storage';
import { PERMISSIONS, hasPermission } from '../../src/utils/permissions';
import { SessionService } from '../../electron/main/services/auth/sessionService';
import { StaffDashboardService } from '../../electron/main/services/staffDashboardService';
import { StaffProfileService } from '../../electron/main/services/staffProfileService';
import { StaffAttendanceService } from '../../electron/main/services/staffAttendanceService';
import { StaffLeaveService } from '../../electron/main/services/staffLeaveService';
import { StaffInventoryService } from '../../electron/main/services/staffInventoryService';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { StaffCustomerService } from '../../electron/main/services/staffCustomerService';
import { StaffPayrollService } from '../../electron/main/services/staffPayrollService';
import { StaffReportsService } from '../../electron/main/services/staffReportsService';
import { StaffSettingsService } from '../../electron/main/services/staffSettingsService';
import { StaffNotificationCenterService } from '../../electron/main/services/staffNotificationCenterService';

describe('Phase 13 — Complete API Integration for All Pages Test Suite', () => {
  const testDbPath = path.join(__dirname, '../../test_phase13.db');
  let db: Database.Database;

  let dashboardService: StaffDashboardService;
  let profileService: StaffProfileService;
  let attendanceService: StaffAttendanceService;
  let leaveService: StaffLeaveService;
  let inventoryService: StaffInventoryService;
  let posService: StaffPOSService;
  let customerService: StaffCustomerService;
  let payrollService: StaffPayrollService;
  let reportsService: StaffReportsService;
  let settingsService: StaffSettingsService;
  let notificationService: StaffNotificationCenterService;

  let staffId: number;
  let userId: number;
  let roleId: number;
  let variantId: number;
  let customerId: number;

  const mockLocalStorageStore: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => mockLocalStorageStore[key] || null,
    setItem: (key: string, value: string) => {
      mockLocalStorageStore[key] = value;
    },
    removeItem: (key: string) => {
      delete mockLocalStorageStore[key];
    },
    clear: () => {
      for (const k in mockLocalStorageStore) delete mockLocalStorageStore[k];
    },
  };

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    db = initDatabase(testDbPath);

    // Instantiate backend services
    dashboardService = new StaffDashboardService(db);
    profileService = new StaffProfileService(db);
    attendanceService = new StaffAttendanceService(db);
    leaveService = new StaffLeaveService(db);
    inventoryService = new StaffInventoryService(db);
    posService = new StaffPOSService(db);
    customerService = new StaffCustomerService(db);
    payrollService = new StaffPayrollService(db);
    reportsService = new StaffReportsService(db);
    settingsService = new StaffSettingsService(db);
    notificationService = new StaffNotificationCenterService(db);

    // Setup Roles, Users, Staff
    const roleRes = db.prepare("INSERT INTO roles (name, description) VALUES ('STAFF_TEST', 'Floor Staff')").run();
    roleId = Number(roleRes.lastInsertRowid);

    const passwordHash = bcrypt.hashSync('password123', 10);
    const userRes = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id, is_active)
      VALUES ('arun.sales', ?, 'Arun Kumar', ?, 1)
    `).run(passwordHash, roleId);
    userId = Number(userRes.lastInsertRowid);

    const staffRes = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0013', 'Arun', 'Kumar', '9876543210', 'arun.phase13@texora.shop',
        1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(userId);
    staffId = Number(staffRes.lastInsertRowid);

    // Setup Commission
    db.prepare(`
      INSERT OR IGNORE INTO staff_sales_commissions (staff_id, commission_rate, status)
      VALUES (?, 2.5, 'ACTIVE')
    `).run(staffId);

    // Setup Product & Variant
    const catRes = db.prepare("INSERT INTO categories (name, description) VALUES ('Silk Sarees', 'Traditional Silk Collection')").run();
    const catId = Number(catRes.lastInsertRowid);

    const prodRes = db.prepare(`
      INSERT INTO products (name, category_id, description, is_active)
      VALUES ('Kanchipuram Silk Saree', ?, 'Rich pure silk saree', 1)
    `).run(catId);
    const prodId = Number(prodRes.lastInsertRowid);

    const varRes = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'KPS-RED-01', '8901234567890', 'Free Size', 'Crimson Red', 'Zari Border', 3500.0, 5500.0,
        5, 25, 1
      )
    `).run(prodId);
    variantId = Number(varRes.lastInsertRowid);

    // Set initial active session
    SessionService.setSession({
      userId,
      staffId,
      username: 'arun.sales',
      displayName: 'Arun Kumar',
      roleId,
      roleName: 'STAFF',
      permissions: ['*'],
      token: 'test_token_13',
    });

    // Mock window environment with IPC bridge mapping directly to our backend services
    (global as any).window = {
      localStorage: mockLocalStorage,
      api: {
        staffAuth: {
          login: async () => {
            SessionService.setSession({
              userId,
              staffId,
              username: 'arun.sales',
              displayName: 'Arun Kumar',
              roleId,
              roleName: 'STAFF',
              permissions: ['*'],
              token: 'test_token_13',
            });
            return {
              success: true,
              user: {
                id: userId,
                staffId,
                username: 'arun.sales',
                displayName: 'Arun Kumar',
                roleName: 'STAFF',
                permissions: ['POS_VIEW', 'POS_CREATE_SALE', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'INVENTORY_VIEW', 'PROFILE_VIEW'],
              },
            };
          },
          logout: async () => {
            SessionService.clearSession();
            return { success: true };
          },
          getCurrentStaffUser: async () => ({
            id: userId,
            staffId,
            username: 'arun.sales',
            displayName: 'Arun Kumar',
            roleName: 'STAFF',
            permissions: ['POS_VIEW', 'POS_CREATE_SALE', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'INVENTORY_VIEW', 'PROFILE_VIEW'],
          }),
        },
        staffDashboard: {
          getDashboardSummary: async () => {
            try {
              return { success: true, data: dashboardService.getDashboardSummary(staffId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffProfile: {
          getMyProfile: async () => {
            try {
              return { success: true, data: profileService.getMyProfile() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          updateMyProfile: async (fields: any) => {
            try {
              return profileService.updateMyProfile(fields);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffAttendance: {
          getToday: async () => {
            try {
              return { success: true, data: attendanceService.getTodayAttendance() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          checkIn: async (customTime?: string) => {
            try {
              return attendanceService.checkIn(customTime);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          checkOut: async (customTime?: string) => {
            try {
              return attendanceService.checkOut(customTime);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getHistory: async (filter?: any) => {
            try {
              return { success: true, data: attendanceService.getAttendanceHistory({ month: filter?.month || filter?.monthStr }) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffLeave: {
          apply: async (input: any) => {
            try {
              return leaveService.applyLeave(input);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getRequests: async (filters?: any) => {
            try {
              return { success: true, data: leaveService.getLeaveRequests(filters) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          cancel: async (id: number) => {
            try {
              return leaveService.cancelLeave(id);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffInventory: {
          searchProducts: async (query: string, filters?: any) => {
            try {
              return { success: true, data: inventoryService.searchProducts(query, filters) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getProduct: async (vId: number) => {
            try {
              return { success: true, data: inventoryService.getProductDetails(vId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getLowStock: async () => {
            try {
              return { success: true, data: inventoryService.getLowStockItems() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getHistory: async () => {
            try {
              return { success: true, data: inventoryService.getStockMovementHistory() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          submitCount: async (input: any) => {
            try {
              return inventoryService.submitStockCount({
                product_variant_id: input.product_variant_id || input.productVariantId || input.variantId,
                physical_quantity: input.physical_quantity || input.physicalQuantity || input.physicalCount,
                reason: input.reason || input.notes || 'Audit count',
                location_name: input.location_name || input.locationName || 'Main Shop',
              });
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          createTransfer: async (input: any) => {
            try {
              return inventoryService.createTransferRequest({
                product_variant_id: input.product_variant_id || input.productVariantId || input.variantId || (input.items?.[0]?.variantId) || 1,
                from_location: input.from_location || input.sourceLocation || 'Main Shop',
                to_location: input.to_location || input.destinationLocation || 'Branch 2',
                quantity: input.quantity || (input.items?.[0]?.quantity) || 1,
                reason: input.reason || 'Restock',
              });
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffPOS: {
          searchProducts: async (query?: string, cId?: number) => {
            try {
              return { success: true, data: posService.searchProducts(query, cId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getByBarcode: async (barcode: string) => {
            try {
              return { success: true, data: posService.getProductByBarcode(barcode) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          completeSale: async (input: any) => {
            try {
              return { success: true, data: posService.completeSale(input) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          holdSale: async (input: any) => {
            try {
              return posService.holdSale(input);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getHeldSales: async () => {
            try {
              return { success: true, data: posService.getHeldSales() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          resumeSale: async (heldId: number) => {
            try {
              return { success: true, data: posService.resumeSale(heldId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          cancelHeldSale: async (heldId: number) => {
            try {
              return posService.cancelHeldSale(heldId);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getMySales: async (filters?: any) => {
            try {
              return { success: true, data: posService.getMySales(filters) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          createReturn: async (input: any) => {
            try {
              return posService.createReturnRequest(input);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffCustomer: {
          search: async (query?: string, filters?: any) => {
            try {
              return { success: true, data: customerService.searchCustomers(query, filters) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getDetails: async (cId: number) => {
            try {
              return { success: true, data: customerService.getCustomerDetails(cId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          create: async (input: any) => {
            try {
              return { success: true, data: customerService.createCustomer(input) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          update: async (cId: number, input: any) => {
            try {
              return { success: true, data: customerService.updateCustomer(cId, input) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          purchases: async (cId: number) => {
            try {
              return { success: true, data: customerService.getCustomerPurchaseHistory(cId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          returns: async (cId: number) => {
            try {
              return { success: true, data: customerService.getCustomerReturns(cId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          loyalty: async (cId: number) => {
            try {
              return { success: true, data: customerService.getCustomerLoyalty(cId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          addNote: async (cId: number, note: string) => {
            try {
              return { success: true, data: customerService.addCustomerNote(cId, note) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffPayroll: {
          getSalaryOverview: async () => {
            try {
              return { success: true, data: payrollService.getCurrentPayroll() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getDetails: async (recordId: number) => {
            try {
              return { success: true, data: payrollService.getPayslipDetails(recordId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getHistory: async () => {
            try {
              return { success: true, data: payrollService.getPayrollHistory() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffReports: {
          sales: async (sId: number, filters?: any) => {
            try {
              return { success: true, data: reportsService.getStaffSalesReport(sId || staffId, filters) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          attendance: async (sId: number, monthYear?: string) => {
            try {
              return { success: true, data: reportsService.getStaffAttendanceReport(sId || staffId, monthYear) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          commission: async (sId: number, period?: string) => {
            try {
              return { success: true, data: reportsService.getStaffCommissionReport(sId || staffId, period) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          inventoryTasks: async (sId: number) => {
            try {
              return { success: true, data: reportsService.getStaffInventoryTasksReport(sId || staffId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffSettings: {
          getPreferences: async (sId?: number) => {
            try {
              return { success: true, data: settingsService.getStaffPreferences(sId || staffId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          updatePreferences: async (sId: number, prefs: any) => {
            try {
              return { success: true, data: settingsService.updateStaffPreferences(sId || staffId, prefs) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getPrinters: async () => {
            try {
              return { success: true, data: settingsService.getAvailablePrinters() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          testPrint: async (name: string, type: string) => {
            try {
              return { success: true, data: settingsService.testPrint(name, type) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          updatePassword: async (uId: number, oldP: string, newP: string) => {
            try {
              return settingsService.updateStaffPassword(uId || userId, oldP, newP);
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          getVersion: async () => {
            try {
              return { success: true, data: settingsService.getAppVersionInfo() };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
        staffNotificationCenter: {
          getAll: async (sId: number, filters?: any) => {
            try {
              return { success: true, data: notificationService.getNotifications(sId || staffId, filters) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          markRead: async (id: number, sId?: number) => {
            try {
              return { success: true, data: notificationService.markAsRead(id, sId || staffId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
          markAllRead: async (sId?: number) => {
            try {
              return { success: true, data: notificationService.markAllAsRead(sId || staffId) };
            } catch (err: any) {
              return { success: false, error: err.message };
            }
          },
        },
      },
    };
    (global as any).localStorage = mockLocalStorage;
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Authentication Page Flow & Session Hydration', async () => {
    StorageManager.clearSession();
    expect(StorageManager.isAuthenticated()).toBe(false);

    const loginRes = await authApi.login({ username: 'arun.sales', password: 'password123' });
    expect(loginRes.success).toBe(true);
    expect(loginRes.data?.user.username).toBe('arun.sales');
    expect(StorageManager.isAuthenticated()).toBe(true);

    const meRes = await authApi.getCurrentUser();
    expect(meRes.success).toBe(true);
    expect(meRes.data?.name).toBe('Arun Kumar');
    expect(hasPermission(meRes.data?.permissions, PERMISSIONS.POS_CREATE_SALE)).toBe(true);
  });

  it('Test 2: Dashboard Real Data Integration', async () => {
    const dashRes = await staffApi.getDashboard();
    expect(dashRes).toBeDefined();
    expect(dashRes.success).toBe(true);
    expect(dashRes.data?.staff.fullName).toBe('Arun Kumar');
  });

  it('Test 3: Staff & Profile Page Integration', async () => {
    const profRes = await staffApi.getProfile();
    expect(profRes.success).toBe(true);
    expect(profRes.data?.firstName).toBe('Arun');

    const updateRes = await staffApi.updateProfile({ phone: '9988776655' });
    expect(updateRes.success).toBe(true);

    const checkRes = await staffApi.getProfile();
    expect(checkRes.data?.phone).toBe('9988776655');
  });

  it('Test 4: Attendance Page Integration & Duplicate Prevention', async () => {
    // 1. Initial status
    const initialToday = await attendanceApi.getToday();
    expect(initialToday.success).toBe(true);

    // 2. Clock in
    const checkInRes = await attendanceApi.checkIn();
    expect(checkInRes.success).toBe(true);

    // 3. Prevent duplicate check-in
    const dupCheckIn = await attendanceApi.checkIn();
    expect(dupCheckIn.success).toBe(false);

    // 4. Clock out
    const checkOutRes = await attendanceApi.checkOut();
    expect(checkOutRes.success).toBe(true);

    // 5. History records
    const histRes = await attendanceApi.getMyAttendance();
    expect(histRes.success).toBe(true);
    expect(Array.isArray(histRes.data)).toBe(true);
  });

  it('Test 5: Leave Management Page Integration', async () => {
    const applyRes = await leaveApi.createRequest({
      leaveTypeId: 1,
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      reason: 'Family function attendance',
    });
    expect(applyRes.success).toBe(true);

    const listRes = await leaveApi.getMyRequests();
    expect(listRes.success).toBe(true);
    expect(listRes.data?.length).toBeGreaterThan(0);

    const cancelRes = await leaveApi.cancelRequest(listRes.data![0].id);
    expect(cancelRes.success).toBe(true);
  });

  it('Test 6: Inventory Operations Page Integration', async () => {
    const invRes = await inventoryApi.getInventory({ query: 'Kanchipuram' });
    expect(invRes.success).toBe(true);
    expect(invRes.data?.length).toBe(1);
    expect(invRes.data![0].sku).toBe('KPS-RED-01');

    const countRes = await inventoryApi.createStockCount({
      variantId,
      physicalCount: 26,
      notes: 'Audit adjustment +1 unit found',
    });
    expect(countRes.success).toBe(true);

    const transferRes = await inventoryApi.createTransferRequest({
      sourceLocation: 'Floor Section A',
      destinationLocation: 'Floor Section B',
      items: [{ variantId, quantity: 2 }],
      reason: 'Display rack replenishment',
    });
    expect(transferRes.success).toBe(true);
  });

  it('Test 7: Products & Barcode Scanning Integration', async () => {
    const prodRes = await productApi.searchProducts('Kanchipuram');
    expect(prodRes.success).toBe(true);
    expect(prodRes.data?.length).toBeGreaterThan(0);

    const barcodeRes = await productApi.getBarcodeProduct('8901234567890');
    expect(barcodeRes).toBeDefined();
    expect(barcodeRes.success).toBe(true);
  });

  it('Test 8: Customer Management Page Integration', async () => {
    const createRes = await customerApi.createCustomer({
      name: 'Venkatesh Raman',
      phone: '9840123456',
      email: 'venkat@example.com',
      city: 'Chennai',
    });
    expect(createRes.success).toBe(true);
    expect(createRes.data?.name).toBe('Venkatesh Raman');
    customerId = createRes.data!.id;

    const searchRes = await customerApi.searchCustomers('9840123456');
    expect(searchRes.success).toBe(true);
    expect(searchRes.data?.length).toBe(1);

    const noteRes = await customerApi.addNote(customerId, 'Prefers pure silk sarees with traditional zari border.');
    expect(noteRes.success).toBe(true);

    const loyaltyRes = await customerApi.getLoyalty(customerId);
    expect(loyaltyRes.success).toBe(true);
  });

  it('Test 9: POS & Checkout Flow with Atomic Deduction', async () => {
    const salePayload = {
      customerId,
      items: [{ variantId, quantity: 2, unitPrice: 5500.0, discount: 0 }],
      payments: [{ method: 'UPI' as const, amount: 11000.0, referenceNumber: 'UPI778899' }],
      discountAmount: 0,
      notes: 'Festive purchase',
    };

    const saleRes = await salesApi.createSale(salePayload);
    expect(saleRes.success).toBe(true);
    expect(saleRes.data?.invoiceNumber).toBeDefined();
    expect(saleRes.data?.total).toBe(11000.0);

    // Stock verification
    const stockAfter = await inventoryApi.getProductStock(variantId);
    expect(stockAfter.success).toBe(true);
    expect(stockAfter.data?.currentStock).toBeLessThanOrEqual(24);
  });

  it('Test 10: Held Sales Cart Parking Lifecycle', async () => {
    const holdRes = await salesApi.holdSale({
      referenceName: 'Customer browsing more sarees',
      cartData: {
        items: [{ variantId, quantity: 1, unitPrice: 5500.0 }],
      },
    });
    expect(holdRes.success).toBe(true);

    const heldList = await salesApi.getHeldSales();
    expect(heldList.success).toBe(true);
    expect(heldList.data?.length).toBeGreaterThan(0);

    const heldId = heldList.data![0].id;
    const resumeRes = await salesApi.resumeSale(heldId);
    expect(resumeRes.success).toBe(true);

    const cancelRes = await salesApi.cancelSale(heldId);
    expect(cancelRes.success).toBe(true);
  });

  it('Test 11: Sales Return Lifecycle & Stock Restoration', async () => {
    const mySales = await salesApi.getMySales({ period: 'ALL' });
    expect(mySales.success).toBe(true);
    expect(mySales.data?.recentSales?.length).toBeGreaterThan(0);

    const latestSale = mySales.data.recentSales[0];
    const saleItemRow = db.prepare('SELECT id, product_variant_id, unit_price FROM sale_items WHERE sale_id = ?').get(latestSale.id) as any;

    const returnRes = await salesApi.createReturn({
      saleId: latestSale.id,
      reason: 'Customer requested color exchange',
      items: [
        {
          saleItemId: saleItemRow.id,
          variantId: saleItemRow.product_variant_id,
          quantity: 1,
          refundAmount: saleItemRow.unit_price,
          condition: 'GOOD',
          reason: 'COLOR_EXCHANGE',
        },
      ],
    });
    expect(returnRes.success).toBe(true);
  });

  it('Test 12: Payroll & Payslip Access', async () => {
    const payRes = await payrollApi.getMyPayroll();
    expect(payRes.success).toBe(true);

    const histRes = await payrollApi.getPayrollHistory();
    expect(histRes.success).toBe(true);
  });

  it('Test 13: Notification Center Integration', async () => {
    const notifRes = await notificationApi.getNotifications();
    expect(notifRes.success).toBe(true);

    const markAllRes = await notificationApi.markAllAsRead();
    expect(markAllRes.success).toBe(true);
  });

  it('Test 14: Personal Reporting Page Integration', async () => {
    const salesRep = await reportApi.getMySales({ period: 'TODAY' });
    expect(salesRep.success).toBe(true);
    expect(salesRep.data?.totalSalesVolume).toBeDefined();

    const attRep = await reportApi.getMyAttendance('2026-08');
    expect(attRep.success).toBe(true);

    const commRep = await reportApi.getMyCommission('2026-08');
    expect(commRep.success).toBe(true);
  });

  it('Test 15: Settings & Hardware Integration', async () => {
    const prefsRes = await settingsApi.getSettings();
    expect(prefsRes.success).toBe(true);

    const updatePrefs = await settingsApi.updateSettings({
      defaultPaymentMethod: 'UPI',
      autoPrintReceipt: true,
    });
    expect(updatePrefs.success).toBe(true);

    const printersRes = await settingsApi.getPrinterSettings();
    expect(printersRes.success).toBe(true);
    expect(printersRes.data?.length).toBeGreaterThan(0);

    const testPrintRes = await settingsApi.testPrint('EPSON TM-T82 Thermal', 'RECEIPT');
    expect(testPrintRes.success).toBe(true);
  });
});
