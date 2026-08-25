export type CustomerSegment = 'vip_high_value' | 'returning_regular' | 'frequent_shopper' | 'new_customer' | 'at_risk_due';
export type RecommendationStrategy = 'frequently_bought_together' | 'personalized_affinity' | 'similar_garment' | 'trending_fast_mover';

export interface CategoryAffinityItem {
  categoryId: number;
  categoryName: string;
  purchaseCount: number;
  totalSpent: number;
  percentageOfSpend: number;
}

export interface CustomerIntelligenceProfile {
  customerId: number;
  customerCode: string;
  customerName: string;
  segment: CustomerSegment;
  segmentLabel: string;
  totalLifetimeSpend: number;
  totalVisits: number;
  averageOrderValue: number;
  preferredCategory: string;
  categoryAffinities: CategoryAffinityItem[];
  frequentlyPurchasedSkus: string[];
  averageDaysBetweenPurchases: number;
  daysSinceLastPurchase: number;
  isDueForVisit: boolean;
  estimatedNextVisitDate?: string;
  suggestedAction: string;
}

export interface ProductRecommendationItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  sellingPrice: number;
  currentStock: number;
  strategy: RecommendationStrategy;
  strategyLabel: string;
  confidenceScore: number; // 0.0 - 1.0
  aiReasoning: string;
  triggerProductId?: number;
  triggerProductName?: string;
}

export interface CartRecommendationRequest {
  cartVariantIds: number[];
  customerId?: number;
  limit?: number;
}

export interface CartRecommendationResponse {
  recommendations: ProductRecommendationItem[];
  activeCartItemCount: number;
  suggestedBundleSavings?: number;
  generatedAt: string;
}

export interface RecommendationFeedbackEvent {
  recommendationId: string;
  variantId: number;
  customerId?: number;
  strategy: RecommendationStrategy;
  action: 'impression' | 'click' | 'add_to_cart' | 'purchased';
  timestamp: string;
}
