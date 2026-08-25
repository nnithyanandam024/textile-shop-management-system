import {
  AnalyticsTimeframe,
  PeriodComparisonMetrics,
  CategoryVelocityItem,
  HourlySalesDistribution,
  DayOfWeekSalesDistribution,
  CustomerCohortMetrics,
  ProductReturnRateItem,
  SmartInsight,
  SalesAnalyticsPayload,
} from './analyticsTypes';
import { SalesAnalyticsEngine } from './salesAnalyticsEngine';

export class InsightGenerator {
  /**
   * Generates proactive, categorized, and confidence-rated insights for a given timeframe
   */
  public static generateInsights(
    timeframe: AnalyticsTimeframe,
    periodMetrics: PeriodComparisonMetrics,
    categories: CategoryVelocityItem[],
    hourly: HourlySalesDistribution[],
    dayOfWeek: DayOfWeekSalesDistribution[],
    cohorts: CustomerCohortMetrics,
    returns: ProductReturnRateItem[]
  ): SmartInsight[] {
    const insights: SmartInsight[] = [];
    const now = new Date().toISOString();

    // 1. Overall Sales Growth Trend Insight
    if (periodMetrics.previousSales > 0) {
      const isUp = periodMetrics.growthDirection === 'higher';
      const pct = periodMetrics.growthPercentage;
      const confidence = periodMetrics.currentTransactions >= 20 ? 'high' : 'medium';

      if (isUp) {
        insights.push({
          id: `ins_trend_sales_${timeframe}`,
          type: 'trend',
          title: `Sales Increased by ${pct}%`,
          description: `Total revenue reached ₹${periodMetrics.currentSales.toLocaleString()} compared with ₹${periodMetrics.previousSales.toLocaleString()} in the previous period. Average ticket value is ₹${periodMetrics.currentAOV.toLocaleString()}.`,
          metricChange: `+${pct}%`,
          confidence,
          actionableRecommendation: 'Maintain fast-moving stock levels and ensure sufficient cash register change for peak volumes.',
          category: 'Sales Growth',
          timestamp: now,
        });
      } else if (pct >= 5) {
        insights.push({
          id: `ins_trend_sales_down_${timeframe}`,
          type: 'warning',
          title: `Sales Dip of ${pct}% Observed`,
          description: `Revenue is ₹${periodMetrics.currentSales.toLocaleString()} (${pct}% lower than the prior period's ₹${periodMetrics.previousSales.toLocaleString()}). Footfall is expected to concentrate during evening hours.`,
          metricChange: `-${pct}%`,
          confidence,
          actionableRecommendation: 'Consider running a weekend promotional offer on slow-moving seasonal stock.',
          category: 'Sales Dip',
          timestamp: now,
        });
      }
    }

    // 2. Top Performing Category Opportunity
    const topCategory = categories[0];
    if (topCategory && topCategory.currentRevenue > 0) {
      const growthText = topCategory.growthPercentage > 0
        ? ` (+${topCategory.growthPercentage}% growth)`
        : '';
      insights.push({
        id: `ins_opp_top_cat_${topCategory.id}`,
        type: 'opportunity',
        title: `${topCategory.categoryName} Leads Revenue (${topCategory.revenueContributionPct}%)`,
        description: `${topCategory.categoryName} is your highest-grossing category with ₹${topCategory.currentRevenue.toLocaleString()} in sales${growthText} from ${topCategory.unitsSold} units.`,
        metricChange: `${topCategory.revenueContributionPct}% share`,
        confidence: 'high',
        actionableRecommendation: `Ensure premium shelf displays and maintain healthy inventory buffers for ${topCategory.categoryName}.`,
        category: 'Category Velocity',
        timestamp: now,
      });
    }

    // 3. Category Decline / Slow Movement Warning
    const decliningCategory = categories.find((c) => c.growthDirection === 'lower' && c.growthPercentage >= 8);
    if (decliningCategory) {
      insights.push({
        id: `ins_warn_cat_decline_${decliningCategory.id}`,
        type: 'warning',
        title: `${decliningCategory.categoryName} Sales Slowed by ${decliningCategory.growthPercentage}%`,
        description: `${decliningCategory.categoryName} revenue dropped to ₹${decliningCategory.currentRevenue.toLocaleString()} from ₹${decliningCategory.previousRevenue.toLocaleString()}.`,
        metricChange: `-${decliningCategory.growthPercentage}%`,
        confidence: 'medium',
        actionableRecommendation: `Review pricing and stock variety for ${decliningCategory.categoryName} or bundle with top-selling accessories.`,
        category: 'Category Velocity',
        timestamp: now,
      });
    }

    // 4. Peak Footfall & Staffing Recommendation
    const peakHours = hourly.filter((h) => h.isPeakHour);
    if (peakHours.length > 0) {
      const startHour = peakHours[0].hourLabel;
      const endHour = peakHours[peakHours.length - 1].hourLabel;
      const peakSales = peakHours.reduce((acc, h) => acc + h.salesTotal, 0);
      const totalHourlySales = hourly.reduce((acc, h) => acc + h.salesTotal, 0);
      const peakPct = totalHourlySales > 0 ? Math.round((peakSales / totalHourlySales) * 100) : 0;

      insights.push({
        id: `ins_rec_peak_hours`,
        type: 'recommendation',
        title: `Peak Shopping Rush Between ${startHour} and ${endHour}`,
        description: `Approximately ${peakPct}% of daily transactions occur during the evening hours between ${startHour} and ${endHour}.`,
        metricChange: `${startHour} - ${endHour}`,
        confidence: 'high',
        actionableRecommendation: 'Align staff shifts and meal breaks so all billing counters remain fully active during peak hours.',
        category: 'Store Operations',
        timestamp: now,
      });
    }

    // 5. Day-of-Week / Weekend Multiplier Trend
    const weekendTotal = dayOfWeek.filter((d) => d.isWeekend).reduce((acc, d) => acc + d.percentageOfWeeklyTotal, 0);
    const saturday = dayOfWeek.find((d) => d.dayName === 'Saturday');
    if (saturday && saturday.percentageOfWeeklyTotal >= 20) {
      insights.push({
        id: `ins_trend_weekend_peak`,
        type: 'trend',
        title: `Saturday is Your Highest-Volume Day (${saturday.percentageOfWeeklyTotal}%)`,
        description: `Weekend footfall generates ${Math.round(weekendTotal)}% of weekly store turnover, with Saturday recording peak billing traffic.`,
        metricChange: `${saturday.percentageOfWeeklyTotal}% on Sat`,
        confidence: 'high',
        actionableRecommendation: 'Ensure visual merchandising and new seasonal arrivals are arranged by Friday evening.',
        category: 'Footfall Pattern',
        timestamp: now,
      });
    }

    // 6. Customer Loyalty & Retention Information
    if (cohorts.returningCustomerRevenuePct >= 40) {
      insights.push({
        id: `ins_info_loyalty_cohort`,
        type: 'information',
        title: `Returning Patrons Drive ${cohorts.returningCustomerRevenuePct}% of Revenue`,
        description: `Repeat customers generated ₹${cohorts.returningCustomerRevenue.toLocaleString()} with strong average order values across loyalty accounts.`,
        metricChange: `${cohorts.returningCustomerRevenuePct}% repeat`,
        confidence: 'high',
        actionableRecommendation: 'Incentivize counter staff to enroll walk-in buyers into the loyalty points program at checkout.',
        category: 'Customer Loyalty',
        timestamp: now,
      });
    }

    // 7. Product Return Rate & Quality Warning
    const highRiskReturn = returns.find((r) => r.isHighRisk);
    if (highRiskReturn) {
      insights.push({
        id: `ins_warn_product_return_${highRiskReturn.productId}`,
        type: 'warning',
        title: `High Return Rate on ${highRiskReturn.productName} (${highRiskReturn.returnRatePct}%)`,
        description: `${highRiskReturn.unitsReturned} out of ${highRiskReturn.unitsSold} units were returned for refunds totaling ₹${highRiskReturn.refundAmount.toLocaleString()}.`,
        metricChange: `${highRiskReturn.returnRatePct}% return`,
        confidence: 'medium',
        actionableRecommendation: `Inspect garment batch \`${highRiskReturn.sku}\` with your supplier for sizing inaccuracies or fabric flaws.`,
        category: 'Quality & Returns',
        timestamp: now,
      });
    }

    return insights;
  }

