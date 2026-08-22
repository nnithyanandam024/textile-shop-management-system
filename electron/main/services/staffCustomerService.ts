import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { CustomerRepository, CustomerRow } from '../repositories/customerRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface StaffCustomerListItem {
  id: number;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  totalPurchases: number;
  ordersCount: number;
  lastPurchaseDate?: string;
  loyaltyPoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  createdAt: string;
}

export interface StaffCustomerPreferences {
  preferredCategories?: string;
  preferredColors?: string;
  preferredSizes?: string;
  preferredBrands?: string;
  shoppingPreferences?: string;
  dob?: string;
  anniversary?: string;
}

export interface StaffCustomerNoteItem {
  id: number;
  customerId: number;
  note: string;
  authorName: string;
  createdAt: string;
}

export interface StaffCustomerDetails {
  id: number;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  creditLimit: number;
  outstandingBalance: number;
  totalPurchases: number;
  ordersCount: number;
  averageOrderValue: number;
  lastPurchaseDate?: string;
  totalReturnsCount: number;
  loyaltyPoints: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  preferences: StaffCustomerPreferences;
  notes: StaffCustomerNoteItem[];
  createdAt: string;
}

export interface StaffCustomerPurchaseItem {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  itemsCount: number;
  items: Array<{
    id: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface StaffCustomerReturnItem {
  id: number;
  returnNumber: string;
  saleId: number;
  invoiceNumber: string;
  returnDate: string;
  refundAmount: number;
  status: string;
  reason?: string;
  items: Array<{
    productName: string;
    quantity: number;
    reason: string;
    condition: string;
  }>;
}

export interface StaffCustomerLoyaltyData {
  pointsBalance: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  earnedThisMonth: number;
  redeemedTotal: number;
  transactions: Array<{
    id: number;
    type: 'EARN' | 'REDEEM' | 'ADJUST' | 'EXPIRE';
    points: number;
    description: string;
    referenceType?: string;
    referenceId?: number;
    createdAt: string;
  }>;
}

export class StaffCustomerService {
  private customerRepo: CustomerRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.customerRepo = new CustomerRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private normalizePhone(phone?: string): string {
    if (!phone) return '';
    // Strip non-digits except leading plus, and trim +91 or leading 0s
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.slice(2);
    }
    return cleaned;
  }

  private calculateTier(lifetimePoints: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
    if (lifetimePoints >= 5000) return 'PLATINUM';
    if (lifetimePoints >= 2000) return 'GOLD';
    if (lifetimePoints >= 500) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Search Customers with normalized mobile & metric aggregation
   */
  searchCustomers(query?: string, filters?: { minSpend?: number; tier?: string }): StaffCustomerListItem[] {
    let sql = `
      SELECT 
        c.id, c.customer_code, c.name, c.phone, c.email, c.city, c.created_at,
        COALESCE(SUM(s.total), 0) as total_purchases,
        COUNT(DISTINCT s.id) as orders_count,
        MAX(s.sale_date) as last_purchase_date,
        COALESCE(la.points_balance, 0) as loyalty_points,
        COALESCE(la.lifetime_points, 0) as lifetime_points,
        COALESCE(la.tier, 'BRONZE') as tier
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
      LEFT JOIN loyalty_accounts la ON c.id = la.customer_id
      WHERE c.is_active = 1
    `;
    const params: any[] = [];

    if (query && query.trim() !== '') {
      const cleanQ = query.trim();
      const normPhoneQ = this.normalizePhone(cleanQ);
      const qWild = `%${cleanQ}%`;

      if (normPhoneQ.length >= 3) {
        sql += ` AND (c.name LIKE ? OR c.customer_code LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
        params.push(qWild, qWild, qWild, `%${normPhoneQ}%`);
      } else {
        sql += ` AND (c.name LIKE ? OR c.customer_code LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
        params.push(qWild, qWild, qWild, qWild);
      }
    }

    sql += ' GROUP BY c.id';

    if (filters?.minSpend) {
      sql += ' HAVING total_purchases >= ?';
      params.push(filters.minSpend);
    }

    sql += ' ORDER BY total_purchases DESC, c.name ASC LIMIT 50';

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      customerCode: r.customer_code,
      name: r.name,
      phone: r.phone || undefined,
      email: r.email || undefined,
      city: r.city || undefined,
      totalPurchases: r.total_purchases,
      ordersCount: r.orders_count,
      lastPurchaseDate: r.last_purchase_date || undefined,
      loyaltyPoints: r.loyalty_points,
      tier: r.tier as any,
      createdAt: r.created_at,
    }));
  }

