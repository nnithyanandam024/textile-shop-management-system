import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffCustomerService } from '../../electron/main/services/staffCustomerService';
import { StaffPOSService } from '../../electron/main/services/staffPOSService';
import { SessionService } from '../../electron/main/services/auth/sessionService';

describe('Staff Portal — Phase 10 Test Suite (Customer Management)', () => {
  let db: Database.Database;
  let customerService: StaffCustomerService;
  let posService: StaffPOSService;
  const testDbPath = path.join(__dirname, '../.test_db/test_staff_portal_phase10.db');

  let staff1Id: number;
  let user1Id: number;
  let variant1Id: number;
  let customer1Id: number;

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    db = initDatabase(testDbPath);
    customerService = new StaffCustomerService(db);
    posService = new StaffPOSService(db);

    // Setup User & Staff Session
    const uRes = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('arun.cust', '$2b$10$cs0yM087j3wvSiH1QUHlUecLA9Z1qWvXGgYxLsmkI40xXW3f', 'Arun Kumar', 3)
    `).run();
    user1Id = Number(uRes.lastInsertRowid);

    const sRes = db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email,
        department_id, designation_id, work_location, joining_date, employment_type, status, user_id
      ) VALUES (
        'STF-0001', 'Arun', 'Kumar', '9876543210', 'arun@texora.shop',
        1, 1, 'Main Store', '2026-01-01', 'FULL_TIME', 'ACTIVE', ?
      )
    `).run(user1Id);
    staff1Id = Number(sRes.lastInsertRowid);

    SessionService.setSession({
      staffId: staff1Id,
      userId: user1Id,
      username: 'arun.cust',
      displayName: 'Arun Kumar',
      roleId: 3,
      roleName: 'STAFF',
      permissions: [],
    });

    // Setup Category & Product
    const catRes = db.prepare("INSERT INTO categories (name, description) VALUES ('Sarees', 'Traditional Silk Sarees')").run();
    const catId = Number(catRes.lastInsertRowid);

    const pRes = db.prepare("INSERT INTO products (name, category_id, description, is_active) VALUES ('Kanchipuram Pure Silk', ?, 'Traditional pure silk', 1)").run(catId);
    const prodId = Number(pRes.lastInsertRowid);

    const vRes = db.prepare(`
      INSERT INTO product_variants (
        product_id, sku, barcode, size, color, pattern, purchase_price, selling_price,
        minimum_stock, current_stock, is_active
      ) VALUES (
        ?, 'SKU-SAR-001', '8901234001', 'Free Size', 'Crimson Red', 'Traditional', 3000, 4400,
        3, 20, 1
      )
    `).run(prodId);
    variant1Id = Number(vRes.lastInsertRowid);

    // Initial Customer Setup
    const created = customerService.createCustomer({
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh@kumar.com',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600017',
      dob: '1985-05-15',
      preferences: {
        preferredCategories: 'Sarees, Silk Kurtis',
        preferredColors: 'Royal Blue, Crimson Red',
        preferredSizes: 'Free Size, L (40)',
      },
      notes: 'Prefers pure silk sarees for festival shopping.',
    });
    customer1Id = created.id;
  });

  afterAll(() => {
    SessionService.clearSession();
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Customer Search across Name, Normalized Mobile (+91), and Customer Code', () => {
    // 1. Search by full name
    const byName = customerService.searchCustomers('Ramesh');
    expect(byName.length).toBe(1);
    expect(byName[0].name).toBe('Ramesh Kumar');

    // 2. Search by mobile with +91 format
    const byPhone = customerService.searchCustomers('+91 98765 43210');
    expect(byPhone.length).toBe(1);
    expect(byPhone[0].phone).toBe('9876543210');

    // 3. Search by partial code
    const byCode = customerService.searchCustomers('CUS-');
    expect(byCode.length).toBeGreaterThanOrEqual(1);
  });

  it('Test 2: Customer Registration & Auto-generated Code + Loyalty Account Setup', () => {
    const newCust = customerService.createCustomer({
      name: 'Priya Sundaram',
      phone: '9840112233',
      email: 'priya@sundaram.org',
      city: 'Coimbatore',
      preferences: {
        preferredCategories: 'Cotton Kurtis',
        preferredColors: 'Pastel Green',
        preferredSizes: 'M (38)',
      },
    });

    expect(newCust.id).toBeDefined();
    expect(newCust.name).toBe('Priya Sundaram');
    expect(newCust.customerCode).toMatch(/^CUS-\d{5}$/);
    expect(newCust.loyaltyPoints).toBe(0);
    expect(newCust.tier).toBe('BRONZE');
    expect(newCust.preferences.preferredCategories).toBe('Cotton Kurtis');
  });

  it('Test 3: Duplicate Customer Phone Detection & Friendly Rejection', () => {
    // Attempting to register customer with same mobile (even with spaces or country code)
    expect(() =>
      customerService.createCustomer({
        name: 'Ramesh K Duplicate',
        phone: '+91 9876543210',
      })
    ).toThrow(/already exists with mobile number/);
  });

  it('Test 4: Customer Profile 360° Data Aggregation (Total Spend, Orders Count, AOV, Last Purchase)', () => {
    // Make 2 POS sales for Ramesh (customer 1)
    posService.completeSale({
      customerId: customer1Id,
      items: [{ variantId: variant1Id, quantity: 1, unitPrice: 4400 }],
      payments: [{ method: 'CASH', amount: 4400 }],
    });

    posService.completeSale({
      customerId: customer1Id,
      items: [{ variantId: variant1Id, quantity: 1, unitPrice: 4400 }],
      payments: [{ method: 'UPI', amount: 4400 }],
    });

    const profile = customerService.getCustomerDetails(customer1Id);
    expect(profile.ordersCount).toBe(2);
    expect(profile.totalPurchases).toBe(8800);
    expect(profile.averageOrderValue).toBe(4400);
    expect(profile.lastPurchaseDate).toBeDefined();
  });

  it('Test 5: Customer Purchase History Resolution with Line Items', () => {
    // Execute a sale
    const sale = posService.completeSale({
      customerId: customer1Id,
      items: [{ variantId: variant1Id, quantity: 2, unitPrice: 4400 }],
      payments: [{ method: 'CASH', amount: 8800 }],
    });

    const purchases = customerService.getCustomerPurchaseHistory(customer1Id);
    expect(purchases.length).toBeGreaterThanOrEqual(1);
    expect(purchases[0].invoiceNumber).toBe(sale.invoiceNumber);
    expect(purchases[0].total).toBe(8800);
    expect(purchases[0].items.length).toBe(1);
    expect(purchases[0].items[0].productName).toBe('Kanchipuram Pure Silk');
    expect(purchases[0].items[0].quantity).toBe(2);
  });

  it('Test 6: Customer Returns History Tracking with Reason & Restock Condition', () => {
    // Create sale then return
    const sale = posService.completeSale({
      customerId: customer1Id,
      items: [{ variantId: variant1Id, quantity: 2, unitPrice: 4400 }],
      payments: [{ method: 'CASH', amount: 8800 }],
    });

    const saleItems = db.prepare('SELECT id FROM sale_items WHERE sale_id = ?').all(sale.id) as { id: number }[];

    posService.createReturnRequest({
      saleId: sale.id,
      reason: 'Color exchange requested',
      items: [
        {
          saleItemId: saleItems[0].id,
          variantId: variant1Id,
          quantity: 1,
          refundAmount: 4400,
          reason: 'WRONG_COLOR',
          condition: 'GOOD',
        },
      ],
    });

    const returns = customerService.getCustomerReturns(customer1Id);
    expect(returns.length).toBe(1);
    expect(returns[0].refundAmount).toBe(4400);
    expect(returns[0].items[0].condition).toBe('GOOD');
    expect(returns[0].invoiceNumber).toBe(sale.invoiceNumber);
  });

  it('Test 7: Automatic Loyalty Points Accrual on Completed POS Sale (₹4,400 -> +44 Points)', () => {
    const loyaltyCust = customerService.createCustomer({
      name: 'Loyalty Test Customer',
      phone: '9840998877',
      email: 'loyalty@texora.shop',
    });

    // Initial balance: 0
    let loyalty = customerService.getCustomerLoyalty(loyaltyCust.id);
    expect(loyalty.pointsBalance).toBe(0);

    // Complete sale of ₹4,400 -> 1 pt per ₹100 = 44 points
    posService.completeSale({
      customerId: loyaltyCust.id,
      items: [{ variantId: variant1Id, quantity: 1, unitPrice: 4400 }],
      payments: [{ method: 'CASH', amount: 4400 }],
    });

    loyalty = customerService.getCustomerLoyalty(loyaltyCust.id);
    expect(loyalty.pointsBalance).toBe(44);
    expect(loyalty.lifetimePoints).toBe(44);
    expect(loyalty.earnedThisMonth).toBe(44);
    expect(loyalty.transactions.length).toBe(1);
    expect(loyalty.transactions[0].type).toBe('EARN');
    expect(loyalty.transactions[0].points).toBe(44);
  });

  it('Test 8: Manual Loyalty Points Redemption & Adjustment Ledger', () => {
    const loyaltyCust = customerService.createCustomer({
      name: 'Loyalty Redeem Customer',
      phone: '9840776655',
      email: 'redeem@texora.shop',
    });

    // Add 200 points
    customerService.adjustLoyaltyPoints(loyaltyCust.id, 200, 'EARN', 'Welcome festival bonus');
    let loyalty = customerService.getCustomerLoyalty(loyaltyCust.id);
    expect(loyalty.pointsBalance).toBe(200);

    // Redeem 50 points
    customerService.adjustLoyaltyPoints(loyaltyCust.id, 50, 'REDEEM', 'Redeemed ₹50 discount voucher');
    loyalty = customerService.getCustomerLoyalty(loyaltyCust.id);
    expect(loyalty.pointsBalance).toBe(150);
    expect(loyalty.redeemedTotal).toBe(50);

    // Cannot redeem more than balance
    expect(() =>
      customerService.adjustLoyaltyPoints(loyaltyCust.id, 500, 'REDEEM', 'Excess redemption')
    ).toThrow(/Insufficient loyalty points/);
  });

  it('Test 9: Customer Textile Preferences Persistence (Sizes, Colors, Categories, Brands)', () => {
    customerService.updateCustomerPreferences(customer1Id, {
      preferredCategories: 'Kanchipuram Silk, Banarasi Sarees',
      preferredColors: 'Emerald Green, Deep Purple',
      preferredSizes: 'Free Size',
      preferredBrands: 'Texora Heritage',
      shoppingPreferences: 'Wedding Season Shopper',
    });

    const profile = customerService.getCustomerDetails(customer1Id);
    expect(profile.preferences.preferredCategories).toBe('Kanchipuram Silk, Banarasi Sarees');
    expect(profile.preferences.preferredColors).toBe('Emerald Green, Deep Purple');
    expect(profile.preferences.preferredBrands).toBe('Texora Heritage');
    expect(profile.preferences.shoppingPreferences).toBe('Wedding Season Shopper');
  });

  it('Test 10: Customer Notes Management with Staff Author Attribution', () => {
    customerService.addCustomerNote(customer1Id, 'VIP customer for Diwali collection; prefers door delivery.');

    const notes = customerService.getCustomerNotes(customer1Id);
    expect(notes.length).toBeGreaterThanOrEqual(2); // Initial note + new note
    expect(notes[0].note).toBe('VIP customer for Diwali collection; prefers door delivery.');
    expect(notes[0].authorName).toBe('Arun Kumar');
  });
});
