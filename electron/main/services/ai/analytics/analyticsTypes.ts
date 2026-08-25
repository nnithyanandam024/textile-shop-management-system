export type InsightType = 'trend' | 'opportunity' | 'warning' | 'recommendation' | 'information';
export type InsightConfidence = 'high' | 'medium' | 'low';
export type AnalyticsTimeframe = 'today' | 'week' | 'month';

export interface SmartInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metricChange?: string;
  confidence: InsightConfidence;
  actionableRecommendation?: string;
  category?: string;
  timestamp: string;
}

export interface PeriodComparisonMetrics {
  currentSales: number;
  previousSales: number;
  growthPercentage: number;
  growthDirection: 'higher' | 'lower' | 'steady';
  currentTransactions: number;
  previousTransactions: number;
  transactionGrowthPercentage: number;
  currentAOV: number;
  previousAOV: number;
  aovGrowthPercentage: number;
  totalUnitsSold: number;
  totalDiscounts: number;
  discountRate: number; // Percentage of gross sales
  returnRate: number; // Percentage of units returned
}

export interface CategoryVelocityItem {
  id: number;
  categoryName: string;
  currentRevenue: number;
  previousRevenue: number;
  revenueContributionPct: number;
  growthPercentage: number;
  growthDirection: 'higher' | 'lower' | 'steady';
  unitsSold: number;
}

export interface HourlySalesDistribution {
  hour: number; // 0 - 23
  hourLabel: string; // "10 AM", "6 PM", etc.
  salesTotal: number;
  transactionCount: number;
  isPeakHour: boolean;
}

export interface DayOfWeekSalesDistribution {
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  dayName: string; // "Monday", "Saturday", etc.
  salesTotal: number;
  transactionCount: number;
  percentageOfWeeklyTotal: number;
  isWeekend: boolean;
}

export interface CustomerCohortMetrics {
  totalActiveCustomers: number;
  newCustomersCount: number;
  newCustomerRevenue: number;
  newCustomerRevenuePct: number;
  returningCustomersCount: number;
  returningCustomerRevenue: number;
  returningCustomerRevenuePct: number;
  repeatPurchaseRate: number;
}

export interface ProductReturnRateItem {
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  unitsReturned: number;
  returnRatePct: number;
  refundAmount: number;
  commonReason?: string;
  isHighRisk: boolean; // Flagged if return rate > 8%
}

export interface SalesAnalyticsPayload {
  timeframe: AnalyticsTimeframe;
  periodLabel: string;
  comparisonLabel: string;
  periodMetrics: PeriodComparisonMetrics;
  categoryVelocity: CategoryVelocityItem[];
  hourlyDistribution: HourlySalesDistribution[];
  dayOfWeekDistribution: DayOfWeekSalesDistribution[];
  customerCohorts: CustomerCohortMetrics;
  productReturnRates: ProductReturnRateItem[];
  insights: SmartInsight[];
  generatedAt: string;
}

export interface DailyExecutiveSummary {
  date: string;
  dateFormatted: string;
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  topPerformingCategory: string;
  bestSellingProduct: string;
  growthVsYesterdayPct: number;
  growthDirection: 'higher' | 'lower' | 'steady';
  criticalAttentionItems: string[];
  keyHighlights: string[];
  confidence: InsightConfidence;
}
