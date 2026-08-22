import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';

export interface StaffSalesReportData {
  period: string;
  totalSalesVolume: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscountGiven: number;
  totalReturnsCount: number;
  totalRefundAmount: number;
  tenderBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  topProducts: Array<{
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  recentSales: Array<{
    id: number;
    invoiceNumber: string;
    total: number;
    saleDate: string;
    customerName: string;
    paymentMethod: string;
    itemsCount: number;
  }>;
}

export interface StaffAttendanceReportData {
  monthYear: string;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  lateArrivals: number;
  totalWorkedHours: number;
  averageDailyHours: number;
  dailyLogs: Array<{
    id: number;
    date: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    totalHours?: number;
    isLate: boolean;
  }>;
}

export interface StaffCommissionReportData {
  period: string;
  totalSalesVolume: number;
  commissionableVolume: number;
  commissionRate: number;
  commissionEarned: number;
  payoutStatus: 'PROCESSING' | 'FINALIZED' | 'PAID';
  recentCommissionSales: Array<{
    invoiceNumber: string;
    saleDate: string;
    saleTotal: number;
    commissionAmount: number;
    customerName: string;
  }>;
}

export interface StaffInventoryTasksReportData {
  stockCountsAssigned: number;
  stockCountsCompleted: number;
  stockMovementsHandled: number;
  adjustmentsSubmitted: number;
  recentTransactions: Array<{
    id: number;
    productName: string;
    sku: string;
    transactionType: string;
    quantity: number;
    createdAt: string;
    notes?: string;
  }>;
}

export class StaffReportsService {
  constructor(private db: Database.Database) {}

  private resolveUserId(staffId?: number): number | null {
    if (!staffId) {
      const session = SessionService.getSession();
      return session?.userId || null;
    }
    const row = this.db.prepare('SELECT user_id FROM staff WHERE id = ?').get(staffId) as { user_id: number } | undefined;
    return row?.user_id || null;
  }

  private resolveStaffId(staffId?: number): number {
    if (staffId) return staffId;
    const session = SessionService.getSession();
    if (session?.staffId) return session.staffId;
    if (session?.userId) {
      const row = this.db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as { id: number } | undefined;
      if (row) return row.id;
    }
    return 1;
  }

