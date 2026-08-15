import Database from 'better-sqlite3';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  supplierId?: number;
  customerId?: number;
}

export class ReportService {
  constructor(private db: Database.Database) {}

  getSalesReport(filter: ReportFilter) {
    const fromDate = filter.startDate || '1970-01-01 00:00:00';
    const toDate = filter.endDate || '2099-12-31 23:59:59';

    const invoices = this.db.prepare(`
      SELECT s.*, c.name as customer_name, u.display_name as employee_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
      ORDER BY s.id DESC
    `).all(fromDate, toDate);

    const productSales = this.db.prepare(`
      SELECT pv.sku, p.name as product_name, SUM(si.quantity) as qty_sold, SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN product_variants pv ON si.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
      GROUP BY pv.id
      ORDER BY total_revenue DESC
    `).all(fromDate, toDate);

    const categorySales = this.db.prepare(`
      SELECT cat.name as category_name, SUM(si.quantity) as qty_sold, SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN product_variants pv ON si.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN categories cat ON p.category_id = cat.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
      GROUP BY cat.id
      ORDER BY total_revenue DESC
    `).all(fromDate, toDate);

    const paymentSales = this.db.prepare(`
      SELECT p.payment_method, SUM(p.amount) as total_amount
      FROM payments p
      JOIN sales s ON p.sale_id = s.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
      GROUP BY p.payment_method
    `).all(fromDate, toDate);

    return {
      invoices,
      productSales,
      categorySales,
      paymentSales,
    };
  }

  getInventoryReport() {
    const currentStock = this.db.prepare(`
      SELECT pv.id, pv.sku, p.name as product_name, cat.name as category_name,
             pv.current_stock, pv.minimum_stock as min_stock_level, pv.purchase_price, pv.selling_price,
             (pv.current_stock * pv.purchase_price) as stock_valuation
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE pv.is_active = 1
      ORDER BY pv.current_stock ASC
    `).all();

    const lowStock = currentStock.filter((it: any) => it.current_stock <= it.min_stock_level);
    const outOfStock = currentStock.filter((it: any) => it.current_stock === 0);

    // Dead Stock: Variants with 0 sales in past 90 days
    const deadStock = this.db.prepare(`
      SELECT pv.sku, p.name as product_name, pv.current_stock, MAX(s.sale_date) as last_sold_date
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN sale_items si ON pv.id = si.product_variant_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE pv.is_active = 1 AND pv.current_stock > 0
      GROUP BY pv.id
      HAVING last_sold_date IS NULL OR last_sold_date < DATE('now', '-90 days')
    `).all();

    const totalValuation = currentStock.reduce((sum: number, it: any) => sum + (it.stock_valuation || 0), 0);

    return {
      currentStock,
      lowStock,
      outOfStock,
      deadStock,
      totalValuation,
    };
  }

  getFinancialReport(filter: ReportFilter) {
    const fromDate = filter.startDate || '1970-01-01 00:00:00';
    const toDate = filter.endDate || '2099-12-31 23:59:59';

    const sales: any = this.db.prepare(`
      SELECT COALESCE(SUM(total), 0) as gross_sales, COALESCE(SUM(discount), 0) as total_discount, COALESCE(SUM(tax), 0) as total_tax
      FROM sales WHERE sale_date BETWEEN ? AND ? AND status = 'COMPLETED'
    `).get(fromDate, toDate);

    const returns: any = this.db.prepare(`
      SELECT COALESCE(SUM(refund_amount), 0) as total_returns
      FROM returns WHERE return_date BETWEEN ? AND ?
    `).get(fromDate, toDate);

    const cogs: any = this.db.prepare(`
      SELECT COALESCE(SUM(si.quantity * pv.purchase_price), 0) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN product_variants pv ON si.product_variant_id = pv.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
    `).get(fromDate, toDate);

    const expenses: any = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses WHERE expense_date BETWEEN ? AND ?
    `).get(fromDate, toDate);

    const grossSales = Number(sales?.gross_sales || 0);
    const totalReturns = Number(returns?.total_returns || 0);
    const netRevenue = Math.max(0, grossSales - totalReturns);
    const totalCogs = Number(cogs?.total_cogs || 0);
    const grossProfit = netRevenue - totalCogs;
    const totalExpenses = Number(expenses?.total_expenses || 0);
    const netOperatingResult = grossProfit - totalExpenses;

    return {
      grossSales,
      totalReturns,
      netRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netOperatingResult,
      totalDiscount: Number(sales?.total_discount || 0),
      totalTax: Number(sales?.total_tax || 0),
    };
  }

  getCustomerReport() {
    return this.db.prepare(`
      SELECT c.*, 
             COALESCE(SUM(s.total), 0) as total_purchases,
             COALESCE(SUM(s.total - COALESCE(p.paid, 0)), 0) as outstanding_balance
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id AND s.status = 'COMPLETED'
      LEFT JOIN (
        SELECT sale_id, SUM(amount) as paid FROM payments GROUP BY sale_id
      ) p ON s.id = p.sale_id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY total_purchases DESC
    `).all();
  }

  getSupplierReport() {
    return this.db.prepare(`
      SELECT s.*, 
             COALESCE(SUM(p.total), 0) as total_purchased,
             COALESCE(SUM(p.total - p.paid_amount), 0) as payable_balance
      FROM suppliers s
      LEFT JOIN purchases p ON s.id = p.supplier_id AND p.status != 'CANCELLED'
      WHERE s.is_active = 1
      GROUP BY s.id
      ORDER BY total_purchased DESC
    `).all();
  }

  exportToCSV(data: any[], headers: { key: string; label: string }[]): string {
    if (!data || data.length === 0) return '';

    const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [headerRow, ...rows].join('\n');
  }
}
