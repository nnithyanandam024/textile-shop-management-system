import { getDatabase } from '../../../database';
import log from '../../../logger';
import {
  AnalyticsTimeframe,
  PeriodComparisonMetrics,
  CategoryVelocityItem,
  HourlySalesDistribution,
  DayOfWeekSalesDistribution,
  CustomerCohortMetrics,
  ProductReturnRateItem,
} from './analyticsTypes';

export class SalesAnalyticsEngine {
  /**
   * Generates SQL date filters for current and previous comparison periods
   */
  public static getDateFilters(timeframe: AnalyticsTimeframe) {
    let currentFilter = "date(sale_date, 'localtime') = date('now', 'localtime')";
    let previousFilter = "date(sale_date, 'localtime') = date('now', '-1 day', 'localtime')";
    let periodLabel = "Today";
    let comparisonLabel = "Yesterday";

    if (timeframe === 'week') {
      currentFilter = "date(sale_date, 'localtime') >= date('now', '-7 days', 'localtime')";
      previousFilter = "date(sale_date, 'localtime') >= date('now', '-14 days', 'localtime') AND date(sale_date, 'localtime') < date('now', '-7 days', 'localtime')";
      periodLabel = "Last 7 Days";
      comparisonLabel = "Previous 7 Days";
    } else if (timeframe === 'month') {
      currentFilter = "date(sale_date, 'localtime') >= date('now', 'start of month', 'localtime')";
      previousFilter = "date(sale_date, 'localtime') >= date('now', 'start of month', '-1 month', 'localtime') AND date(sale_date, 'localtime') < date('now', 'start of month', 'localtime')";
      periodLabel = "This Month";
      comparisonLabel = "Last Month";
    }

    return { currentFilter, previousFilter, periodLabel, comparisonLabel };
  }

  /**
   * 1. Calculates Period Growth & High-Level Financial Metrics
   */
  public static calculatePeriodMetrics(timeframe: AnalyticsTimeframe): PeriodComparisonMetrics {
    const db = getDatabase();
    const { currentFilter, previousFilter } = this.getDateFilters(timeframe);

    const currentStats = db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(COUNT(id), 0) as total_transactions,
        COALESCE(AVG(total), 0) as average_bill,
        COALESCE(SUM(discount), 0) as total_discount
      FROM sales
      WHERE ${currentFilter} AND status = 'COMPLETED'
    `).get() as any;

    const previousStats = db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(COUNT(id), 0) as total_transactions,
        COALESCE(AVG(total), 0) as average_bill
      FROM sales
      WHERE ${previousFilter} AND status = 'COMPLETED'
    `).get() as any;

    const unitsSoldRow = db.prepare(`
      SELECT COALESCE(SUM(si.quantity), 0) as total_units
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE ${currentFilter} AND s.status = 'COMPLETED'
    `).get() as any;

    const returnsRow = db.prepare(`
      SELECT COALESCE(SUM(ri.quantity), 0) as total_returned_units
      FROM return_items ri
      JOIN returns r ON r.id = ri.return_id
      WHERE ${currentFilter} AND r.status = 'COMPLETED'
    `).get() as any;

    const currentSales = Number(currentStats?.total_sales) || 0;
    const previousSales = Number(previousStats?.total_sales) || 0;
    const currentTx = Number(currentStats?.total_transactions) || 0;
    const previousTx = Number(previousStats?.total_transactions) || 0;
    const currentAOV = Math.round(Number(currentStats?.average_bill) || 0);
    const previousAOV = Math.round(Number(previousStats?.average_bill) || 0);
    const totalUnits = Number(unitsSoldRow?.total_units) || 0;
    const returnedUnits = Number(returnsRow?.total_returned_units) || 0;
    const totalDiscounts = Math.round(Number(currentStats?.total_discount) || 0);