  /**
   * 1. Scoped Staff Sales Report
   */
  getStaffSalesReport(staffId?: number, filters?: { period?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'; startDate?: string; endDate?: string }): StaffSalesReportData {
    const sId = this.resolveStaffId(staffId);
    const userId = this.resolveUserId(sId);
    const period = filters?.period || 'TODAY';

    let dateFilter = '1=1';
    if (period === 'TODAY') {
      dateFilter = "date(s.sale_date, 'localtime') = date('now', 'localtime')";
    } else if (period === 'THIS_WEEK') {
      dateFilter = "date(s.sale_date, 'localtime') >= date('now', 'localtime', 'weekday 0', '-6 days')";
    } else if (period === 'THIS_MONTH') {
      dateFilter = "strftime('%Y-%m', s.sale_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
    } else if (filters?.startDate && filters?.endDate) {
      dateFilter = `date(s.sale_date, 'localtime') BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
    }

    // Totals & Items
    const totalsRow = this.db.prepare(`
      SELECT 
        COALESCE(SUM(s.total), 0) as total_volume,
        COUNT(DISTINCT s.id) as orders_count,
        COALESCE(SUM(s.discount), 0) as total_discount,
        COALESCE(SUM(si.quantity), 0) as items_sold
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE (s.created_by = ? OR ? IS NULL) AND s.status = 'COMPLETED' AND ${dateFilter}
    `).get(userId, userId) as any;

    const totalSalesVolume = totalsRow?.total_volume || 0;
    const totalOrdersCount = totalsRow?.orders_count || 0;
    const totalItemsSold = totalsRow?.items_sold || 0;
    const totalDiscountGiven = totalsRow?.total_discount || 0;
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesVolume / totalOrdersCount) : 0;

    // Returns
    const returnRow = this.db.prepare(`
      SELECT COUNT(*) as return_count, COALESCE(SUM(refund_amount), 0) as refund_total
      FROM returns
      WHERE (created_by = ? OR ? IS NULL) AND ${dateFilter.replace(/s\.sale_date/g, 'return_date')}
    `).get(userId, userId) as any;

    // Tender Breakdown
    const tenderRows = this.db.prepare(`
      SELECT p.payment_method, COUNT(*) as count, SUM(p.amount) as amount
      FROM payments p
      JOIN sales s ON p.sale_id = s.id
      WHERE (s.created_by = ? OR ? IS NULL) AND s.status = 'COMPLETED' AND ${dateFilter}
      GROUP BY p.payment_method
    `).all(userId, userId) as any[];

    const totalTender = tenderRows.reduce((sum, t) => sum + (t.amount || 0), 0);
    const tenderBreakdown = tenderRows.map((t) => ({
      method: t.payment_method || 'CASH',
      count: t.count || 0,
      amount: t.amount || 0,
      percentage: totalTender > 0 ? Math.round(((t.amount || 0) / totalTender) * 100) : 0,
    }));

    // Top Products Sold
    const topProdRows = this.db.prepare(`
      SELECT p.name as product_name, pv.sku, SUM(si.quantity) as quantity, SUM(si.total) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN product_variants pv ON si.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE (s.created_by = ? OR ? IS NULL) AND s.status = 'COMPLETED' AND ${dateFilter}
      GROUP BY pv.id
      ORDER BY quantity DESC LIMIT 5
    `).all(userId, userId) as any[];

    // Recent Sales
    const recentSales = this.db.prepare(`
      SELECT s.id, s.invoice_number, s.total, s.sale_date, c.name as customer_name,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count,
             COALESCE((SELECT payment_method FROM payments WHERE sale_id = s.id LIMIT 1), 'CASH') as payment_method
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE (s.created_by = ? OR ? IS NULL) AND s.status = 'COMPLETED' AND ${dateFilter}
      ORDER BY s.id DESC LIMIT 10
    `).all(userId, userId) as any[];

    return {
      period,
      totalSalesVolume,
      totalOrdersCount,
      averageOrderValue,
      totalItemsSold,
      totalDiscountGiven,
      totalReturnsCount: returnRow?.return_count || 0,
      totalRefundAmount: returnRow?.refund_total || 0,
      tenderBreakdown,
      topProducts: topProdRows.map((p) => ({
        productName: p.product_name,
        sku: p.sku,
        quantity: p.quantity || 0,
        revenue: p.revenue || 0,
      })),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoice_number,
        total: s.total,
        saleDate: s.sale_date,
        customerName: s.customer_name,
        paymentMethod: s.payment_method,
        itemsCount: s.items_count,
      })),
    };
  }

  /**
   * 2. Scoped Staff Attendance & Hours Report
   */
  getStaffAttendanceReport(staffId?: number, monthYear?: string): StaffAttendanceReportData {
    const sId = this.resolveStaffId(staffId);
    const targetMonth = monthYear || new Date().toISOString().slice(0, 7);

    const logs = this.db.prepare(`
      SELECT id, attendance_date as date, status, check_in as check_in_time, check_out as check_out_time, worked_minutes, late_minutes
      FROM attendance
      WHERE staff_id = ? AND strftime('%Y-%m', attendance_date) = ?
      ORDER BY attendance_date DESC
    `).all(sId, targetMonth) as any[];

    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let lateArrivals = 0;
    let totalWorkedHours = 0;

    for (const l of logs) {
      const hours = (l.worked_minutes || 0) / 60 || 8.0;
      if (l.status === 'PRESENT' || l.status === 'HALF_DAY') {
        presentDays += 1;
        totalWorkedHours += hours;
        if (l.late_minutes > 0) lateArrivals += 1;
      } else if (l.status === 'LEAVE' || l.status === 'ON_LEAVE') {
        leaveDays += 1;
      } else if (l.status === 'ABSENT') {
        absentDays += 1;
      }
    }

    const averageDailyHours = presentDays > 0 ? Number((totalWorkedHours / presentDays).toFixed(1)) : 0;

    return {
      monthYear: targetMonth,
      presentDays,
      leaveDays,
      absentDays,
      lateArrivals,
      totalWorkedHours: Number(totalWorkedHours.toFixed(1)),
      averageDailyHours,
      dailyLogs: logs.map((l) => ({
        id: l.id,
        date: l.date,
        status: l.status,
        checkInTime: l.check_in_time || undefined,
        checkOutTime: l.check_out_time || undefined,
        totalHours: Number(((l.worked_minutes || 480) / 60).toFixed(1)),
        isLate: Boolean(l.late_minutes && l.late_minutes > 0),
      })),
    };
  }

  /**
   * 3. Scoped Staff Commission Report
   */
  getStaffCommissionReport(staffId?: number, period: string = 'THIS_MONTH'): StaffCommissionReportData {
    const sId = this.resolveStaffId(staffId);
    const userId = this.resolveUserId(sId);

    let dateFilter = '1=1';
    if (period === 'THIS_MONTH') {
      dateFilter = "strftime('%Y-%m', s.sale_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
    } else if (period === 'THIS_WEEK') {
      dateFilter = "date(s.sale_date, 'localtime') >= date('now', 'localtime', 'weekday 0', '-6 days')";
    }

    // Rate
    const commConfig = this.db.prepare(`
      SELECT commission_rate FROM staff_sales_commissions WHERE staff_id = ? AND status = 'ACTIVE'
    `).get(sId) as { commission_rate: number } | undefined;
    const commissionRate = commConfig?.commission_rate || 1.5;

    // Volume
    const volRow = this.db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total_volume
      FROM sales s
      WHERE (s.created_by = ? OR ? IS NULL) AND s.status = 'COMPLETED' AND ${dateFilter}
    `).get(userId, userId) as any;

    const totalSalesVolume = volRow?.total_volume || 0;
    const commissionEarned = Math.round((totalSalesVolume * commissionRate) / 100);

    // Recent Sales
    const recent = this.db.prepare(`
      SELECT s.invoice_number, s.sale_date, s.total, c.name as customer_name
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE (s.created_by = ? OR ? IS NULL) AND s.status = 'COMPLETED' AND ${dateFilter}
      ORDER BY s.id DESC LIMIT 10
    `).all(userId, userId) as any[];

    return {
      period,
      totalSalesVolume,
      commissionableVolume: totalSalesVolume,
      commissionRate,
      commissionEarned,
      payoutStatus: 'PROCESSING',
      recentCommissionSales: recent.map((r) => ({
        invoiceNumber: r.invoice_number,
        saleDate: r.sale_date,
        saleTotal: r.total,
        commissionAmount: Math.round((r.total * commissionRate) / 100),
        customerName: r.customer_name,
      })),
    };
  }

  /**
   * 4. Scoped Staff Inventory Operations Report
   */
  getStaffInventoryTasksReport(staffId?: number): StaffInventoryTasksReportData {
    const sId = this.resolveStaffId(staffId);
    const userId = this.resolveUserId(sId);

    // Counts
    const countsAssignedRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM stock_counts WHERE (staff_id = ? OR ? IS NULL)
    `).get(sId, sId) as any;

    const countsCompletedRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM stock_counts 
      WHERE (staff_id = ? OR ? IS NULL) AND status IN ('SUBMITTED', 'RECONCILED', 'APPROVED')
    `).get(sId, sId) as any;

    // Stock Transactions
    const movementsRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM stock_transactions WHERE (created_by = ? OR ? IS NULL)
    `).get(userId, userId) as any;

    const recentTx = this.db.prepare(`
      SELECT st.id, st.transaction_type, st.quantity, st.notes, st.created_at,
             pv.sku, p.name as product_name
      FROM stock_transactions st
      JOIN product_variants pv ON st.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE (st.created_by = ? OR ? IS NULL)
      ORDER BY st.id DESC LIMIT 10
    `).all(userId, userId) as any[];

    return {
      stockCountsAssigned: countsAssignedRow?.count || 0,
      stockCountsCompleted: countsCompletedRow?.count || 0,
      stockMovementsHandled: movementsRow?.count || 0,
      adjustmentsSubmitted: 0,
      recentTransactions: recentTx.map((t) => ({
        id: t.id,
        productName: t.product_name,
        sku: t.sku,
        transactionType: t.transaction_type,
        quantity: t.quantity,
        createdAt: t.created_at,
        notes: t.notes || undefined,
      })),
    };
  }
}
