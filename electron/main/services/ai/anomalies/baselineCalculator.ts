import { getDatabase } from '../../../database';

export interface StoreBaselines {
  avgDiscountPercent: number;
  maxNormalDiscountPercent: number;
  avgDailySalesRevenue: number;
  minNormalDailySales: number;
  maxNormalDailySales: number;
  avgDailyReturnCount: number;
  maxNormalReturnCount: number;
  operatingHoursStart: number; // 9 = 9 AM
  operatingHoursEnd: number; // 21 = 9 PM
}

export class BaselineCalculator {
  public static calculateBaselines(): StoreBaselines {
    const db = getDatabase();

    // Default benchmarks for textile showrooms
    let avgDiscountPercent = 8.5;
    let maxNormalDiscountPercent = 20.0;
    let avgDailySalesRevenue = 65000;
    let minNormalDailySales = 25000;
    let maxNormalDailySales = 150000;
    let avgDailyReturnCount = 4;
    let maxNormalReturnCount = 12;

    try {
      // 1. Discount Baseline
      const discRow = db.prepare(`
        SELECT 
          AVG(discount) as avg_disc,
          MAX(discount) as max_disc
        FROM sales 
        WHERE status = 'COMPLETED' AND discount > 0
      `).get() as any;

      if (discRow && discRow.avg_disc) {
        avgDiscountPercent = Number(Number(discRow.avg_disc).toFixed(1));
        maxNormalDiscountPercent = Math.min(30, Math.max(20, avgDiscountPercent * 2.2));
      }

      // 2. Sales Baseline (Last 30 Days)
      const salesRow = db.prepare(`
        SELECT 
          AVG(daily_total) as avg_daily_rev,
          MIN(daily_total) as min_daily_rev,
          MAX(daily_total) as max_daily_rev
        FROM (
          SELECT DATE(sale_date) as day, SUM(total) as daily_total
          FROM sales
          WHERE status = 'COMPLETED'
          GROUP BY DATE(sale_date)
        )
      `).get() as any;

      if (salesRow && salesRow.avg_daily_rev) {
        avgDailySalesRevenue = Math.round(Number(salesRow.avg_daily_rev));
        minNormalDailySales = Math.max(15000, Math.round(avgDailySalesRevenue * 0.4));
        maxNormalDailySales = Math.round(avgDailySalesRevenue * 2.5);
      }
    } catch {
      // Fall back to textile retail defaults
    }

    return {
      avgDiscountPercent,
      maxNormalDiscountPercent,
      avgDailySalesRevenue,
      minNormalDailySales,
      maxNormalDailySales,
      avgDailyReturnCount,
      maxNormalReturnCount,
      operatingHoursStart: 9,
      operatingHoursEnd: 21,
    };
  }
}