  /**
   * Generates the complete consolidated analytics payload for the UI
   */
  public static generatePayload(timeframe: AnalyticsTimeframe = 'week'): SalesAnalyticsPayload {
    const { periodLabel, comparisonLabel } = SalesAnalyticsEngine.getDateFilters(timeframe);
    const periodMetrics = SalesAnalyticsEngine.calculatePeriodMetrics(timeframe);
    const categoryVelocity = SalesAnalyticsEngine.calculateCategoryVelocity(timeframe);
    const hourlyDistribution = SalesAnalyticsEngine.calculateHourlyDistribution(timeframe);
    const dayOfWeekDistribution = SalesAnalyticsEngine.calculateDayOfWeekDistribution(timeframe);
    const customerCohorts = SalesAnalyticsEngine.calculateCustomerCohorts(timeframe);
    const productReturnRates = SalesAnalyticsEngine.calculateProductReturnRates(timeframe);

    const insights = this.generateInsights(
      timeframe,
      periodMetrics,
      categoryVelocity,
      hourlyDistribution,
      dayOfWeekDistribution,
      customerCohorts,
      productReturnRates
    );

    return {
      timeframe,
      periodLabel,
      comparisonLabel,
      periodMetrics,
      categoryVelocity,
      hourlyDistribution,
      dayOfWeekDistribution,
      customerCohorts,
      productReturnRates,
      insights,
      generatedAt: new Date().toISOString(),
    };
  }
}