    // Growth calculations
    let growthPercentage = 0;
    let growthDirection: 'higher' | 'lower' | 'steady' = 'steady';
    if (previousSales > 0) {
      growthPercentage = Math.round(((currentSales - previousSales) / previousSales) * 100);
      if (growthPercentage > 0) growthDirection = 'higher';
      else if (growthPercentage < 0) growthDirection = 'lower';
    }

    let txGrowthPercentage = 0;
    if (previousTx > 0) {
      txGrowthPercentage = Math.round(((currentTx - previousTx) / previousTx) * 100);
    }

    let aovGrowthPercentage = 0;
    if (previousAOV > 0) {
      aovGrowthPercentage = Math.round(((currentAOV - previousAOV) / previousAOV) * 100);
    }

    const grossSales = currentSales + totalDiscounts;
    const discountRate = grossSales > 0 ? Number(((totalDiscounts / grossSales) * 100).toFixed(1)) : 0;
    const returnRate = totalUnits > 0 ? Number(((returnedUnits / totalUnits) * 100).toFixed(1)) : 0;

    return {
      currentSales,
      previousSales,
      growthPercentage: Math.abs(growthPercentage),
      growthDirection,
      currentTransactions: currentTx,
      previousTransactions: previousTx,
      transactionGrowthPercentage: txGrowthPercentage,
      currentAOV,
      previousAOV,
      aovGrowthPercentage,
      totalUnitsSold: totalUnits,
      totalDiscounts,
      discountRate,
      returnRate,
    };
  }

  /**
   * 2. Calculates Category Velocity and Growth %
   */
  public static calculateCategoryVelocity(timeframe: AnalyticsTimeframe): CategoryVelocityItem[] {
    const db = getDatabase();
    const { currentFilter, previousFilter } = this.getDateFilters(timeframe);

    const currentRows = db.prepare(`
      SELECT 
        c.id,
        c.name as category_name,
        COALESCE(SUM(si.total), 0) as current_revenue,
        COALESCE(SUM(si.quantity), 0) as units_sold
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN sale_items si ON si.product_variant_id = pv.id
      LEFT JOIN sales s ON s.id = si.sale_id AND ${currentFilter} AND s.status = 'COMPLETED'
      WHERE c.is_active = 1
      GROUP BY c.id, c.name
      ORDER BY current_revenue DESC
    `).all() as any[];

    const previousRows = db.prepare(`
      SELECT 
        c.id,
        COALESCE(SUM(si.total), 0) as previous_revenue
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN sale_items si ON si.product_variant_id = pv.id
      LEFT JOIN sales s ON s.id = si.sale_id AND ${previousFilter} AND s.status = 'COMPLETED'
      WHERE c.is_active = 1
      GROUP BY c.id
    `).all() as any[];

    const prevMap = new Map<number, number>();
    previousRows.forEach((r) => prevMap.set(r.id, Number(r.previous_revenue) || 0));

    const totalRevenue = currentRows.reduce((acc, r) => acc + (Number(r.current_revenue) || 0), 0);

    return currentRows.map((r) => {
      const curRev = Math.round(Number(r.current_revenue) || 0);
      const prevRev = Math.round(prevMap.get(r.id) || 0);
      const contributionPct = totalRevenue > 0 ? Number(((curRev / totalRevenue) * 100).toFixed(1)) : 0;

      let growthPct = 0;
      let direction: 'higher' | 'lower' | 'steady' = 'steady';
      if (prevRev > 0) {
        growthPct = Math.round(((curRev - prevRev) / prevRev) * 100);
        if (growthPct > 0) direction = 'higher';
        else if (growthPct < 0) direction = 'lower';
      }

      return {
        id: r.id,
        categoryName: r.category_name,
        currentRevenue: curRev,
        previousRevenue: prevRev,
        revenueContributionPct: contributionPct,
        growthPercentage: Math.abs(growthPct),
        growthDirection: direction,
        unitsSold: Number(r.units_sold) || 0,
      };
    });
  }

  /**
   * 3. Calculates Hourly Sales Distribution and Peak Footfall Hours
   */
  public static calculateHourlyDistribution(timeframe: AnalyticsTimeframe): HourlySalesDistribution[] {
    const db = getDatabase();
    const { currentFilter } = this.getDateFilters(timeframe);

    const rows = db.prepare(`
      SELECT 
        CAST(strftime('%H', sale_date, 'localtime') AS INTEGER) as sale_hour,
        COALESCE(SUM(total), 0) as hour_total,
        COALESCE(COUNT(id), 0) as tx_count
      FROM sales
      WHERE ${currentFilter} AND status = 'COMPLETED'
      GROUP BY sale_hour
      ORDER BY sale_hour ASC
    `).all() as any[];

    const hourMap = new Map<number, { total: number; count: number }>();
    rows.forEach((r) => {
      hourMap.set(Number(r.sale_hour), {
        total: Math.round(Number(r.hour_total) || 0),
        count: Number(r.tx_count) || 0,
      });
    });

    // Generate 24-hour distribution (or store hours 9 AM to 10 PM)
    const result: HourlySalesDistribution[] = [];
    let maxHourSales = 0;

    for (let h = 9; h <= 21; h++) {
      const entry = hourMap.get(h) || { total: 0, count: 0 };
      if (entry.total > maxHourSales) maxHourSales = entry.total;

      const hourLabel = h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
      result.push({
        hour: h,
        hourLabel,
        salesTotal: entry.total,
        transactionCount: entry.count,
        isPeakHour: false,
      });
    }

    // Mark hours with >= 75% of peak volume as Peak Hours
    const peakThreshold = maxHourSales * 0.75;
    result.forEach((item) => {
      if (item.salesTotal > 0 && item.salesTotal >= peakThreshold) {
        item.isPeakHour = true;
      }
    });

    return result;
  }

  /**
   * 4. Calculates Day of Week Sales Distribution (identifies weekend vs weekday multipliers)
   */
  public static calculateDayOfWeekDistribution(timeframe: AnalyticsTimeframe): DayOfWeekSalesDistribution[] {
    const db = getDatabase();
    // Use last 30 days for robust day-of-week distribution
    const rows = db.prepare(`
      SELECT 
        CAST(strftime('%w', sale_date, 'localtime') AS INTEGER) as dow,
        COALESCE(SUM(total), 0) as dow_total,
        COALESCE(COUNT(id), 0) as dow_count
      FROM sales
      WHERE date(sale_date, 'localtime') >= date('now', '-30 days', 'localtime') AND status = 'COMPLETED'
      GROUP BY dow
      ORDER BY dow ASC
    `).all() as any[];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dowMap = new Map<number, { total: number; count: number }>();
    rows.forEach((r) => {
      dowMap.set(Number(r.dow), {
        total: Math.round(Number(r.dow_total) || 0),
        count: Number(r.dow_count) || 0,
      });
    });

    const totalPeriodSales = Array.from(dowMap.values()).reduce((acc, v) => acc + v.total, 0);

    return dayNames.map((name, idx) => {
      const entry = dowMap.get(idx) || { total: 0, count: 0 };
      const pct = totalPeriodSales > 0 ? Number(((entry.total / totalPeriodSales) * 100).toFixed(1)) : 0;
      const isWeekend = idx === 0 || idx === 6;

      return {
        dayOfWeek: idx,
        dayName: name,
        salesTotal: entry.total,
        transactionCount: entry.count,
        percentageOfWeeklyTotal: pct,
        isWeekend,
      };
    });
  }

  /**
   * 5. Calculates Customer Cohort Metrics (Privacy-Preserved: No PII)
   */
  public static calculateCustomerCohorts(timeframe: AnalyticsTimeframe): CustomerCohortMetrics {
    const db = getDatabase();
    const { currentFilter } = this.getDateFilters(timeframe);

    const cohortStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT s.customer_id) as total_customers,
        COALESCE(SUM(CASE WHEN c.customer_code = 'CUST-0000' OR date(c.created_at, 'localtime') = date(s.sale_date, 'localtime') THEN s.total ELSE 0 END), 0) as new_cust_sales,
        COALESCE(COUNT(CASE WHEN c.customer_code = 'CUST-0000' OR date(c.created_at, 'localtime') = date(s.sale_date, 'localtime') THEN s.id END), 0) as new_cust_bills,
        COALESCE(SUM(CASE WHEN c.customer_code != 'CUST-0000' AND date(c.created_at, 'localtime') < date(s.sale_date, 'localtime') THEN s.total ELSE 0 END), 0) as returning_cust_sales,
        COALESCE(COUNT(CASE WHEN c.customer_code != 'CUST-0000' AND date(c.created_at, 'localtime') < date(s.sale_date, 'localtime') THEN s.id END), 0) as returning_cust_bills
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      WHERE ${currentFilter} AND s.status = 'COMPLETED'
    `).get() as any;

    const newSales = Math.round(Number(cohortStats?.new_cust_sales) || 0);
    const returningSales = Math.round(Number(cohortStats?.returning_cust_sales) || 0);
    const totalSales = newSales + returningSales;

    const newSalesPct = totalSales > 0 ? Number(((newSales / totalSales) * 100).toFixed(1)) : 0;
    const returningSalesPct = totalSales > 0 ? Number(((returningSales / totalSales) * 100).toFixed(1)) : 0;

    return {
      totalActiveCustomers: Number(cohortStats?.total_customers) || 0,
      newCustomersCount: Number(cohortStats?.new_cust_bills) || 0,
      newCustomerRevenue: newSales,
      newCustomerRevenuePct: newSalesPct,
      returningCustomersCount: Number(cohortStats?.returning_cust_bills) || 0,
      returningCustomerRevenue: returningSales,
      returningCustomerRevenuePct: returningSalesPct,
      repeatPurchaseRate: returningSalesPct,
    };
  }

  /**
   * 6. Calculates Product Return Rates and Flags High-Risk Returns
   */
  public static calculateProductReturnRates(timeframe: AnalyticsTimeframe): ProductReturnRateItem[] {
    const db = getDatabase();
    const { currentFilter } = this.getDateFilters(timeframe);

    const rows = db.prepare(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        pv.sku,
        c.name as category_name,
        COALESCE(SUM(si.quantity), 0) as units_sold,
        COALESCE(
          (SELECT SUM(ri.quantity) 
           FROM return_items ri 
           JOIN returns r ON r.id = ri.return_id 
           WHERE ri.product_variant_id = pv.id AND ${currentFilter} AND r.status = 'COMPLETED'), 0
        ) as units_returned,
        COALESCE(
          (SELECT SUM(ri.refund_amount) 
           FROM return_items ri 
           JOIN returns r ON r.id = ri.return_id 
           WHERE ri.product_variant_id = pv.id AND ${currentFilter} AND r.status = 'COMPLETED'), 0
        ) as refund_amount
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN sale_items si ON si.product_variant_id = pv.id
      LEFT JOIN sales s ON s.id = si.sale_id AND ${currentFilter} AND s.status = 'COMPLETED'
      GROUP BY pv.id
      HAVING units_sold > 0 OR units_returned > 0
      ORDER BY units_returned DESC, units_sold DESC
      LIMIT 10
    `).all() as any[];

    return rows.map((r) => {
      const sold = Number(r.units_sold) || 0;
      const returned = Number(r.units_returned) || 0;
      const returnRate = sold > 0 ? Number(((returned / sold) * 100).toFixed(1)) : (returned > 0 ? 100 : 0);
      const isHighRisk = returnRate > 8.0 && returned >= 2;

      return {
        productId: r.product_id,
        productName: r.product_name,
        sku: r.sku,
        categoryName: r.category_name,
        unitsSold: sold,
        unitsReturned: returned,
        returnRatePct: returnRate,
        refundAmount: Math.round(Number(r.refund_amount) || 0),
        commonReason: isHighRisk ? 'Sizing misfit or fabric expectation' : 'Standard exchange',
        isHighRisk,
      };
    });
  }
}
