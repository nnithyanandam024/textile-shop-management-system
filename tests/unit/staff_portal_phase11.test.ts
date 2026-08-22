import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffReportsService } from '../../electron/main/services/staffReportsService';
import { StaffSettingsService } from '../../electron/main/services/staffSettingsService';
import { StaffNotificationCenterService } from '../../electron/main/services/staffNotificationCenterService';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { SessionService } from '../../electron/main/services/auth/sessionService';

describe('Staff Portal — Phase 11 Test Suite (Production, Reports & Final Integration)', () => {
  const testDbPath = path.join(__dirname, '../../test_phase11.db');
  let db: Database.Database;

  let reportsService: StaffReportsService;
  let settingsService: StaffSettingsService;
  let notificationService: StaffNotificationCenterService;
  let posService: StaffPOSService;

  let staffId: number;
  let userId: number;
  let variantId: number;
  let customerId: number;

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    db = initDatabase(testDbPath);
    reportsService = new StaffReportsService(db);
    settingsService = new StaffSettingsService(db);
    notificationService = new StaffNotificationCenterService(db);
    posService = new StaffPOSService(db);

    // Setup Roles, Users, Staff
    const roleRes = db.prepare("INSERT INTO roles (name, description) VALUES ('STAFF_TEST', 'Floor Staff')").run();
    const roleId = Number(roleRes.lastInsertRowid);

    const passwordHash = bcrypt.hashSync('password123', 10);
    const userRes = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun.sales', ?, 'Arun Kumar', ?)
    `).run(passwordHash, roleId);
    userId = Number(userRes.lastInsertRowid);

    const staffRes = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0011', 'Arun', 'Kumar', '9876543210', 'arun.phase11@texora.shop',
        1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(userId);
    staffId = Number(staffRes.lastInsertRowid);

    // Setup Commission
    db.prepare(`
      INSERT INTO staff_sales_commissions (staff_id, commission_rate, status)
      VALUES (?, 2.0, 'ACTIVE')
    `).run(staffId);

    // Setup Products & Variants
    const catRes = db.prepare("INSERT INTO categories (name, description) VALUES ('Phase11 Sarees', 'Silk Collection')").run();
    const catId = Number(catRes.lastInsertRowid);

    const prodRes = db.prepare(`
      INSERT INTO products (name, category_id, description, is_active)
      VALUES ('Dharmavaram Pure Pattu', ?, 'Rich silk saree', 1)
    `).run(catId);
    const prodId = Number(prodRes.lastInsertRowid);

    const varRes = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SKU-DHM-01', '8901234111', 'Free Size', 'Royal Maroon', 'Temple Border', 4000, 6000,
        2, 25, 1
      )
    `).run(prodId);
    variantId = Number(varRes.lastInsertRowid);

    // Setup Customer
    const custRes = db.prepare(`
      INSERT INTO customers (customer_code, name, phone, email, is_active)
      VALUES ('CUST-11001', 'Meenakshi Sundaram', '9840112233', 'meena@texora.shop', 1)
    `).run();
    customerId = Number(custRes.lastInsertRowid);

    // Set Session
    SessionService.setSession({
      userId,
      username: 'arun.sales',
      displayName: 'Arun Kumar',
      roleId,
      roleName: 'STAFF_TEST',
      permissions: ['staff.pos', 'staff.reports', 'staff.settings'],
      staffId,
    });
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Staff Reports Sales Performance Aggregation & Period Filtering', () => {
    // Complete 2 sales
    posService.completeSale({
      customerId,
      items: [{ variantId, quantity: 2, unitPrice: 6000 }],
      payments: [{ method: 'CASH', amount: 12000 }],
    });

    posService.completeSale({
      customerId,
      items: [{ variantId, quantity: 1, unitPrice: 6000 }],
      payments: [{ method: 'UPI', amount: 6000, referenceNumber: 'UPI998877' }],
    });

    const report = reportsService.getStaffSalesReport(staffId, { period: 'TODAY' });
    expect(report.totalSalesVolume).toBe(18000);
    expect(report.totalOrdersCount).toBe(2);
    expect(report.totalItemsSold).toBe(3);
    expect(report.averageOrderValue).toBe(9000);
    expect(report.recentSales.length).toBe(2);
  });

  it('Test 2: Tender Mode Breakdown & Product Performance Calculation', () => {
    const report = reportsService.getStaffSalesReport(staffId, { period: 'TODAY' });
    expect(report.tenderBreakdown.length).toBe(2);

    const cashTender = report.tenderBreakdown.find((t) => t.method === 'CASH');
    const upiTender = report.tenderBreakdown.find((t) => t.method === 'UPI');

    expect(cashTender).toBeDefined();
    expect(cashTender?.amount).toBe(12000);
    expect(cashTender?.percentage).toBe(67);

    expect(upiTender).toBeDefined();
    expect(upiTender?.amount).toBe(6000);
    expect(upiTender?.percentage).toBe(33);

    // Top Products
    expect(report.topProducts.length).toBe(1);
    expect(report.topProducts[0].productName).toBe('Dharmavaram Pure Pattu');
    expect(report.topProducts[0].quantity).toBe(3);
    expect(report.topProducts[0].revenue).toBe(18000);
  });

  it('Test 3: Scoped Staff Attendance & Hours Summary Report', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    db.prepare(`
      INSERT INTO attendance (staff_id, attendance_date, status, check_in, check_out, worked_minutes, late_minutes)
      VALUES (?, ?, 'PRESENT', '09:05:00', '18:00:00', 510, 5)
    `).run(staffId, today);

    db.prepare(`
      INSERT INTO attendance (staff_id, attendance_date, status, check_in, check_out, worked_minutes, late_minutes)
      VALUES (?, ?, 'PRESENT', '09:00:00', '18:00:00', 540, 0)
    `).run(staffId, yesterday);

    const attReport = reportsService.getStaffAttendanceReport(staffId);
    expect(attReport.presentDays).toBe(2);
    expect(attReport.totalWorkedHours).toBe(17.5);
    expect(attReport.averageDailyHours).toBe(8.8);
    expect(attReport.lateArrivals).toBe(1);
    expect(attReport.dailyLogs.length).toBe(2);
  });

  it('Test 4: Staff Commission Earnings & Payout Status Report', () => {
    const commReport = reportsService.getStaffCommissionReport(staffId, 'THIS_MONTH');
    expect(commReport.totalSalesVolume).toBe(18000);
    expect(commReport.commissionRate).toBe(2.0);
    expect(commReport.commissionEarned).toBe(360); // 2% of 18,000 = 360
    expect(commReport.payoutStatus).toBe('PROCESSING');
    expect(commReport.recentCommissionSales.length).toBe(2);
  });

  it('Test 5: Staff Inventory Tasks & Stock Movements Scoped Reporting', () => {
    // Check inventory tasks report
    const invReport = reportsService.getStaffInventoryTasksReport(staffId);
    expect(invReport.stockMovementsHandled).toBeGreaterThanOrEqual(2);
    expect(invReport.recentTransactions.length).toBeGreaterThanOrEqual(2);
    expect(invReport.recentTransactions[0].sku).toBe('SKU-DHM-01');
  });

  it('Test 6: Staff Notification Center Categorized Retrieval & Unread Counts', () => {
    notificationService.createNotification({
      recipientStaffId: staffId,
      type: 'ATTENDANCE',
      title: 'Shift Reminder',
      message: 'Your morning shift starts at 09:00 AM tomorrow.',
      priority: 'NORMAL',
    });

    notificationService.createNotification({
      recipientStaffId: staffId,
      type: 'POS',
      title: 'Daily Sales Milestone',
      message: 'Congratulations! You achieved ₹18,000 in sales today.',
      priority: 'HIGH',
    });

    const summary = notificationService.getNotifications(staffId);
    expect(summary.totalCount).toBe(2);
    expect(summary.unreadCount).toBe(2);
    expect(summary.notifications[0].title).toBe('Daily Sales Milestone');

    // Categorized query
    const attSummary = notificationService.getNotifications(staffId, { category: 'ATTENDANCE' });
    expect(attSummary.totalCount).toBe(1);
    expect(attSummary.notifications[0].type).toBe('ATTENDANCE');
  });

  it('Test 7: Mark Single & Mark All Notifications as Read', () => {
    let summary = notificationService.getNotifications(staffId);
    const firstNotifId = summary.notifications[0].id;

    // Mark single as read
    notificationService.markAsRead(firstNotifId, staffId);
    summary = notificationService.getNotifications(staffId);
    expect(summary.unreadCount).toBe(1);

    // Mark all as read
    notificationService.markAllAsRead(staffId);
    summary = notificationService.getNotifications(staffId);
    expect(summary.unreadCount).toBe(0);
  });

  it('Test 8: Staff POS & Hardware Preferences Persistence (Thermal vs A4 Printers, Scan Sounds)', () => {
    // Default preferences
    let prefs = settingsService.getStaffPreferences(staffId);
    expect(prefs.defaultPaymentMethod).toBe('CASH');
    expect(prefs.autoPrintReceipt).toBe(true);
    expect(prefs.scanSoundEnabled).toBe(true);

    // Update preferences
    prefs = settingsService.updateStaffPreferences(staffId, {
      defaultPaymentMethod: 'UPI',
      autoPrintReceipt: false,
      scanSoundEnabled: true,
      receiptPrinter: 'Star TSP100 Thermal',
      invoicePrinter: 'Canon LBP2900B',
    });

    expect(prefs.defaultPaymentMethod).toBe('UPI');
    expect(prefs.autoPrintReceipt).toBe(false);
    expect(prefs.receiptPrinter).toBe('Star TSP100 Thermal');
    expect(prefs.invoicePrinter).toBe('Canon LBP2900B');
  });

  it('Test 9: Printer Configuration Retrieval & Test Print Generation', () => {
    const printers = settingsService.getAvailablePrinters();
    expect(printers.length).toBeGreaterThanOrEqual(3);

    const thermal = printers.find((p) => p.printerType === 'RECEIPT');
    expect(thermal).toBeDefined();
    expect(thermal?.printerName).toBe('EPSON TM-T82 Thermal');
    expect(thermal?.paperWidth).toBe('80mm');

    // Test print routine
    const testRes = settingsService.testPrint('EPSON TM-T82 Thermal', 'RECEIPT');
    expect(testRes.success).toBe(true);
    expect(testRes.message).toContain('EPSON TM-T82 Thermal');
    expect(testRes.timestamp).toBeDefined();
  });

  it('Test 10: Staff Password Change Security & System About Information Resolution', async () => {
    // Version info
    const version = settingsService.getAppVersionInfo();
    expect(version.version).toBe('1.0.0');
    expect(version.appName).toContain('Texora');
    expect(version.databaseStatus).toBe('CONNECTED');

    // Reject wrong current password (seeded password is 'password123')
    await expect(
      settingsService.updateStaffPassword(userId, 'wrongpassword', 'newsecret123')
    ).rejects.toThrow(/Current password is incorrect/);

    // Reject short password
    await expect(
      settingsService.updateStaffPassword(userId, 'password123', '123')
    ).rejects.toThrow(/at least 6 characters/);

    // Successfully update password
    const pwdRes = await settingsService.updateStaffPassword(userId, 'password123', 'newsecurepass2026');
    expect(pwdRes.success).toBe(true);
  });
});
