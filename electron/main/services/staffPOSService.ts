import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { AuthorizationService } from './auth/authorizationService';
import { ProductRepository, VariantRow } from '../repositories/productRepository';
import { CustomerRepository, CustomerRow } from '../repositories/customerRepository';
import { SaleRepository, SaleRow, SaleItemRow, PaymentRow } from '../repositories/saleRepository';
import { StockRepository } from '../repositories/stockRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { eventBus } from '../realtime/eventBus';
import log from '../logger';

export interface StaffPOSProductItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  barcode?: string;
  categoryName?: string;
  brandName?: string;
  color?: string;
  size?: string;
  sellingPrice: number;
  taxRate: number;
  currentStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StaffPOSCartItemInput {
  variantId: number;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface StaffPOSPaymentInput {
  method: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  amount: number;
  referenceNumber?: string;
}

export interface StaffPOSInvoiceData {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  staffId: number;
  staffName: string;
  staffCode: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  items: Array<{
    id: number;
    variantId: number;
    productName: string;
    sku: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    referenceNumber?: string;
  }>;
}

export interface StaffPOSHeldSaleItem {
  id: number;
  staffId: number;
  referenceName: string;
  customerId?: number;
  customerName?: string;
  cartData: any;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'HELD' | 'RESUMED' | 'CANCELLED';
  createdAt: string;
}

export interface StaffMySalesSummary {
  period: string;
  totalSalesVolume: number;
  totalOrdersCount: number;
  totalItemsSoldCount: number;
  totalReturnsCount: number;
  commissionRate: number;
  commissionEarned: number;
  recentSales: Array<{
    id: number;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    itemsCount: number;
    saleDate: string;
  }>;
}

export class StaffPOSService {
  private productRepo: ProductRepository;
  private customerRepo: CustomerRepository;
  private saleRepo: SaleRepository;
  private stockRepo: StockRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.productRepo = new ProductRepository(db);
    this.customerRepo = new CustomerRepository(db);
    this.saleRepo = new SaleRepository(db);
    this.stockRepo = new StockRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private getAuthenticatedStaffId(): number {
    const session = SessionService.getSession();
    if (!session || !session.staffId) {
      throw new Error('Unauthorized: Staff session not found.');
    }
    return session.staffId;
  }

  private getStaffDetails(staffId: number): { id: number; staffCode: string; fullName: string; roleName: string } {
    const row = this.db.prepare(`
      SELECT s.id, s.staff_code, s.first_name || ' ' || s.last_name as full_name,
             COALESCE(r.name, 'STAFF') as role_name
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE s.id = ?
    `).get(staffId) as any;

    const session = SessionService.getSession();
    const effectiveRole = session?.roleName || row?.role_name || 'STAFF';

    if (!row) {
      return { id: staffId, staffCode: 'STF-0000', fullName: 'Store Staff', roleName: effectiveRole };
    }
    return {
      id: row.id,
      staffCode: row.staff_code,
      fullName: row.full_name,
      roleName: effectiveRole,
    };
  }

  private getMaxAllowedDiscountPercent(roleName: string): number {
    const normalized = roleName.toUpperCase();
    if (normalized.includes('ADMIN') || normalized.includes('MANAGER')) return 100;
    if (normalized.includes('SUPERVISOR')) return 20;
    if (normalized.includes('SENIOR')) return 10;
    return 5; // Default floor staff
  }

  /**
   * Fast multi-criteria search for POS
   */
  searchProducts(query?: string, categoryId?: number): StaffPOSProductItem[] {
    let sql = `
      SELECT v.*, p.name as product_name, c.name as category_name, b.name as brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.is_active = 1 AND p.is_active = 1
    `;
    const params: any[] = [];

    if (query && query.trim() !== '') {
      const q = `%${query.trim()}%`;
      sql += ` AND (
        p.name LIKE ? OR
        v.sku LIKE ? OR
        v.barcode LIKE ? OR
        c.name LIKE ? OR
        b.name LIKE ? OR
        v.color LIKE ? OR
        v.size LIKE ?
      )`;
      params.push(q, q, q, q, q, q, q);
    }

    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY p.name ASC, v.sku ASC LIMIT 50';
    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map((r) => {
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (r.current_stock <= 0) status = 'OUT_OF_STOCK';
      else if (r.current_stock <= r.minimum_stock) status = 'LOW_STOCK';

      return {
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        sku: r.sku,
        barcode: r.barcode || undefined,
        categoryName: r.category_name,
        brandName: r.brand_name || undefined,
        color: r.color || undefined,
        size: r.size || undefined,
        sellingPrice: r.selling_price,
        taxRate: r.tax_rate || 0,
        currentStock: r.current_stock,
        status,
      };
    });
  }

  /**
   * Barcode instant lookup
   */
  getProductByBarcode(barcode: string): StaffPOSProductItem | null {
    const row = this.db.prepare(`
      SELECT v.*, p.name as product_name, c.name as category_name, b.name as brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE (v.barcode = ? OR v.sku = ?) AND v.is_active = 1 AND p.is_active = 1
    `).get(barcode.trim(), barcode.trim()) as any;

    if (!row) return null;

    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (row.current_stock <= 0) status = 'OUT_OF_STOCK';
    else if (row.current_stock <= row.minimum_stock) status = 'LOW_STOCK';

    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      barcode: row.barcode || undefined,
      categoryName: row.category_name,
      brandName: row.brand_name || undefined,
      color: row.color || undefined,
      size: row.size || undefined,
      sellingPrice: row.selling_price,
      taxRate: row.tax_rate || 0,
      currentStock: row.current_stock,
      status,
    };
  }

  /**
   * Search customers with Walk-in Customer support
   */
  getCustomers(query?: string): CustomerRow[] {
    let sql = 'SELECT * FROM customers WHERE is_active = 1';
    const params: any[] = [];

    if (query && query.trim() !== '') {
      const q = `%${query.trim()}%`;
      sql += ' AND (name LIKE ? OR phone LIKE ? OR customer_code LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY id ASC LIMIT 20';
    return this.db.prepare(sql).all(...params) as CustomerRow[];
  }

  /**
   * Quick Customer Registration at POS
   */
  quickCreateCustomer(input: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }): { success: boolean; customer: CustomerRow } {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Customer name is required.');
    }

    const code = `CUST-${Date.now().toString().slice(-6)}`;
    const custId = this.customerRepo.create({
      customer_code: code,
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      credit_limit: 0,
    });

    const newCust = this.customerRepo.getById(custId);
    if (!newCust) throw new Error('Failed to retrieve newly created customer.');

    return {
      success: true,
      customer: newCust,
    };
  }

  /**
   * Customer History lookup
   */
  getCustomerHistory(customerId: number): { orderCount: number; lifetimeSpend: number; lastPurchaseDate?: string } {
    const row = this.db.prepare(`
      SELECT COUNT(*) as order_count, COALESCE(SUM(total), 0) as lifetime_spend, MAX(sale_date) as last_purchase
      FROM sales
      WHERE customer_id = ? AND status = 'COMPLETED'
    `).get(customerId) as any;

    return {
      orderCount: row?.order_count || 0,
      lifetimeSpend: row?.lifetime_spend || 0,
      lastPurchaseDate: row?.last_purchase || undefined,
    };
  }

  /**
   * Calculate totals and enforce discount caps
   */
  calculateCartTotals(input: {
    items: StaffPOSCartItemInput[];
    discountType?: 'PERCENT' | 'FIXED';
    discountValue?: number;
    customerId?: number;
  }): {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    itemBreakdowns: Array<{ variantId: number; lineSubtotal: number; lineDiscount: number; lineTax: number; lineTotal: number }>;
  } {
    const staffId = this.getAuthenticatedStaffId();
    const staff = this.getStaffDetails(staffId);
    const maxDiscountPercent = this.getMaxAllowedDiscountPercent(staff.roleName);

    let subtotal = 0;
    let itemDiscounts = 0;
    let taxAmount = 0;

    const itemBreakdowns = input.items.map((item) => {
      const variant = this.productRepo.getVariantById(item.variantId);
      const unitPrice = item.unitPrice || variant?.selling_price || 0;
      const lineSubtotal = unitPrice * item.quantity;
      const discPct = Math.min(item.discountPercent || 0, maxDiscountPercent);
      const lineDiscount = Math.round((lineSubtotal * discPct) / 100);
      const lineTaxable = lineSubtotal - lineDiscount;
      const taxRate = variant?.tax_rate || 0;
      const lineTax = Math.round((lineTaxable * taxRate) / 100);
      const lineTotal = lineTaxable + lineTax;

      subtotal += lineSubtotal;
      itemDiscounts += lineDiscount;
      taxAmount += lineTax;

      return {
        variantId: item.variantId,
        lineSubtotal,
        lineDiscount,
        lineTax,
        lineTotal,
      };
    });

    let billDiscount = 0;
    if (input.discountType === 'PERCENT' && input.discountValue) {
      if (input.discountValue > maxDiscountPercent) {
        throw new Error(`Discount exceeds your authorized limit of ${maxDiscountPercent}%.`);
      }
      billDiscount = Math.round((subtotal * input.discountValue) / 100);
    } else if (input.discountType === 'FIXED' && input.discountValue) {
      const maxAllowedFixed = Math.round((subtotal * maxDiscountPercent) / 100);
      if (input.discountValue > maxAllowedFixed) {
        throw new Error(`Fixed discount exceeds your authorized limit of ₹${maxAllowedFixed} (${maxDiscountPercent}%).`);
      }
      billDiscount = input.discountValue;
    }

    const totalDiscount = itemDiscounts + billDiscount;
    const totalAmount = Math.max(0, subtotal - totalDiscount + taxAmount);

    return {
      subtotal,
      discountAmount: totalDiscount,
      taxAmount,
      totalAmount,
      itemBreakdowns,
    };
  }

  /**
   * Execute atomic POS checkout
   */
  completeSale(input: {
    customerId: number;
    items: StaffPOSCartItemInput[];
    discountType?: 'PERCENT' | 'FIXED';
    discountValue?: number;
    payments: StaffPOSPaymentInput[];
    notes?: string;
  }): StaffPOSInvoiceData {
    AuthorizationService.requirePermission('POS_CREATE_SALE');
    const staffId = this.getAuthenticatedStaffId();
    const staff = this.getStaffDetails(staffId);
    const session = SessionService.getSession();

    if (!input.items || input.items.length === 0) {
      throw new Error('Cart cannot be empty for checkout.');
    }
    if (!input.payments || input.payments.length === 0) {
      throw new Error('At least one payment method is required.');
    }

    const totals = this.calculateCartTotals({
      items: input.items,
      discountType: input.discountType,
      discountValue: input.discountValue,
      customerId: input.customerId,
    });

    const totalPaid = input.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < totals.totalAmount) {
      throw new Error(`Insufficient payment tendered. Total: ₹${totals.totalAmount}, Paid: ₹${totalPaid}.`);
    }

    const changeAmount = Math.max(0, totalPaid - totals.totalAmount);
    const primaryPaymentMethod = input.payments.length === 1 ? input.payments[0].method : 'SPLIT';

    const transaction = this.db.transaction(() => {
      // 1. Re-verify live inventory stock
      for (const item of input.items) {
        const v = this.productRepo.getVariantById(item.variantId);
        if (!v) {
          throw new Error(`Product variant #${item.variantId} not found.`);
        }
        if (v.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for SKU ${v.sku} (${v.product_name}). Available: ${v.current_stock}, Requested: ${item.quantity}.`);
        }
      }

      // 2. Generate unique sequential invoice number
      const seqRow = this.db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
      const nextSeq = (seqRow?.count || 0) + 1;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextSeq).padStart(6, '0')}`;

      // 3. Create Sale record
      const saleRes = this.db.prepare(`
        INSERT INTO sales (
          invoice_number, customer_id, subtotal, discount, tax, total, paid_amount, balance_amount, status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'COMPLETED', ?, ?)
      `).run(
        invoiceNumber,
        input.customerId,
        totals.subtotal,
        totals.discountAmount,
        totals.taxAmount,
        totals.totalAmount,
        totals.totalAmount, // net settled
        input.notes || null,
        session?.userId || null
      );

      const saleId = Number(saleRes.lastInsertRowid);

      // 4. Create Sale Items and deduct inventory atomically
      const itemStmt = this.db.prepare(`
        INSERT INTO sale_items (
          sale_id, product_variant_id, quantity, unit_price, discount, tax, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = this.db.prepare(`
        UPDATE product_variants
        SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        const breakdown = totals.itemBreakdowns[i];
        const v = this.productRepo.getVariantById(item.variantId)!;

        itemStmt.run(
          saleId,
          item.variantId,
          item.quantity,
          item.unitPrice,
          breakdown.lineDiscount,
          breakdown.lineTax,
          breakdown.lineTotal
        );

        // Deduct inventory
        updateStockStmt.run(item.quantity, item.variantId);

        // Record stock transaction movement
        this.stockRepo.createTransaction({
          product_variant_id: item.variantId,
          transaction_type: 'SALE',
          quantity: -item.quantity,
          reference_type: 'SALE',
          reference_id: saleId,
          previous_quantity: v.current_stock,
          new_quantity: v.current_stock - item.quantity,
          notes: `POS Sale ${invoiceNumber} by ${staff.fullName}`,
          created_by: session?.userId,
        });
      }

      // 5. Create Payment records
      const payStmt = this.db.prepare(`
        INSERT INTO payments (sale_id, payment_method, amount, reference_number, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const p of input.payments) {
        payStmt.run(saleId, p.method, p.amount, p.referenceNumber || null, changeAmount > 0 ? `Tendered ₹${p.amount}` : null);
      }

      // 6. Automatically accrue Loyalty Points (1 pt per ₹100)
      const pointsEarned = Math.floor(totals.totalAmount / 100);
      if (pointsEarned > 0 && input.customerId) {
        let acc = this.db.prepare('SELECT * FROM loyalty_accounts WHERE customer_id = ?').get(input.customerId) as any;
        if (!acc) {
          this.db.prepare(`INSERT OR IGNORE INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier) VALUES (?, 0, 0, 'BRONZE')`).run(input.customerId);
          acc = { points_balance: 0, lifetime_points: 0, tier: 'BRONZE' };
        }
        const newBal = (acc.points_balance || 0) + pointsEarned;
        const newLife = (acc.lifetime_points || 0) + pointsEarned;
        let newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE';
        if (newLife >= 5000) newTier = 'PLATINUM';
        else if (newLife >= 2000) newTier = 'GOLD';
        else if (newLife >= 500) newTier = 'SILVER';

        this.db.prepare(`
          UPDATE loyalty_accounts
          SET points_balance = ?, lifetime_points = ?, tier = ?, updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = ?
        `).run(newBal, newLife, newTier, input.customerId);

        this.db.prepare(`
          INSERT INTO loyalty_transactions (
            customer_id, type, points, reference_type, reference_id, description, created_by
          ) VALUES (?, 'EARN', ?, 'SALE', ?, ?, ?)
        `).run(input.customerId, pointsEarned, saleId, `Earned ${pointsEarned} pts from Invoice ${invoiceNumber}`, session?.userId || null);
      }

      // 7. Audit Log
      this.auditRepo.log({
        user_id: session?.userId,
        action: 'SALE_COMPLETED',
        entity_type: 'SALE',
        entity_id: saleId,
        new_value: `Completed POS sale ${invoiceNumber} for ₹${totals.totalAmount} (${input.items.length} items)`,
      });

      return saleId;
    });

    const createdSaleId = transaction();
    const invoice = this.getSaleInvoice(createdSaleId);

    // Emit Realtime Events
    try {
      eventBus.publish('SALE_CREATED', {
        saleId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        itemsCount: invoice.items.length,
        customerName: invoice.customerName,
        paymentMethod: invoice.paymentMethod,
        staffName: invoice.staffName,
        items: invoice.items.map((i) => ({
          variantId: i.variantId,
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      }, {
        actorUserId: session?.userId,
        actorStaffId: staffId,
        actorName: staff.fullName,
      });

      for (const item of input.items) {
        const v = this.productRepo.getVariantById(item.variantId);
        if (v) {
          eventBus.publish('INVENTORY_UPDATED', {
            variantId: v.id,
            sku: v.sku,
            productName: v.product_name,
            currentStock: v.current_stock,
            minimumStock: v.minimum_stock,
            changeQuantity: -item.quantity,
            reason: `Sold in Invoice ${invoice.invoiceNumber}`,
            status: v.current_stock <= 0 ? 'OUT_OF_STOCK' : (v.current_stock <= v.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK'),
          });

          if (v.current_stock <= 0) {
            eventBus.publish('OUT_OF_STOCK', {
              variantId: v.id,
              sku: v.sku,
              productName: v.product_name,
            });
          } else if (v.current_stock <= v.minimum_stock) {
            eventBus.publish('LOW_STOCK_DETECTED', {
              variantId: v.id,
              sku: v.sku,
              productName: v.product_name,
              currentStock: v.current_stock,
              minimumStock: v.minimum_stock,
            });
          }
        }
      }
    } catch (evtErr) {
      log.warn('[StaffPOSService] Realtime event emission error:', evtErr);
    }

    return invoice;
  }

  /**
   * Hold Sale (Park Shopping Cart)
   */
  holdSale(input: {
    referenceName?: string;
    customerId?: number;
    cartData: any;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }): { success: boolean; heldId: number; message: string } {
    AuthorizationService.requirePermission('POS_HOLD_SALE');
    const staffId = this.getAuthenticatedStaffId();
    const ref = input.referenceName?.trim() || `Cart - ${new Date().toLocaleTimeString()}`;

    const res = this.db.prepare(`
      INSERT INTO held_sales (
        staff_id, reference_name, customer_id, cart_data, subtotal, discount_amount, tax_amount, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'HELD')
    `).run(
      staffId,
      ref,
      input.customerId || null,
      JSON.stringify(input.cartData),
      input.subtotal || 0,
      input.discountAmount || 0,
      input.taxAmount || 0,
      input.totalAmount || 0
    );

    return {
      success: true,
      heldId: Number(res.lastInsertRowid),
      message: 'Cart held successfully. You can resume it anytime.',
    };
  }

  /**
   * Retrieve active held sales
   */
  getHeldSales(): StaffPOSHeldSaleItem[] {
    AuthorizationService.requirePermission('POS_VIEW');
    const staffId = this.getAuthenticatedStaffId();
    const rows = this.db.prepare(`
      SELECT hs.*, c.name as customer_name
      FROM held_sales hs
      LEFT JOIN customers c ON hs.customer_id = c.id
      WHERE hs.staff_id = ? AND hs.status = 'HELD'
      ORDER BY hs.id DESC
    `).all(staffId) as any[];

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staff_id,
      referenceName: r.reference_name || 'Held Cart',
      customerId: r.customer_id || undefined,
      customerName: r.customer_name || 'Walk-in Customer',
      cartData: JSON.parse(r.cart_data || '[]'),
      subtotal: r.subtotal,
      discountAmount: r.discount_amount,
      taxAmount: r.tax_amount,
      totalAmount: r.total_amount,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  /**
   * Resume held sale
   */
  resumeSale(heldId: number): StaffPOSHeldSaleItem {
    AuthorizationService.requirePermission('POS_RESUME_SALE');
    const staffId = this.getAuthenticatedStaffId();
    const row = this.db.prepare(`
      SELECT hs.*, c.name as customer_name
      FROM held_sales hs
      LEFT JOIN customers c ON hs.customer_id = c.id
      WHERE hs.id = ? AND hs.staff_id = ? AND hs.status = 'HELD'
    `).get(heldId, staffId) as any;

    if (!row) {
      throw new Error(`Held sale #${heldId} not found or already resumed.`);
    }

    this.db.prepare(`UPDATE held_sales SET status = 'RESUMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(heldId);

    return {
      id: row.id,
      staffId: row.staff_id,
      referenceName: row.reference_name || 'Held Cart',
      customerId: row.customer_id || undefined,
      customerName: row.customer_name || 'Walk-in Customer',
      cartData: JSON.parse(row.cart_data || '[]'),
      subtotal: row.subtotal,
      discountAmount: row.discount_amount,
      taxAmount: row.tax_amount,
      totalAmount: row.total_amount,
      status: 'RESUMED',
      createdAt: row.created_at,
    };
  }

  /**
   * Cancel held sale
   */
  cancelHeldSale(heldId: number): { success: boolean; message: string } {
    const staffId = this.getAuthenticatedStaffId();
    this.db.prepare(`UPDATE held_sales SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND staff_id = ?`).run(heldId, staffId);

    return {
      success: true,
      message: 'Held cart cancelled.',
    };
  }

  /**
   * Get employee's personal sales summary and commission metrics
   */
  getMySales(filters?: { period?: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' }): StaffMySalesSummary {
    const staffId = this.getAuthenticatedStaffId();
    const session = SessionService.getSession();
    const period = filters?.period || 'TODAY';

    let dateCondition = "DATE(s.sale_date) = DATE('now', 'localtime')";
    if (period === 'YESTERDAY') {
      dateCondition = "DATE(s.sale_date) = DATE('now', '-1 day', 'localtime')";
    } else if (period === 'THIS_WEEK') {
      dateCondition = "DATE(s.sale_date) >= DATE('now', '-7 days', 'localtime')";
    } else if (period === 'THIS_MONTH') {
      dateCondition = "strftime('%Y-%m', s.sale_date) = strftime('%Y-%m', 'now', 'localtime')";
    } else if (period === 'ALL') {
      dateCondition = "1=1";
    }

    const stats = this.db.prepare(`
      SELECT
        COALESCE(SUM(s.total), 0) as total_volume,
        COUNT(DISTINCT s.id) as order_count,
        COALESCE(SUM(si.quantity), 0) as items_sold
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.created_by = ? AND s.status = 'COMPLETED' AND ${dateCondition}
    `).get(session?.userId) as any;

    const returnStats = this.db.prepare(`
      SELECT COUNT(*) as return_count
      FROM returns r
      WHERE r.created_by = ? AND ${dateCondition.replace(/s\./g, 'r.')}
    `).get(session?.userId) as any;

    // Commission lookup (default 1.5%)
    const commRow = this.db.prepare(`
      SELECT commission_rate FROM staff_sales_commissions WHERE staff_id = ? AND status = 'ACTIVE'
    `).get(staffId) as any;
    const commissionRate = commRow?.commission_rate ?? 1.5;

    const totalSalesVolume = stats?.total_volume || 0;
    const commissionEarned = Math.round((totalSalesVolume * commissionRate) / 100);

    const recentRows = this.db.prepare(`
      SELECT s.id, s.invoice_number, s.total, s.sale_date, c.name as customer_name,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count,
             COALESCE((SELECT payment_method FROM payments WHERE sale_id = s.id LIMIT 1), 'CASH') as payment_method
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.created_by = ? AND s.status = 'COMPLETED'
      ORDER BY s.id DESC LIMIT 15
    `).all(session?.userId) as any[];

    const recentSales = recentRows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      customerName: r.customer_name || 'Walk-in',
      totalAmount: r.total,
      paymentMethod: r.payment_method,
      itemsCount: r.items_count,
      saleDate: r.sale_date,
    }));

    return {
      period,
      totalSalesVolume,
      totalOrdersCount: stats?.order_count || 0,
      totalItemsSoldCount: stats?.items_sold || 0,
      totalReturnsCount: returnStats?.return_count || 0,
      commissionRate,
      commissionEarned,
      recentSales,
    };
  }

  /**
   * Get invoice for receipt printing
   */
  getSaleInvoice(saleId: number): StaffPOSInvoiceData {
    const sale = this.saleRepo.getSaleById(saleId);
    if (!sale) {
      throw new Error(`Sale invoice #${saleId} not found.`);
    }

    const customer = this.customerRepo.getById(sale.customer_id);
    const items = this.saleRepo.getSaleItems(saleId);
    const payments = this.saleRepo.getPayments(saleId);

    const staffUser = sale.created_by ? this.db.prepare(`
      SELECT s.id, s.staff_code, s.first_name || ' ' || s.last_name as full_name
      FROM staff s WHERE s.user_id = ?
    `).get(sale.created_by) as any : null;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const changeAmount = Math.max(0, totalPaid - sale.total);
    const paymentMethod = payments.length === 1 ? payments[0].payment_method : 'SPLIT';

    return {
      id: sale.id,
      invoiceNumber: sale.invoice_number,
      saleDate: sale.sale_date,
      staffId: staffUser?.id || 1,
      staffCode: staffUser?.staff_code || 'STF-001',
      staffName: staffUser?.full_name || 'Store Staff',
      customerId: sale.customer_id,
      customerName: customer?.name || 'Walk-in Customer',
      customerPhone: customer?.phone || undefined,
      subtotal: sale.subtotal,
      discountAmount: sale.discount,
      taxAmount: sale.tax,
      totalAmount: sale.total,
      paidAmount: sale.paid_amount,
      changeAmount,
      paymentMethod,
      items: items.map((i) => {
        const v = this.productRepo.getVariantById(i.product_variant_id);
        return {
          id: i.id,
          variantId: i.product_variant_id,
          productName: i.product_name || 'Item',
          sku: i.sku || '',
          size: v?.size || undefined,
          color: v?.color || undefined,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          discount: i.discount,
          tax: i.tax,
          total: i.total,
        };
      }),
      payments: payments.map((p) => ({
        method: p.payment_method,
        amount: p.amount,
        referenceNumber: p.reference_number || undefined,
      })),
    };
  }

  /**
   * Process sales return and restock inventory
   */
  createReturnRequest(input: {
    saleId: number;
    items: Array<{ saleItemId: number; variantId: number; quantity: number; reason: string; condition?: string }>;
    notes?: string;
  }): { success: boolean; returnId: number; returnNumber: string; refundAmount: number; message: string } {
    AuthorizationService.requirePermission('RETURN_CREATE');
    const staffId = this.getAuthenticatedStaffId();
    const session = SessionService.getSession();
    const sale = this.saleRepo.getSaleById(input.saleId);

    if (!sale) {
      throw new Error(`Original sale invoice #${input.saleId} not found.`);
    }
    if (!input.items || input.items.length === 0) {
      throw new Error('Please select at least one item to return.');
    }

    const returnSeqRow = this.db.prepare('SELECT COUNT(*) as count FROM returns').get() as { count: number };
    const nextSeq = (returnSeqRow?.count || 0) + 1;
    const returnNumber = `RET-${new Date().getFullYear()}-${String(nextSeq).padStart(6, '0')}`;

    let totalRefund = 0;
    const saleItems = this.saleRepo.getSaleItems(input.saleId);
    const saleItemMap = new Map<number, SaleItemRow>();
    saleItems.forEach((si) => saleItemMap.set(si.id, si));

    const transaction = this.db.transaction(() => {
      // Validate items and compute refund
      for (const item of input.items) {
        const orig = saleItemMap.get(item.saleItemId);
        if (!orig) {
          throw new Error(`Sale item #${item.saleItemId} not found in invoice.`);
        }
        if (item.quantity <= 0 || item.quantity > orig.quantity) {
          throw new Error(`Invalid return quantity for ${orig.product_name}. Max returnable: ${orig.quantity}`);
        }
        const unitPrice = orig.unit_price;
        const itemRefund = unitPrice * item.quantity;
        totalRefund += itemRefund;
      }

      const retRes = this.db.prepare(`
        INSERT INTO returns (
          return_number, sale_id, customer_id, return_type, refund_amount, status, reason, created_by
        ) VALUES (?, ?, ?, 'POS_RETURN', ?, 'COMPLETED', ?, ?)
      `).run(
        returnNumber,
        input.saleId,
        sale.customer_id,
        totalRefund,
        input.notes || input.items[0].reason,
        session?.userId || null
      );

      const returnId = Number(retRes.lastInsertRowid);

      const retItemStmt = this.db.prepare(`
        INSERT INTO return_items (
          return_id, sale_item_id, product_variant_id, quantity, refund_amount, condition, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const restockStmt = this.db.prepare(`
        UPDATE product_variants
        SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of input.items) {
        const orig = saleItemMap.get(item.saleItemId)!;
        const itemRefund = orig.unit_price * item.quantity;
        const condition = item.condition || 'GOOD';

        retItemStmt.run(
          returnId,
          item.saleItemId,
          item.variantId,
          item.quantity,
          itemRefund,
          condition,
          item.reason
        );

        // Restock inventory if good condition
        if (condition === 'GOOD') {
          const v = this.productRepo.getVariantById(item.variantId)!;
          restockStmt.run(item.quantity, item.variantId);

          this.stockRepo.createTransaction({
            product_variant_id: item.variantId,
            transaction_type: 'RETURN',
            quantity: item.quantity,
            reference_type: 'RETURN',
            reference_id: returnId,
            previous_quantity: v.current_stock,
            new_quantity: v.current_stock + item.quantity,
            notes: `POS Return ${returnNumber} for Invoice ${sale.invoice_number}`,
            created_by: session?.userId,
          });
        }
      }

      this.auditRepo.log({
        user_id: session?.userId,
        action: 'RETURN_PROCESSED',
        entity_type: 'RETURN',
        entity_id: returnId,
        new_value: `Processed POS return ${returnNumber} for Invoice ${sale.invoice_number} (Refund: ₹${totalRefund})`,
      });

      return returnId;
    });

    const returnId = transaction();

    // Emit Realtime Events
    try {
      eventBus.publish('SALE_RETURNED', {
        returnId,
        returnNumber,
        saleId: input.saleId,
        refundAmount: totalRefund,
        itemsCount: input.items.length,
        reason: input.items[0]?.reason || 'Customer Return',
      }, {
        actorUserId: session?.userId,
        actorStaffId: staffId,
      });

      for (const item of input.items) {
        if (item.condition === 'GOOD') {
          const v = this.productRepo.getVariantById(item.variantId);
          if (v) {
            eventBus.publish('INVENTORY_UPDATED', {
              variantId: v.id,
              sku: v.sku,
              productName: v.product_name,
              currentStock: v.current_stock,
              minimumStock: v.minimum_stock,
              changeQuantity: item.quantity,
              reason: `Restocked from Return ${returnNumber}`,
              status: v.current_stock <= 0 ? 'OUT_OF_STOCK' : (v.current_stock <= v.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK'),
            });
          }
        }
      }
    } catch (evtErr) {
      log.warn('[StaffPOSService] Realtime return event error:', evtErr);
    }

    return {
      success: true,
      returnId,
      returnNumber,
      refundAmount: totalRefund,
      message: `Return ${returnNumber} processed successfully. Refund: ₹${totalRefund.toLocaleString('en-IN')}`,
    };
  }
}
