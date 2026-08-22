import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { ProductRepository, VariantRow, ProductRow } from '../repositories/productRepository';
import { StockRepository, StockTransactionRow } from '../repositories/stockRepository';
import { PurchaseRepository, PurchaseRow, PurchaseItemRow } from '../repositories/purchaseRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED';

export interface StaffProductListItem {
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
  currentStock: number;
  minimumStock: number;
  status: StockStatusType;
  locationName: string;
}

export interface StaffProductDetailsItem extends StaffProductListItem {
  material?: string;
  description?: string;
  pattern?: string;
  purchasePrice?: number;
  recentMovements: Array<{
    id: number;
    transactionType: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    notes?: string;
    createdAt: string;
  }>;
}

export interface StaffInventoryTaskItem {
  id: number;
  staffId: number;
  taskType: 'STOCK_COUNT' | 'STOCK_RECEIVING' | 'TRANSFER_DISPATCH' | 'REORDER_CHECK';
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  referenceId?: number;
  createdAt: string;
}

export interface StaffStockCountItem {
  id: number;
  staffId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  locationName: string;
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface StaffTransferRequestItem {
  id: number;
  staffId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface StaffReceivingReportItem {
  id: number;
  staffId: number;
  purchaseId: number;
  purchaseNumber: string;
  supplierName: string;
  notes?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  itemsCount: number;
  hasDiscrepancy: boolean;
  createdAt: string;
}

export interface StaffInventoryMetrics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingTasksCount: number;
}

export class StaffInventoryService {
  private productRepo: ProductRepository;
  private stockRepo: StockRepository;
  private purchaseRepo: PurchaseRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.productRepo = new ProductRepository(db);
    this.stockRepo = new StockRepository(db);
    this.purchaseRepo = new PurchaseRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private getAuthenticatedStaffId(): number {
    const session = SessionService.getSession();
    if (!session || !session.staffId) {
      throw new Error('Unauthorized: Staff session not found.');
    }
    return session.staffId;
  }

