export type StockRiskLevel = 'critical' | 'monitor' | 'healthy' | 'slow_moving' | 'dead_stock';
export type ForecastConfidence = 'high' | 'medium' | 'low';

export interface WeeklyDemandDataPoint {
  weekLabel: string; // e.g. "Week -5", "Week -1", "Projected Week +1"
  dateLabel: string; // e.g. "Jul 15", "Aug 20"
  actualUnits?: number;
  projectedUnits?: number;
  isForecast: boolean;
}

export interface ProductForecastItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  brandName?: string;
  size?: string;
  color?: string;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  supplierName?: string;
  leadTimeDays: number;
  purchasePrice: number;
  sellingPrice: number;

  // Demand metrics
  averageDailyDemand: number;
  daysOfSupplyRemaining: number;
  forecast7Days: number;
  forecast14Days: number;
  forecast30Days: number;

  // Reorder analysis
  smartReorderPoint: number;
  recommendedOrderQuantity: number;
  stockRiskLevel: StockRiskLevel;
  confidence: ForecastConfidence;
  aiExplanation: string;
  actionableSuggestion: string;

  // Historical & Projected Series
  demandTimeline: WeeklyDemandDataPoint[];
}

export interface ReorderRecommendation {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  supplierName: string;
  currentStock: number;
  averageDailyDemand: number;
  daysOfSupply: number;
  leadTimeDays: number;
  smartReorderPoint: number;
  suggestedReorderQuantity: number;
  estimatedCost: number;
  stockRiskLevel: 'critical' | 'monitor';
  confidence: ForecastConfidence;
  aiReasoning: string;
}

export interface DeadStockItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  stockCostValue: number;
  sellingPrice: number;
  daysSinceLastSale: number;
  unitsSoldIn60Days: number;
  recommendation: string;
}

export interface InventoryIntelligenceSummary {
  totalVariantsAnalyzed: number;
  criticalReorderCount: number;
  monitorCount: number;
  healthyCount: number;
  deadStockCount: number;
  capitalTiedInDeadStock: number;
  urgentReordersEstimatedCost: number;
  topReorderRecommendations: ReorderRecommendation[];
  deadStockList: DeadStockItem[];
  allForecasts: ProductForecastItem[];
  generatedAt: string;
}
