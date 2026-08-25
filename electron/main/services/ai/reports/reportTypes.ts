export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportMetricComparison {
  current: number;
  previous: number;
  percentageChange: number; // e.g. +14.2 or -5.1
  trend: 'up' | 'down' | 'neutral';
}

export interface ReportSalesMetrics {
  totalRevenue: number;
  revenueComparison: ReportMetricComparison;
  transactionCount: number;
  transactionsComparison: ReportMetricComparison;
  unitsSold: number;
  averageOrderValue: number;
  aovComparison: ReportMetricComparison;
  totalDiscountAmount: number;
  discountRatePercent: number;
  totalReturnAmount: number;
  returnRatePercent: number;
}

export interface ReportProductItem {
  variantId: number;
  productName: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportCategoryItem {
  categoryId: number;
  categoryName: string;
  revenue: number;
  revenueSharePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportCustomerMetrics {
  newCustomersCount: number;
  returningCustomersCount: number;
  repeatPurchaseRatePercent: number;
  returningRevenueSharePercent: number;
  averageBuyingIntervalDays: number;
}

export interface ReportInventoryMetrics {
  criticalReorderCount: number;
  monitorBufferCount: number;
  healthyStockCount: number;
  deadStockCount: number;
  capitalTiedInDeadStock: number;
  totalStockValuation: number;
}

export interface ReportForecastCategory {
  categoryName: string;
  expected30DayDemandUnits: number;
  growthPercentage: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ReportRiskMetrics {
  overallRiskScore: number;
  criticalAnomalies: number;
  highAnomalies: number;
  mediumAnomalies: number;
  unresolvedCount: number;
  primaryRiskFactor: string;
}

export interface PrioritizedActionItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  department: 'Inventory' | 'Sales' | 'Risk / Audit' | 'Marketing';
  suggestedAction: string;
}

export interface SmartBusinessReport {
  id: string;
  period: ReportPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  executiveSummary: string;
  overallHealthBadge: 'STRONG_GROWTH' | 'HEALTHY_STABLE' | 'ATTENTION_REQUIRED' | 'HIGH_RISK';
  overallHealthLabel: string;
  sales: ReportSalesMetrics;
  topProducts: ReportProductItem[];
  slowProducts: ReportProductItem[];
  categories: ReportCategoryItem[];
  customers: ReportCustomerMetrics;
  inventory: ReportInventoryMetrics;
  forecast: ReportForecastCategory[];
  risk: ReportRiskMetrics;
  actionItems: PrioritizedActionItem[];
  generatedAt: string;
  generatedBy: string;
}