  private resolveStockStatus(currentStock: number, minimumStock: number): StockStatusType {
    if (currentStock <= 0) return 'OUT_OF_STOCK';
    if (currentStock <= minimumStock) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  /**
   * Fast multi-criteria product search with pagination
   */
  searchProducts(
    query?: string,
    filters?: {
      categoryId?: number;
      brandId?: number;
      stockStatus?: string;
      page?: number;
      limit?: number;
    }
  ): {
    items: StaffProductListItem[];
    total: number;
    page: number;
    limit: number;
  } {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 25;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT v.*, p.name as product_name, p.category_id, p.brand_id, p.material,
             c.name as category_name, b.name as brand_name
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

    if (filters?.categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(filters.categoryId);
    }

    if (filters?.brandId) {
      sql += ' AND p.brand_id = ?';
      params.push(filters.brandId);
    }

    if (filters?.stockStatus === 'LOW_STOCK') {
      sql += ' AND v.current_stock > 0 AND v.current_stock <= v.minimum_stock';
    } else if (filters?.stockStatus === 'OUT_OF_STOCK') {
      sql += ' AND v.current_stock <= 0';
    } else if (filters?.stockStatus === 'IN_STOCK') {
      sql += ' AND v.current_stock > v.minimum_stock';
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countRow = this.db.prepare(countSql).get(...params) as { total: number };
    const total = countRow?.total || 0;

    sql += ' ORDER BY p.name ASC, v.sku ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = this.db.prepare(sql).all(...params) as any[];

    const items: StaffProductListItem[] = rows.map((r) => ({
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
      currentStock: r.current_stock,
      minimumStock: r.minimum_stock,
      status: this.resolveStockStatus(r.current_stock, r.minimum_stock),
      locationName: 'Main Shop',
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get product details and recent stock transactions
   */
  getProductDetails(variantId: number): StaffProductDetailsItem {
    const row = this.db.prepare(`
      SELECT v.*, p.name as product_name, p.material, p.description,
             c.name as category_name, b.name as brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.id = ? AND v.is_active = 1
    `).get(variantId) as any;

    if (!row) {
      throw new Error(`Product variant #${variantId} not found.`);
    }

    const movements = this.stockRepo.getTransactionsByVariant(variantId).slice(0, 10);

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
      material: row.material || undefined,
      description: row.description || undefined,
      pattern: row.pattern || undefined,
      sellingPrice: row.selling_price,
      currentStock: row.current_stock,
      minimumStock: row.minimum_stock,
      status: this.resolveStockStatus(row.current_stock, row.minimum_stock),
      locationName: 'Main Shop',
      recentMovements: movements.map((m) => ({
        id: m.id,
        transactionType: m.transaction_type,
        quantity: m.quantity,
        previousQuantity: m.previous_quantity,
        newQuantity: m.new_quantity,
        notes: m.notes || undefined,
        createdAt: m.created_at,
      })),
    };
  }

  /**
   * Get low-stock alert items
   */
  getLowStockItems(): StaffProductListItem[] {
    const rows = this.db.prepare(`
      SELECT v.*, p.name as product_name, c.name as category_name, b.name as brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.is_active = 1 AND p.is_active = 1 AND v.current_stock <= v.minimum_stock
      ORDER BY v.current_stock ASC, p.name ASC
      LIMIT 20
    `).all() as any[];

    return rows.map((r) => ({
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
      currentStock: r.current_stock,
      minimumStock: r.minimum_stock,
      status: this.resolveStockStatus(r.current_stock, r.minimum_stock),
      locationName: 'Main Shop',
    }));
  }

  /**
   * Get assigned inventory tasks for staff
   */
  getInventoryTasks(): StaffInventoryTaskItem[] {
    const staffId = this.getAuthenticatedStaffId();
    const rows = this.db.prepare(`
      SELECT * FROM inventory_tasks
      WHERE staff_id = ?
      ORDER BY CASE status WHEN 'PENDING' THEN 1 WHEN 'IN_PROGRESS' THEN 2 ELSE 3 END, id DESC
    `).all(staffId) as any[];

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staff_id,
      taskType: r.task_type,
      title: r.title,
      description: r.description || undefined,
      dueDate: r.due_date || undefined,
      status: r.status,
      referenceId: r.reference_id || undefined,
      createdAt: r.created_at,
    }));
  }

  /**
   * Submit physical stock count request (does not directly modify inventory)
   */
  submitStockCount(input: {
    product_variant_id: number;
    physical_quantity: number;
    reason: string;
    location_name?: string;
  }): { success: boolean; id: number; difference: number; message: string } {
    const staffId = this.getAuthenticatedStaffId();
    const variant = this.productRepo.getVariantById(input.product_variant_id);

    if (!variant) {
      throw new Error(`Product variant #${input.product_variant_id} not found.`);
    }
    if (input.physical_quantity < 0) {
      throw new Error('Physical quantity cannot be negative.');
    }
    if (!input.reason || input.reason.trim() === '') {
      throw new Error('Please provide a reason or observation for the stock count.');
    }

    const systemQty = variant.current_stock;
    const difference = input.physical_quantity - systemQty;

    const res = this.db.prepare(`
      INSERT INTO stock_counts (
        staff_id, product_variant_id, location_name, system_quantity, physical_quantity, difference, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      staffId,
      input.product_variant_id,
      input.location_name || 'Main Shop',
      systemQty,
      input.physical_quantity,
      difference,
      input.reason.trim()
    );

    const countId = Number(res.lastInsertRowid);

    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'STOCK_COUNT_SUBMITTED',
      entity_type: 'STOCK_COUNT',
      entity_id: countId,
      new_value: `Submitted count for SKU ${variant.sku}: System=${systemQty}, Physical=${input.physical_quantity}, Diff=${difference}`,
    });

    return {
      success: true,
      id: countId,
      difference,
      message: difference === 0
        ? 'Stock count verified matching system quantity.'
        : `Stock count discrepancy reported (${difference > 0 ? `+${difference}` : difference} pcs). Submitted for manager approval.`,
    };
  }

  /**
   * Submit stock transfer request (does not immediately deduct inventory)
   */
  createTransferRequest(input: {
    product_variant_id: number;
    from_location: string;
    to_location: string;
    quantity: number;
    reason: string;
  }): { success: boolean; id: number; message: string } {
    const staffId = this.getAuthenticatedStaffId();
    const variant = this.productRepo.getVariantById(input.product_variant_id);

    if (!variant) {
      throw new Error(`Product variant #${input.product_variant_id} not found.`);
    }
    if (!input.quantity || input.quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0.');
    }
    if (input.quantity > variant.current_stock) {
      throw new Error(`Insufficient stock available for transfer. Current Stock: ${variant.current_stock}, Requested: ${input.quantity}`);
    }
    if (!input.from_location || !input.to_location) {
      throw new Error('Please specify both source and destination locations.');
    }
    if (input.from_location.trim().toLowerCase() === input.to_location.trim().toLowerCase()) {
      throw new Error('Source and destination locations cannot be identical.');
    }
    if (!input.reason || input.reason.trim() === '') {
      throw new Error('Please specify reason for stock transfer.');
    }

    const res = this.db.prepare(`
      INSERT INTO stock_transfer_requests (
        staff_id, product_variant_id, from_location, to_location, quantity, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      staffId,
      input.product_variant_id,
      input.from_location.trim(),
      input.to_location.trim(),
      input.quantity,
      input.reason.trim()
    );

    const transferId = Number(res.lastInsertRowid);

    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'STOCK_TRANSFER_REQUESTED',
      entity_type: 'STOCK_TRANSFER',
      entity_id: transferId,
      new_value: `Requested transfer of ${input.quantity}x ${variant.sku} from ${input.from_location} to ${input.to_location}`,
    });

    return {
      success: true,
      id: transferId,
      message: 'Transfer request submitted successfully for manager approval.',
    };
  }

  /**
   * Get employee's stock transfer requests
   */
  getTransferRequests(): StaffTransferRequestItem[] {
    const staffId = this.getAuthenticatedStaffId();
    const rows = this.db.prepare(`
      SELECT tr.*, v.sku, p.name as product_name, u.display_name as reviewer_name
      FROM stock_transfer_requests tr
      JOIN product_variants v ON tr.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN users u ON tr.reviewed_by = u.id
      WHERE tr.staff_id = ?
      ORDER BY tr.id DESC
    `).all(staffId) as any[];

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staff_id,
      productVariantId: r.product_variant_id,
      productName: r.product_name,
      sku: r.sku,
      fromLocation: r.from_location,
      toLocation: r.to_location,
      quantity: r.quantity,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewer_name || undefined,
      reviewComment: r.review_comment || undefined,
      reviewedAt: r.reviewed_at || undefined,
      createdAt: r.created_at,
    }));
  }

  /**
   * Get open Purchase Orders for receiving stock
   */
  getPurchaseOrdersForReceiving(): Array<{
    id: number;
    purchaseNumber: string;
    supplierName: string;
    purchaseDate: string;
    items: Array<{
      id: number;
      productVariantId: number;
      productName: string;
      sku: string;
      orderedQuantity: number;
    }>;
  }> {
    const purchases = this.purchaseRepo.getAll().filter((p) => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID' || p.status === 'ORDERED');

    return purchases.map((p) => {
      const items = this.purchaseRepo.getPurchaseItems(p.id);
      return {
        id: p.id,
        purchaseNumber: p.purchase_number,
        supplierName: p.supplier_name || 'Vendor Supplier',
        purchaseDate: p.purchase_date,
        items: items.map((i) => ({
          id: i.id,
          productVariantId: i.product_variant_id,
          productName: i.product_name || 'Item',
          sku: i.sku || '',
          orderedQuantity: i.quantity,
        })),
      };
    });
  }

  /**
   * Submit receiving report with item-by-item verified count vs ordered count
   */
  submitReceivingReport(input: {
    purchase_id: number;
    notes?: string;
    items: Array<{ product_variant_id: number; received_quantity: number; notes?: string }>;
  }): { success: boolean; id: number; message: string } {
    const staffId = this.getAuthenticatedStaffId();
    const purchase = this.purchaseRepo.getPurchaseById(input.purchase_id);

    if (!purchase) {
      throw new Error(`Purchase order #${input.purchase_id} not found.`);
    }
    if (!input.items || input.items.length === 0) {
      throw new Error('Please provide receiving quantities for incoming items.');
    }

    const poItems = this.purchaseRepo.getPurchaseItems(input.purchase_id);
    const poMap = new Map<number, number>();
    poItems.forEach((i) => poMap.set(i.product_variant_id, i.quantity));

    const recRes = this.db.prepare(`
      INSERT INTO stock_receiving_records (staff_id, purchase_id, notes, status)
      VALUES (?, ?, ?, 'PENDING_VERIFICATION')
    `).run(staffId, input.purchase_id, input.notes || null);

    const receivingId = Number(recRes.lastInsertRowid);
    let totalDiff = 0;

    const itemStmt = this.db.prepare(`
      INSERT INTO stock_receiving_items (
        receiving_record_id, product_variant_id, ordered_quantity, received_quantity, difference, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const it of input.items) {
      const ordered = poMap.get(it.product_variant_id) || 0;
      const diff = it.received_quantity - ordered;
      totalDiff += Math.abs(diff);
      itemStmt.run(receivingId, it.product_variant_id, ordered, it.received_quantity, diff, it.notes || null);
    }

    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'STOCK_RECEIVING_REPORTED',
      entity_type: 'STOCK_RECEIVING',
      entity_id: receivingId,
      new_value: `Submitted receiving report for PO ${purchase.purchase_number}: ${input.items.length} items checked (Discrepancy=${totalDiff})`,
    });

    return {
      success: true,
      id: receivingId,
      message: totalDiff === 0
        ? 'All ordered items verified successfully. Receiving report submitted.'
        : `Discrepancy detected across received items. Report submitted for manager review.`,
    };
  }

  /**
   * Get employee's aggregated inventory history (counts, transfers, receiving reports)
   */
  getInventoryHistory(): Array<{
    id: number;
    type: 'STOCK_COUNT' | 'TRANSFER_REQUEST' | 'RECEIVING_REPORT';
    title: string;
    details: string;
    status: string;
    date: string;
  }> {
    const staffId = this.getAuthenticatedStaffId();
    const historyList: Array<{
      id: number;
      type: 'STOCK_COUNT' | 'TRANSFER_REQUEST' | 'RECEIVING_REPORT';
      title: string;
      details: string;
      status: string;
      date: string;
    }> = [];

    // 1. Stock Counts
    const counts = this.db.prepare(`
      SELECT sc.*, v.sku, p.name as product_name
      FROM stock_counts sc
      JOIN product_variants v ON sc.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE sc.staff_id = ?
      ORDER BY sc.id DESC LIMIT 15
    `).all(staffId) as any[];

    for (const c of counts) {
      historyList.push({
        id: c.id,
        type: 'STOCK_COUNT',
        title: `Stock Count: ${c.product_name}`,
        details: `System: ${c.system_quantity} | Physical: ${c.physical_quantity} (${c.difference >= 0 ? `+${c.difference}` : c.difference})`,
        status: c.status,
        date: c.created_at,
      });
    }

    // 2. Transfers
    const transfers = this.db.prepare(`
      SELECT tr.*, v.sku, p.name as product_name
      FROM stock_transfer_requests tr
      JOIN product_variants v ON tr.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE tr.staff_id = ?
      ORDER BY tr.id DESC LIMIT 15
    `).all(staffId) as any[];

    for (const t of transfers) {
      historyList.push({
        id: t.id,
        type: 'TRANSFER_REQUEST',
        title: `Transfer: ${t.product_name} (${t.quantity} pcs)`,
        details: `${t.from_location} → ${t.to_location}`,
        status: t.status,
        date: t.created_at,
      });
    }

    // 3. Receiving Reports
    const receiving = this.db.prepare(`
      SELECT srr.*, p.purchase_number
      FROM stock_receiving_records srr
      JOIN purchases p ON srr.purchase_id = p.id
      WHERE srr.staff_id = ?
      ORDER BY srr.id DESC LIMIT 15
    `).all(staffId) as any[];

    for (const r of receiving) {
      historyList.push({
        id: r.id,
        type: 'RECEIVING_REPORT',
        title: `Stock Inward: PO ${r.purchase_number}`,
        details: r.notes || 'Inward goods verification report',
        status: r.status,
        date: r.created_at,
      });
    }

    // Sort by date descending
    return historyList.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  }

  /**
   * Get top-level metrics summary
   */
  getMetricsSummary(): StaffInventoryMetrics {
    const staffId = this.getAuthenticatedStaffId();

    const productStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM product_variants
      WHERE is_active = 1
    `).get() as any;

    const taskStats = this.db.prepare(`
      SELECT COUNT(*) as pending_tasks
      FROM inventory_tasks
      WHERE staff_id = ? AND status IN ('PENDING', 'IN_PROGRESS')
    `).get(staffId) as any;

    return {
      totalProducts: productStats?.total_products || 0,
      lowStockCount: productStats?.low_stock || 0,
      outOfStockCount: productStats?.out_of_stock || 0,
      pendingTasksCount: taskStats?.pending_tasks || 0,
    };
  }
}
