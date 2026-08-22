import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initDatabase } from '../../electron/main/database';
import { seedDatabase } from '../../electron/main/database/seed';
import { DashboardService } from '../../electron/main/services/dashboardService';
import { ReportService } from '../../electron/main/services/reportService';
import { SalesService } from '../../electron/main/services/salesService';
import { PurchaseService } from '../../electron/main/services/purchaseService';
import { ExpenseService } from '../../electron/main/services/expenseService';
import { ProductRepository } from '../../electron/main/repositories/productRepository';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../.test_db/test_phase8.db');

describe('Phase 8 Dashboard, Reports & Business Analytics Test Suite', () => {
  let db: Database.Database;
  let dashboardService: DashboardService;
  let reportService: ReportService;
  let salesService: SalesService;
  let purchaseService: PurchaseService;
  let expenseService: ExpenseService;
  let productRepo: ProductRepository;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    db = initDatabase(TEST_DB_PATH);
    seedDatabase(db);

    dashboardService = new DashboardService(db);
    reportService = new ReportService(db);
    salesService = new SalesService(db);
    purchaseService = new PurchaseService(db);
    expenseService = new ExpenseService(db);
    productRepo = new ProductRepository(db);
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it("1. should calculate dashboard KPIs accurately for today's sales, revenue, profit, stock, and expenses", () => {
    // 1. Create Product & Variant
    const prodId = productRepo.createProduct({ name: 'Silk Dupatta', category_id: 1, brand_id: 1 });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'SLK-[#DUP]-RED',
      purchase_price: 400,
      selling_price: 1000,
      current_stock: 15,
      minimum_stock: 20, // Should trigger low stock alert
    });

    // 2. Perform POS Sale
    const saleRes = salesService.createSale({
      customer_id: 1,
      items: [{ product_variant_id: varId, quantity: 2, unit_price: 1000, discount: 0 }],
      payments: [{ payment_method: 'CASH', amount: 2000 }],
      subtotal: 2000,
      total: 2000,
    });
    expect(saleRes.success).toBe(true);

    // 3. Record Shop Expense
    expenseService.createExpense({
      amount: 500,
      category_name: 'Electricity',
      payment_method: 'CASH',
    });

    // 4. Query Dashboard KPIs
    const kpis = dashboardService.getKPIs();
    expect(kpis.today_sales).toBe(2000);
    expect(kpis.today_bills).toBe(1);
    expect(kpis.total_revenue).toBe(2000);
    expect(kpis.total_cogs).toBe(800); // 2 units * 400 cost
    expect(kpis.gross_profit).toBe(1200); // 2000 - 800
    expect(kpis.total_expenses).toBe(500);
    expect(kpis.net_operating_result).toBe(700); // 1200 - 500
    expect(kpis.low_stock_count).toBeGreaterThan(0);
  });

  it('2. should aggregate sales trend and best selling products list', () => {
    const prodId = productRepo.createProduct({ name: 'Designer Shirt', category_id: 1, brand_id: 1 });
    const varId = productRepo.createVariant({
      product_id: prodId,
      sku: 'DSG-SHR-XL',
      purchase_price: 600,
      selling_price: 1200,
      current_stock: 50,
    });

    salesService.createSale({
      customer_id: 1,
      items: [{ product_variant_id: varId, quantity: 5, unit_price: 1200, discount: 0 }],
      payments: [{ payment_method: 'UPI', amount: 6000 }],
      subtotal: 6000,
      total: 6000,
    });

    const bestSellers = dashboardService.getBestSellers(5);
    expect(bestSellers.length).toBeGreaterThan(0);
    expect(bestSellers[0].sku).toBe('DSG-SHR-XL');
    expect(bestSellers[0].total_qty).toBe(5);

    const trend = dashboardService.getSalesTrend(7);
    expect(trend.length).toBeGreaterThan(0);
  });

  it('3. should generate inventory valuation, low stock, out of stock, and dead stock reports', () => {
    const invReport = reportService.getInventoryReport();
    expect(invReport.currentStock).toBeDefined();
    expect(invReport.totalValuation).toBeGreaterThanOrEqual(0);
    expect(invReport.deadStock).toBeDefined();
  });

  it('4. should calculate Financial P&L Statement (Revenue - COGS - Expenses = Operating Result)', () => {
    const finReport = reportService.getFinancialReport({});
    expect(finReport.grossSales).toBeDefined();
    expect(finReport.netRevenue).toBe(finReport.grossSales - finReport.totalReturns);
    expect(finReport.grossProfit).toBe(finReport.netRevenue - finReport.totalCogs);
    expect(finReport.netOperatingResult).toBe(finReport.grossProfit - finReport.totalExpenses);
  });

  it('5. should format universal CSV data string properly for reports export', () => {
    const data = [
      { code: 'CUS-001', name: 'Ravi Kumar', balance: 5000 },
      { code: 'CUS-002', name: 'Priya "Special" S', balance: 1200 },
    ];
    const headers = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Customer Name' },
      { key: 'balance', label: 'Balance' },
    ];

    const csv = reportService.exportToCSV(data, headers);
    expect(csv).toContain('"Code","Customer Name","Balance"');
    expect(csv).toContain('"CUS-001","Ravi Kumar","5000"');
    expect(csv).toContain('"Priya ""Special"" S"'); // Quote escaping check
  });
});
