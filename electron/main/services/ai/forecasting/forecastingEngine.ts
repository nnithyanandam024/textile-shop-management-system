import { getDatabase } from '../../../database';
import { WeeklyDemandDataPoint, ForecastConfidence } from './forecastingTypes';

export class ForecastingEngine {
  /**
   * Calculates Average Daily Demand (ADD) with recency weighting over the last 60 days
   */
  public static calculateAverageDailyDemand(variantId: number): { add: number; totalSold60d: number; daysSinceLastSale: number } {
    const db = getDatabase();

    // 1. Sales in the last 30 days (weight = 0.65)
    const row30 = db.prepare(`
      SELECT 
        COALESCE(SUM(si.quantity), 0) as units_sold
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.product_variant_id = ?
        AND date(s.sale_date, 'localtime') >= date('now', '-30 days', 'localtime')
        AND s.status = 'COMPLETED'
    `).get(variantId) as any;

    // 2. Sales in 31-60 days prior (weight = 0.35)
    const row60 = db.prepare(`
      SELECT 
        COALESCE(SUM(si.quantity), 0) as units_sold
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.product_variant_id = ?
        AND date(s.sale_date, 'localtime') >= date('now', '-60 days', 'localtime')
        AND date(s.sale_date, 'localtime') < date('now', '-30 days', 'localtime')
        AND s.status = 'COMPLETED'
    `).get(variantId) as any;

    // 3. Days since last sale
    const lastSaleRow = db.prepare(`
      SELECT 
        CAST(julianday('now', 'localtime') - julianday(MAX(s.sale_date), 'localtime') AS INTEGER) as days_ago
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.product_variant_id = ? AND s.status = 'COMPLETED'
    `).get(variantId) as any;

    const units30 = Number(row30?.units_sold) || 0;
    const unitsPrev30 = Number(row60?.units_sold) || 0;
    const totalSold60d = units30 + unitsPrev30;
    const daysSinceLastSale = lastSaleRow?.days_ago !== null && lastSaleRow?.days_ago !== undefined ? Number(lastSaleRow.days_ago) : 999;

    // Daily demand calculation: time-weighted daily rate
    const dailyRateRecent = units30 / 30;
    const dailyRatePrior = unitsPrev30 / 30;
    let add = 0;

    if (totalSold60d > 0) {
      add = Number((dailyRateRecent * 0.7 + dailyRatePrior * 0.3).toFixed(2));
      if (add < 0.05 && totalSold60d > 0) add = 0.05;
    }

    return { add, totalSold60d, daysSinceLastSale };
  }

  /**
   * Projects demand over specified future day horizon (7, 14, 30 days)
   */
  public static projectDemand(add: number, days: number, categoryMultiplier = 1.0): number {
    const rawDemand = add * days * categoryMultiplier;
    return Math.max(1, Math.round(rawDemand));
  }

  /**
   * Generates a weekly timeline combining 6 weeks of historical sales + 4 weeks of projected demand
   */
  public static generateDemandTimeline(variantId: number, add: number): WeeklyDemandDataPoint[] {
    const db = getDatabase();
    const timeline: WeeklyDemandDataPoint[] = [];

    // Query past 6 weeks
    for (let i = 6; i >= 1; i--) {
      const startDay = i * 7;
      const endDay = (i - 1) * 7;

      const row = db.prepare(`
        SELECT COALESCE(SUM(si.quantity), 0) as weekly_units
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE si.product_variant_id = ?
          AND date(s.sale_date, 'localtime') >= date('now', '-${startDay} days', 'localtime')
          AND date(s.sale_date, 'localtime') < date('now', '-${endDay} days', 'localtime')
          AND s.status = 'COMPLETED'
      `).get(variantId) as any;

      const actualUnits = Number(row?.weekly_units) || 0;
      timeline.push({
        weekLabel: `Wk -${i}`,
        dateLabel: `${startDay}d ago`,
        actualUnits,
        isForecast: false,
      });
    }

    // Generate next 4 projected weeks
    const weeklyProjected = Math.max(1, Math.round(add * 7));
    for (let j = 1; j <= 4; j++) {
      timeline.push({
        weekLabel: `+Wk ${j}`,
        dateLabel: `Next ${j * 7}d`,
        projectedUnits: weeklyProjected,
        isForecast: true,
      });
    }

    return timeline;
  }

  /**
   * Assesses statistical confidence based on volume and data maturity
   */
  public static assessConfidence(totalSold60d: number, daysSinceLastSale: number): ForecastConfidence {
    if (totalSold60d >= 25 && daysSinceLastSale <= 7) return 'high';
    if (totalSold60d >= 8 && daysSinceLastSale <= 21) return 'medium';
    return 'low';
  }
}
