import Database from 'better-sqlite3';

export interface DashboardKPIs {
  today_sales: number;
  today_bills: number;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_expenses: number;
  net_operating_result: number;
  products_in_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  customer_outstanding: number;
  supplier_payable: number;
}

export class DashboardService {
  constructor(private db: Database.Database) {}

  getKPIs(startDate?: string, endDate?: string): DashboardKPIs {
    const today = new Date().toISOString().split('T')[0];
    const fromDate = startDate || `${today} 00:00:00`;
    const toDate = endDate || `${today} 23:59:59`;

    // 1. Today's Sales & Bills
    const salesRow: any = this.db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as bill_count
      FROM sales
      WHERE sale_date BETWEEN ? AND ? AND status = 'COMPLETED'
    `).get(fromDate, toDate);

    // 2. Returns in range
    const returnsRow: any = this.db.prepare(`
      SELECT COALESCE(SUM(refund_amount), 0) as total_refunds
      FROM returns
      WHERE return_date BETWEEN ? AND ?
    `).get(fromDate, toDate);

    const grossSales = Number(salesRow?.total_sales || 0);
    const refunds = Number(returnsRow?.total_refunds || 0);
    const netRevenue = Math.max(0, grossSales - refunds);

    // 3. Estimate COGS (Cost of Goods Sold from sale_items)
    const cogsRow: any = this.db.prepare(`
      SELECT COALESCE(SUM(si.quantity * pv.purchase_price), 0) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN product_variants pv ON si.product_variant_id = pv.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
    `).get(fromDate, toDate);

    const totalCogs = Number(cogsRow?.total_cogs || 0);
    const grossProfit = netRevenue - totalCogs;

    // 4. Expenses in range
    const expensesRow: any = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE expense_date BETWEEN ? AND ?
    `).get(fromDate, toDate);

    const totalExpenses = Number(expensesRow?.total_expenses || 0);
    const netOperatingResult = grossProfit - totalExpenses;

    // 5. Inventory Metrics
    const stockRow: any = this.db.prepare(`
      SELECT 
        COALESCE(SUM(current_stock), 0) as total_units,
        SUM(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM product_variants
      WHERE is_active = 1
    `).get();

    // 6. Customer Outstanding
    const custRow: any = this.db.prepare(`
      SELECT COALESCE(SUM(s.total - COALESCE(p.paid, 0)), 0) as outstanding
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(amount) as paid FROM payments GROUP BY sale_id
      ) p ON s.id = p.sale_id
      WHERE s.status = 'COMPLETED' AND s.balance_amount > 0
    `).get();

    // 7. Supplier Payable
    const suppRow: any = this.db.prepare(`
      SELECT COALESCE(SUM(total - paid_amount), 0) as payable
      FROM purchases
      WHERE status IN ('PENDING', 'PARTIALLY_PAID')
    `).get();

    return {
      today_sales: grossSales,
      today_bills: Number(salesRow?.bill_count || 0),
      total_revenue: netRevenue,
      total_cogs: totalCogs,
      gross_profit: grossProfit,
      total_expenses: totalExpenses,
      net_operating_result: netOperatingResult,
      products_in_stock: Number(stockRow?.total_units || 0),
      low_stock_count: Number(stockRow?.low_stock || 0),
      out_of_stock_count: Number(stockRow?.out_of_stock || 0),
      customer_outstanding: Number(custRow?.outstanding || 0),
      supplier_payable: Number(suppRow?.payable || 0),
    };
  }

  getSalesTrend(days: number = 7): { date: string; sales: number }[] {
    return this.db.prepare(`
      SELECT 
        DATE(sale_date) as date,
        COALESCE(SUM(total), 0) as sales
      FROM sales
      WHERE status = 'COMPLETED' AND sale_date >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(sale_date)
      ORDER BY date ASC
    `).all(days) as any[];
  }

  getBestSellers(limit: number = 5): { sku: string; name?: string; total_qty: number; total_revenue: number }[] {
    return this.db.prepare(`
      SELECT 
        pv.sku,
        p.name,
        SUM(si.quantity) as total_qty,
        SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN product_variants pv ON si.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'COMPLETED'
      GROUP BY pv.id
      ORDER BY total_qty DESC
      LIMIT ?
    `).all(limit) as any[];
  }

  getLowStockAlerts(limit: number = 5): any[] {
    return this.db.prepare(`
      SELECT pv.id, pv.sku, p.name as product_name, pv.current_stock, pv.minimum_stock as min_stock_level
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.is_active = 1 AND pv.current_stock <= pv.minimum_stock
      ORDER BY pv.current_stock ASC
      LIMIT ?
    `).all(limit);
  }

  getRecentTransactions(limit: number = 5): any[] {
    return this.db.prepare(`
      SELECT 'SALE' as type, invoice_number as code, total as amount, sale_date as created_at
      FROM sales
      UNION ALL
      SELECT 'PURCHASE' as type, purchase_number as code, total as amount, purchase_date as created_at
      FROM purchases
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
  }
}