  /**
   * Get 360° Customer Profile Details
   */
  getCustomerDetails(customerId: number): StaffCustomerDetails {
    const cust = this.customerRepo.getById(customerId);
    if (!cust) {
      throw new Error(`Customer #${customerId} not found.`);
    }

    // Aggregated sales stats
    const stats = this.db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_purchases,
        COUNT(*) as orders_count,
        MAX(sale_date) as last_purchase_date,
        COALESCE(SUM(balance_amount), 0) as outstanding_balance
      FROM sales
      WHERE customer_id = ? AND status = 'COMPLETED'
    `).get(customerId) as any;

    const returnStats = this.db.prepare(`
      SELECT COUNT(*) as return_count
      FROM returns
      WHERE customer_id = ?
    `).get(customerId) as any;

    // Loyalty account lookup
    let loyalty = this.db.prepare(`
      SELECT * FROM loyalty_accounts WHERE customer_id = ?
    `).get(customerId) as any;

    if (!loyalty) {
      this.db.prepare(`
        INSERT OR IGNORE INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier)
        VALUES (?, 0, 0, 'BRONZE')
      `).run(customerId);
      loyalty = { points_balance: 0, lifetime_points: 0, tier: 'BRONZE' };
    }

    // Preferences lookup
    const prefRow = this.db.prepare(`
      SELECT * FROM customer_preferences WHERE customer_id = ?
    `).get(customerId) as any;

    // Notes lookup
    const noteRows = this.db.prepare(`
      SELECT id, customer_id, note, author_name, created_at
      FROM customer_notes
      WHERE customer_id = ?
      ORDER BY id DESC
    `).all(customerId) as any[];

    const totalPurchases = stats?.total_purchases || 0;
    const ordersCount = stats?.orders_count || 0;
    const averageOrderValue = ordersCount > 0 ? Math.round(totalPurchases / ordersCount) : 0;

    return {
      id: cust.id,
      customerCode: cust.customer_code,
      name: cust.name,
      phone: cust.phone || undefined,
      email: cust.email || undefined,
      address: cust.address || undefined,
      city: cust.city || undefined,
      state: cust.state || undefined,
      pincode: cust.pincode || undefined,
      gstNumber: cust.gst_number || undefined,
      creditLimit: cust.credit_limit || 0,
      outstandingBalance: stats?.outstanding_balance || 0,
      totalPurchases,
      ordersCount,
      averageOrderValue,
      lastPurchaseDate: stats?.last_purchase_date || undefined,
      totalReturnsCount: returnStats?.return_count || 0,
      loyaltyPoints: loyalty.points_balance || 0,
      lifetimePoints: loyalty.lifetime_points || 0,
      tier: loyalty.tier || 'BRONZE',
      preferences: {
        preferredCategories: prefRow?.preferred_categories || undefined,
        preferredColors: prefRow?.preferred_colors || undefined,
        preferredSizes: prefRow?.preferred_sizes || undefined,
        preferredBrands: prefRow?.preferred_brands || undefined,
        shoppingPreferences: prefRow?.shopping_preferences || undefined,
        dob: prefRow?.dob || undefined,
        anniversary: prefRow?.anniversary || undefined,
      },
      notes: noteRows.map((n) => ({
        id: n.id,
        customerId: n.customer_id,
        note: n.note,
        authorName: n.author_name || 'Staff',
        createdAt: n.created_at,
      })),
      createdAt: cust.created_at,
    };
  }

  /**
   * Register Customer with Duplicate Detection
   */
  createCustomer(input: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    dob?: string;
    anniversary?: string;
    notes?: string;
    preferences?: StaffCustomerPreferences;
  }): StaffCustomerDetails {
    const session = SessionService.getSession();
    const cleanName = input.name?.trim();
    const cleanPhone = input.phone?.trim();

    if (!cleanName) throw new Error('Customer name is required.');
    if (!cleanPhone) throw new Error('Customer mobile number is required.');

    const normPhone = this.normalizePhone(cleanPhone);

    // Duplicate Phone Check
    const existing = this.db.prepare(`
      SELECT * FROM customers 
      WHERE is_active = 1 AND (phone = ? OR phone LIKE ?)
    `).get(cleanPhone, `%${normPhone}%`) as CustomerRow | undefined;

    if (existing) {
      throw new Error(`Customer already exists with mobile number "${cleanPhone}": ${existing.name} (${existing.customer_code}).`);
    }

    const transaction = this.db.transaction(() => {
      // 1. Generate unique customer code
      const seqRow = this.db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
      const nextSeq = (seqRow?.count || 0) + 1;
      const customerCode = `CUS-${String(nextSeq).padStart(5, '0')}`;

      // 2. Insert into customers
      const custId = this.customerRepo.create({
        customer_code: customerCode,
        name: cleanName,
        phone: cleanPhone,
        email: input.email?.trim() || undefined,
        address: input.address?.trim() || undefined,
        city: input.city?.trim() || undefined,
        state: input.state?.trim() || undefined,
        pincode: input.pincode?.trim() || undefined,
        gst_number: input.gstNumber?.trim() || undefined,
        credit_limit: 0,
      });

      // 3. Initialize Loyalty Account
      this.db.prepare(`
        INSERT INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier)
        VALUES (?, 0, 0, 'BRONZE')
      `).run(custId);

      // 4. Initialize Customer Preferences
      this.db.prepare(`
        INSERT INTO customer_preferences (
          customer_id, preferred_categories, preferred_colors, preferred_sizes, preferred_brands, shopping_preferences, dob, anniversary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        custId,
        input.preferences?.preferredCategories || null,
        input.preferences?.preferredColors || null,
        input.preferences?.preferredSizes || null,
        input.preferences?.preferredBrands || null,
        input.preferences?.shoppingPreferences || null,
        input.dob || input.preferences?.dob || null,
        input.anniversary || input.preferences?.anniversary || null
      );

      // 5. Insert initial note if provided
      if (input.notes && input.notes.trim() !== '') {
        this.db.prepare(`
          INSERT INTO customer_notes (customer_id, note, created_by, author_name)
          VALUES (?, ?, ?, ?)
        `).run(custId, input.notes.trim(), session?.userId || null, session?.displayName || 'Staff');
      }

      // 6. Audit Log
      this.auditRepo.log({
        user_id: session?.userId,
        action: 'CUSTOMER_CREATED',
        entity_type: 'CUSTOMER',
        entity_id: custId,
        new_value: `Created customer profile for ${cleanName} (${customerCode})`,
      });

      return custId;
    });

    const newCustomerId = transaction();
    return this.getCustomerDetails(newCustomerId);
  }

  /**
   * Update Customer Demographics & Contact
   */
  updateCustomer(
    customerId: number,
    input: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      gstNumber?: string;
      creditLimit?: number;
    }
  ): StaffCustomerDetails {
    const session = SessionService.getSession();
    const existing = this.customerRepo.getById(customerId);
    if (!existing) throw new Error(`Customer #${customerId} not found.`);

    if (input.phone && input.phone.trim() !== existing.phone) {
      const cleanPhone = input.phone.trim();
      const normPhone = this.normalizePhone(cleanPhone);
      const dup = this.db.prepare(`
        SELECT * FROM customers WHERE id != ? AND is_active = 1 AND (phone = ? OR phone LIKE ?)
      `).get(customerId, cleanPhone, `%${normPhone}%`) as CustomerRow | undefined;

      if (dup) {
        throw new Error(`Another customer already exists with mobile number "${cleanPhone}": ${dup.name} (${dup.customer_code}).`);
      }
    }

    this.customerRepo.update(customerId, {
      name: input.name?.trim() || existing.name,
      phone: input.phone !== undefined ? input.phone.trim() : existing.phone,
      email: input.email !== undefined ? input.email.trim() : existing.email,
      address: input.address !== undefined ? input.address.trim() : existing.address,
      city: input.city !== undefined ? input.city.trim() : existing.city,
      state: input.state !== undefined ? input.state.trim() : existing.state,
      pincode: input.pincode !== undefined ? input.pincode.trim() : existing.pincode,
      gst_number: input.gstNumber !== undefined ? input.gstNumber.trim() : existing.gst_number,
      credit_limit: input.creditLimit !== undefined ? input.creditLimit : existing.credit_limit,
    });

    this.auditRepo.log({
      user_id: session?.userId,
      action: 'CUSTOMER_UPDATED',
      entity_type: 'CUSTOMER',
      entity_id: customerId,
      new_value: `Updated details for customer ${existing.customer_code}`,
    });

    return this.getCustomerDetails(customerId);
  }

  /**
   * Update Customer Textile Preferences
   */
  updateCustomerPreferences(customerId: number, preferences: StaffCustomerPreferences): StaffCustomerPreferences {
    const session = SessionService.getSession();
    this.db.prepare(`
      INSERT INTO customer_preferences (
        customer_id, preferred_categories, preferred_colors, preferred_sizes, preferred_brands, shopping_preferences, dob, anniversary, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(customer_id) DO UPDATE SET
        preferred_categories = excluded.preferred_categories,
        preferred_colors = excluded.preferred_colors,
        preferred_sizes = excluded.preferred_sizes,
        preferred_brands = excluded.preferred_brands,
        shopping_preferences = excluded.shopping_preferences,
        dob = excluded.dob,
        anniversary = excluded.anniversary,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      customerId,
      preferences.preferredCategories || null,
      preferences.preferredColors || null,
      preferences.preferredSizes || null,
      preferences.preferredBrands || null,
      preferences.shoppingPreferences || null,
      preferences.dob || null,
      preferences.anniversary || null
    );

    this.auditRepo.log({
      user_id: session?.userId,
      action: 'CUSTOMER_PREFERENCES_UPDATED',
      entity_type: 'CUSTOMER',
      entity_id: customerId,
      new_value: `Updated textile shopping preferences`,
    });

    return preferences;
  }

  /**
   * Append Staff Customer Note
   */
  addCustomerNote(customerId: number, note: string): StaffCustomerNoteItem {
    const session = SessionService.getSession();
    if (!note || note.trim() === '') {
      throw new Error('Note content cannot be empty.');
    }

    const authorName = session?.displayName || 'Store Staff';
    const res = this.db.prepare(`
      INSERT INTO customer_notes (customer_id, note, created_by, author_name)
      VALUES (?, ?, ?, ?)
    `).run(customerId, note.trim(), session?.userId || null, authorName);

    return {
      id: Number(res.lastInsertRowid),
      customerId,
      note: note.trim(),
      authorName,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get Customer Notes Timeline
   */
  getCustomerNotes(customerId: number): StaffCustomerNoteItem[] {
    const rows = this.db.prepare(`
      SELECT id, customer_id, note, author_name, created_at
      FROM customer_notes
      WHERE customer_id = ?
      ORDER BY id DESC
    `).all(customerId) as any[];

    return rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      note: r.note,
      authorName: r.author_name || 'Staff',
      createdAt: r.created_at,
    }));
  }

  /**
   * Get Customer Purchase History Invoices & Line Items
   */
  getCustomerPurchaseHistory(customerId: number): StaffCustomerPurchaseItem[] {
    const sales = this.db.prepare(`
      SELECT s.*, 
             COALESCE((SELECT payment_method FROM payments WHERE sale_id = s.id LIMIT 1), 'CASH') as payment_method,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      WHERE s.customer_id = ? AND s.status = 'COMPLETED'
      ORDER BY s.id DESC
    `).all(customerId) as any[];

    return sales.map((s) => {
      const items = this.db.prepare(`
        SELECT si.*, p.name as product_name, pv.sku
        FROM sale_items si
        JOIN product_variants pv ON si.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE si.sale_id = ?
      `).all(s.id) as any[];

      return {
        id: s.id,
        invoiceNumber: s.invoice_number,
        saleDate: s.sale_date,
        subtotal: s.subtotal,
        discount: s.discount,
        tax: s.tax,
        total: s.total,
        status: s.status,
        paymentMethod: s.payment_method,
        itemsCount: s.items_count,
        items: items.map((i) => ({
          id: i.id,
          productName: i.product_name,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total,
        })),
      };
    });
  }

  /**
   * Get Customer Returns History
   */
  getCustomerReturns(customerId: number): StaffCustomerReturnItem[] {
    const returns = this.db.prepare(`
      SELECT r.*, s.invoice_number
      FROM returns r
      JOIN sales s ON r.sale_id = s.id
      WHERE r.customer_id = ?
      ORDER BY r.id DESC
    `).all(customerId) as any[];

    return returns.map((r) => {
      const items = this.db.prepare(`
        SELECT ri.*, p.name as product_name
        FROM return_items ri
        JOIN product_variants pv ON ri.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE ri.return_id = ?
      `).all(r.id) as any[];

      return {
        id: r.id,
        returnNumber: r.return_number,
        saleId: r.sale_id,
        invoiceNumber: r.invoice_number,
        returnDate: r.return_date,
        refundAmount: r.refund_amount,
        status: r.status,
        reason: r.reason || undefined,
        items: items.map((i) => ({
          productName: i.product_name,
          quantity: i.quantity,
          reason: i.reason,
          condition: i.condition,
        })),
      };
    });
  }

  /**
   * Get Customer Loyalty Details & Ledger
   */
  getCustomerLoyalty(customerId: number): StaffCustomerLoyaltyData {
    let acc = this.db.prepare(`
      SELECT * FROM loyalty_accounts WHERE customer_id = ?
    `).get(customerId) as any;

    if (!acc) {
      this.db.prepare(`
        INSERT OR IGNORE INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier)
        VALUES (?, 0, 0, 'BRONZE')
      `).run(customerId);
      acc = { points_balance: 0, lifetime_points: 0, tier: 'BRONZE' };
    }

    // Points earned this month
    const thisMonthRow = this.db.prepare(`
      SELECT COALESCE(SUM(points), 0) as earned_this_month
      FROM loyalty_transactions
      WHERE customer_id = ? AND type = 'EARN' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
    `).get(customerId) as any;

    // Total points redeemed
    const redeemedRow = this.db.prepare(`
      SELECT COALESCE(SUM(points), 0) as redeemed_total
      FROM loyalty_transactions
      WHERE customer_id = ? AND type = 'REDEEM'
    `).get(customerId) as any;

    const txRows = this.db.prepare(`
      SELECT id, type, points, description, reference_type, reference_id, created_at
      FROM loyalty_transactions
      WHERE customer_id = ?
      ORDER BY id DESC LIMIT 30
    `).all(customerId) as any[];

    return {
      pointsBalance: acc.points_balance,
      lifetimePoints: acc.lifetime_points,
      tier: acc.tier,
      earnedThisMonth: thisMonthRow?.earned_this_month || 0,
      redeemedTotal: Math.abs(redeemedRow?.redeemed_total || 0),
      transactions: txRows.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        referenceType: t.reference_type || undefined,
        referenceId: t.reference_id || undefined,
        createdAt: t.created_at,
      })),
    };
  }

  /**
   * Adjust or Redeem Loyalty Points
   */
  adjustLoyaltyPoints(
    customerId: number,
    points: number,
    type: 'EARN' | 'REDEEM' | 'ADJUST',
    description: string
  ): StaffCustomerLoyaltyData {
    const session = SessionService.getSession();
    if (points <= 0) throw new Error('Points value must be greater than 0.');

    let acc = this.db.prepare('SELECT * FROM loyalty_accounts WHERE customer_id = ?').get(customerId) as any;
    if (!acc) {
      this.db.prepare('INSERT INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier) VALUES (?, 0, 0, "BRONZE")').run(customerId);
      acc = { points_balance: 0, lifetime_points: 0, tier: 'BRONZE' };
    }

    let delta = points;
    let newLifetime = acc.lifetime_points;

    if (type === 'REDEEM') {
      if (acc.points_balance < points) {
        throw new Error(`Insufficient loyalty points. Balance: ${acc.points_balance}, Requested: ${points}.`);
      }
      delta = -points;
    } else if (type === 'EARN') {
      newLifetime += points;
    }

    const newBalance = acc.points_balance + delta;
    const newTier = this.calculateTier(newLifetime);

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE loyalty_accounts
        SET points_balance = ?, lifetime_points = ?, tier = ?, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = ?
      `).run(newBalance, newLifetime, newTier, customerId);

      this.db.prepare(`
        INSERT INTO loyalty_transactions (
          customer_id, type, points, description, created_by
        ) VALUES (?, ?, ?, ?, ?)
      `).run(customerId, type, delta, description.trim(), session?.userId || null);

      this.auditRepo.log({
        user_id: session?.userId,
        action: 'LOYALTY_ADJUSTED',
        entity_type: 'CUSTOMER',
        entity_id: customerId,
        new_value: `${type} ${points} loyalty points. Reason: ${description}`,
      });
    });

    transaction();
    return this.getCustomerLoyalty(customerId);
  }
}
