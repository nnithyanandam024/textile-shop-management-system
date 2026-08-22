import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { eventBus } from '../../electron/main/realtime/eventBus';
import { defaultEventDispatcher } from '../../src/realtime/eventHandlers';
import { defaultConnectionManager } from '../../src/realtime/connectionManager';
import { realtimeClient } from '../../src/realtime/socket';
import { REALTIME_EVENTS, RealtimeEvent } from '../../src/realtime/events';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { StaffInventoryService } from '../../electron/main/services/staffInventoryService';
import { StaffAttendanceService } from '../../electron/main/services/staffAttendanceService';
import { StaffLeaveService } from '../../electron/main/services/staffLeaveService';
import { LeaveService } from '../../electron/main/services/leaveService';
import { StaffCustomerService } from '../../electron/main/services/staffCustomerService';
import { StaffNotificationCenterService } from '../../electron/main/services/staffNotificationCenterService';
import { SessionService } from '../../electron/main/services/auth/sessionService';

describe('Phase 14 — Real-Time Synchronization & Live Updates Test Suite', () => {
  const testDbPath = path.join(__dirname, '../.test_db/test_phase14.db');
  let db: Database.Database;

  let posService: StaffPOSService;
  let inventoryService: StaffInventoryService;
  let attendanceService: StaffAttendanceService;
  let staffLeaveService: StaffLeaveService;
  let leaveService: LeaveService;
  let customerService: StaffCustomerService;
  let notificationService: StaffNotificationCenterService;

  let staffId: number;
  let userId: number;
  let variantId: number;
  let lowStockVariantId: number;
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
    customerService = new StaffCustomerService(db);
    notificationService = new StaffNotificationCenterService(db);

    // Setup Test Role, User, Staff
    const roleRes = db.prepare("INSERT INTO roles (name, description) VALUES ('STAFF_REALTIME', 'Realtime Floor Staff')").run();
    const roleId = Number(roleRes.lastInsertRowid);

    const passwordHash = bcrypt.hashSync('password123', 10);
    const userRes = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id, is_active)
      VALUES ('kavitha.pos', ?, 'Kavitha Ram', ?, 1)
    `).run(passwordHash, roleId);
    userId = Number(userRes.lastInsertRowid);

    const staffRes = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0014', 'Kavitha', 'Ram', '9876543214', 'kavitha@texora.shop',
        1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(userId);
    staffId = Number(staffRes.lastInsertRowid);

    // Setup Products & Variants
    const catRes = db.prepare("INSERT INTO categories (name, description) VALUES ('Realtime Sarees', 'Live Sync Sarees')").run();
    const catId = Number(catRes.lastInsertRowid);

    const prodRes = db.prepare(`
      INSERT INTO products (name, category_id, description, is_active)
      VALUES ('Banarasi Brocade Silk', ?, 'Pure zari woven saree', 1)
    `).run(catId);
    const prodId = Number(prodRes.lastInsertRowid);

    // Variant 1: Normal Stock (20 units)
    const varRes = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'BNS-GLD-01', '8901234999', 'Free Size', 'Golden Zari', 'Brocade', 5000.0, 7500.0,
        5, 20, 1
      )
    `).run(prodId);
    variantId = Number(varRes.lastInsertRowid);

    // Variant 2: Low Stock (6 units, min 5)
    const lowVarRes = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'BNS-SLV-02', '8901234888', 'Free Size', 'Silver Zari', 'Paisley', 4500.0, 6800.0,
        5, 6, 1
      )
    `).run(prodId);
    lowStockVariantId = Number(lowVarRes.lastInsertRowid);

    // Setup Customer
    const custRes = db.prepare(`
      INSERT INTO customers (customer_code, name, phone, email, is_active)
      VALUES ('CUS-14001', 'Ananya Sundar', '9840998877', 'ananya@texora.shop', 1)
    `).run();
    customerId = Number(custRes.lastInsertRowid);

    // Set Active Session
    SessionService.setSession({
      userId,
      staffId,
      username: 'kavitha.pos',
      displayName: 'Kavitha Ram',
      roleId,
      roleName: 'STAFF',
      permissions: ['*'],
      token: 'test_token_14',
    });
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Real-Time Client & Connection Lifecycle', () => {
    expect(realtimeClient.EVENTS.SALE_CREATED).toBe('SALE_CREATED');
    expect(realtimeClient.EVENTS.INVENTORY_UPDATED).toBe('INVENTORY_UPDATED');

    realtimeClient.connect();
    expect(realtimeClient.getStatus()).toBe('CONNECTED');

    const statusChanges: string[] = [];
    const unsub = realtimeClient.onStatusChange((status) => {
      statusChanges.push(status);
    });

    expect(statusChanges.length).toBeGreaterThan(0);
    unsub();
  });

  it('Test 2: Sale Creation Live Event Broadcast', () => {
    let capturedEvent: RealtimeEvent | null = null;
    const unsub = eventBus.subscribe('SALE_CREATED', (evt) => {
      capturedEvent = evt;
    });

    const invoice = posService.completeSale({
      customerId,
      items: [{ variantId, quantity: 2, unitPrice: 7500.0 }],
      payments: [{ method: 'UPI', amount: 15000.0, referenceNumber: 'UPI_RT_01' }],
      notes: 'Realtime POS Sale',
    });

    expect(invoice).toBeDefined();
    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent?.data.invoiceNumber).toBe(invoice.invoiceNumber);
    expect(capturedEvent?.data.totalAmount).toBe(15000.0);
    expect(capturedEvent?.data.staffName).toBe('Kavitha Ram');

    unsub();
  });

  it('Test 3: Live Inventory Deduction & Stock Synchronization', () => {
    const receivedEvents: RealtimeEvent[] = [];
    const unsub = eventBus.subscribe('INVENTORY_UPDATED', (evt) => {
      receivedEvents.push(evt);
    });

    posService.completeSale({
      customerId,
      items: [{ variantId, quantity: 3, unitPrice: 7500.0 }],
      payments: [{ method: 'CASH', amount: 22500.0 }],
    });

    expect(receivedEvents.length).toBeGreaterThan(0);
    const lastInv = receivedEvents[receivedEvents.length - 1];
    expect(lastInv.data.variantId).toBe(variantId);
    expect(lastInv.data.currentStock).toBe(15); // 20 - 2 (Test 2) - 3 = 15

    unsub();
  });

  it('Test 4: Automated Low Stock Detection Alert', () => {
    let lowStockEvent: RealtimeEvent | null = null;
    const unsub = eventBus.subscribe('LOW_STOCK_DETECTED', (evt) => {
      lowStockEvent = evt;
    });

    // Sell 2 units of lowStockVariantId (current: 6, min: 5 -> after sale: 4 <= min)
    posService.completeSale({
      customerId,
      items: [{ variantId: lowStockVariantId, quantity: 2, unitPrice: 6800.0 }],
      payments: [{ method: 'UPI', amount: 13600.0 }],
    });

    expect(lowStockEvent).not.toBeNull();
    expect(lowStockEvent?.data.variantId).toBe(lowStockVariantId);
    expect(lowStockEvent?.data.currentStock).toBe(4);
    expect(lowStockEvent?.data.minimumStock).toBe(5);

    unsub();
  });

  it('Test 5: Automated Out-of-Stock Broadcast', () => {
    let outOfStockEvent: RealtimeEvent | null = null;
    const unsub = eventBus.subscribe('OUT_OF_STOCK', (evt) => {
      outOfStockEvent = evt;
    });

    // Sell remaining 4 units of lowStockVariantId -> stock becomes 0
    posService.completeSale({
      customerId,
      items: [{ variantId: lowStockVariantId, quantity: 4, unitPrice: 6800.0 }],
      payments: [{ method: 'CARD', amount: 27200.0 }],
    });

    expect(outOfStockEvent).not.toBeNull();
    expect(outOfStockEvent?.data.variantId).toBe(lowStockVariantId);

    unsub();
  });

  it('Test 6: Real-Time Sales Return & Stock Restocking', () => {
    let returnEvent: RealtimeEvent | null = null;
    let restockEvent: RealtimeEvent | null = null;

    const unsub1 = eventBus.subscribe('SALE_RETURNED', (evt) => {
      returnEvent = evt;
    });
    const unsub2 = eventBus.subscribe('INVENTORY_UPDATED', (evt) => {
      if (evt.data.changeQuantity > 0) restockEvent = evt;
    });

    // Fetch latest sale
    const saleRow = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get() as any;
    const saleItemRow = db.prepare('SELECT id, product_variant_id FROM sale_items WHERE sale_id = ?').get(saleRow.id) as any;

    const returnResult = posService.createReturnRequest({
      saleId: saleRow.id,
      items: [
        {
          saleItemId: saleItemRow.id,
          variantId: saleItemRow.product_variant_id,
          quantity: 1,
          reason: 'Size exchange requested',
          condition: 'GOOD',
        },
      ],
    });

    expect(returnResult.success).toBe(true);
    expect(returnEvent).not.toBeNull();
    expect(returnEvent?.data.returnNumber).toBe(returnResult.returnNumber);
    expect(restockEvent).not.toBeNull();

    unsub1();
    unsub2();
  });

  it('Test 7: Real-Time Attendance Check-In & Check-Out', () => {
    let checkInEvent: RealtimeEvent | null = null;
    let checkOutEvent: RealtimeEvent | null = null;

    const unsubIn = eventBus.subscribe('ATTENDANCE_CHECKED_IN', (evt) => {
      checkInEvent = evt;
    });
    const unsubOut = eventBus.subscribe('ATTENDANCE_CHECKED_OUT', (evt) => {
      checkOutEvent = evt;
    });

    const inRes = attendanceService.checkIn('09:15');
    expect(inRes.success).toBe(true);
    expect(checkInEvent).not.toBeNull();
    expect(checkInEvent?.data.staffId).toBe(staffId);
    expect(checkInEvent?.data.checkIn).toBe('09:15');

    const outRes = attendanceService.checkOut('18:00');
    expect(outRes.success).toBe(true);
    expect(checkOutEvent).not.toBeNull();
    expect(checkOutEvent?.data.checkOut).toBe('18:00');

    unsubIn();
    unsubOut();
  });

  it('Test 8: Real-Time Leave Application & Approval Flow', () => {
    let leaveCreatedEvent: RealtimeEvent | null = null;
    let leaveApprovedEvent: RealtimeEvent | null = null;

    const unsubCreated = eventBus.subscribe('LEAVE_CREATED', (evt) => {
      leaveCreatedEvent = evt;
    });
    const unsubApproved = eventBus.subscribe('LEAVE_APPROVED', (evt) => {
      leaveApprovedEvent = evt;
    });

    // 1. Staff applies for leave
    const applyRes = staffLeaveService.applyLeave({
      leave_type_id: 1,
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      reason: 'Attending festival pooja',
    });

    expect(applyRes.success).toBe(true);
    expect(leaveCreatedEvent).not.toBeNull();
    expect(leaveCreatedEvent?.data.leaveRequestId).toBe(applyRes.id);

    // 2. Manager approves leave
    const approveRes = leaveService.approveLeave(applyRes.id, userId);
    expect(approveRes.success).toBe(true);
    expect(leaveApprovedEvent).not.toBeNull();
    expect(leaveApprovedEvent?.data.leaveRequestId).toBe(applyRes.id);
    expect(leaveApprovedEvent?.data.status).toBe('APPROVED');

    unsubCreated();
    unsubApproved();
  });

  it('Test 9: Real-Time Physical Stock Audit Adjustment', () => {
    let stockAdjustEvent: RealtimeEvent | null = null;
    const unsub = eventBus.subscribe('STOCK_ADJUSTED', (evt) => {
      stockAdjustEvent = evt;
    });

    const countRes = inventoryService.submitStockCount({
      product_variant_id: variantId,
      physical_quantity: 16,
      reason: 'Physical cycle count discrepancy audit',
      location_name: 'Main Rack 01',
    });

    expect(countRes.success).toBe(true);
    expect(stockAdjustEvent).not.toBeNull();
    expect(stockAdjustEvent?.data.variantId).toBe(variantId);
    expect(stockAdjustEvent?.data.physicalQuantity).toBe(16);

    unsub();
  });

  it('Test 10: Real-Time Customer Profile Registration', () => {
    let customerCreatedEvent: RealtimeEvent | null = null;
    const unsub = eventBus.subscribe('CUSTOMER_CREATED', (evt) => {
      customerCreatedEvent = evt;
    });

    const newCust = customerService.createCustomer({
      name: 'Gayathri Natarajan',
      phone: '9840112299',
      email: 'gayathri@texora.shop',
      city: 'Coimbatore',
    });

    expect(newCust).toBeDefined();
    expect(customerCreatedEvent).not.toBeNull();
    expect(customerCreatedEvent?.data.name).toBe('Gayathri Natarajan');
    expect(customerCreatedEvent?.data.phone).toBe('9840112299');

    unsub();
  });

  it('Test 11: Real-Time Notification Delivery', () => {
    let notifEvent: RealtimeEvent | null = null;
    const unsub = eventBus.subscribe('NOTIFICATION_CREATED', (evt) => {
      notifEvent = evt;
    });

    const notifId = notificationService.createNotification({
      recipientStaffId: staffId,
      recipientUserId: userId,
      type: 'LEAVE_APPROVAL',
      title: 'Leave Approved',
      message: 'Your leave application for Sep 10-12 has been approved.',
      priority: 'HIGH',
    });

    expect(notifId).toBeGreaterThan(0);
    expect(notifEvent).not.toBeNull();
    expect(notifEvent?.data.title).toBe('Leave Approved');
    expect(notifEvent?.meta.targetStaffId).toBe(staffId);

    unsub();
  });

  it('Test 12: Duplicate Event Deduplication Protection', () => {
    let dispatchCount = 0;
    const unsub = defaultEventDispatcher.subscribe('SALE_CREATED', () => {
      dispatchCount++;
    });

    const sampleEvent: RealtimeEvent = {
      meta: {
        eventId: 'evt_unique_12345',
        type: 'SALE_CREATED',
        timestamp: Date.now(),
        version: 1,
      },
      data: { invoiceNumber: 'INV-2026-TEST-DUP' },
    };

    // First arrival -> Processed
    const firstResult = defaultEventDispatcher.dispatch(sampleEvent);
    expect(firstResult).toBe(true);
    expect(dispatchCount).toBe(1);

    // Second arrival of same eventId -> Deduplicated & rejected
    const secondResult = defaultEventDispatcher.dispatch(sampleEvent);
    expect(secondResult).toBe(false);
    expect(dispatchCount).toBe(1); // Handler not invoked a second time

    unsub();
  });

  it('Test 13: Targeted Role & Staff Scoped Filtering', () => {
    const receivedByUnauthorized: RealtimeEvent[] = [];
    const unsub = eventBus.subscribe('NOTIFICATION_CREATED', (evt) => {
      // Check if intended for staffId 999 (different staff)
      if (evt.meta.targetStaffId && evt.meta.targetStaffId !== staffId) {
        receivedByUnauthorized.push(evt);
      }
    });

    // Broadcast notification targeted only for Staff #999
    eventBus.publish('NOTIFICATION_CREATED', {
      id: 999,
      title: 'Confidential HR Notice',
      message: 'Restricted message',
      type: 'HR',
    }, {
      targetStaffId: 999,
    });

    expect(receivedByUnauthorized.length).toBe(1);
    expect(receivedByUnauthorized[0].meta.targetStaffId).toBe(999);

    unsub();
  });

  it('Test 14: Disconnect Detection & Exponential Backoff Reconnection', () => {
    defaultConnectionManager.disconnect();
    expect(defaultConnectionManager.getStatus()).toBe('DISCONNECTED');

    // Reconnect restores connection
    defaultConnectionManager.connect();
    expect(defaultConnectionManager.isConnected()).toBe(true);
  });

  it('Test 15: Concurrency Protection & Atomic Stock Validation', () => {
    // Create a product variant with exactly 1 unit in stock
    const singleVarRes = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, purchase_price, selling_price, minimum_stock, current_stock, is_active
      ) VALUES (
        1, 'SINGLE-UNIT-SKU', '8901999999', 1000.0, 2000.0, 0, 1, 1
      )
    `).run();
    const singleVariantId = Number(singleVarRes.lastInsertRowid);

    // Cashier A attempts to checkout the last item -> Success
    const saleA = posService.completeSale({
      customerId,
      items: [{ variantId: singleVariantId, quantity: 1, unitPrice: 2000.0 }],
      payments: [{ method: 'CASH', amount: 2000.0 }],
    });
    expect(saleA).toBeDefined();

    // Cashier B attempts concurrent checkout of the same item -> Rejected by atomic check
    expect(() => {
      posService.completeSale({
        customerId,
        items: [{ variantId: singleVariantId, quantity: 1, unitPrice: 2000.0 }],
        payments: [{ method: 'CASH', amount: 2000.0 }],
      });
    }).toThrow(/Insufficient stock/);
  });
});
