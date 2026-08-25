export type AnomalyType =
  | 'UNUSUAL_DISCOUNT'
  | 'LARGE_STOCK_ADJUSTMENT'
  | 'ABNORMAL_RETURN_VOLUME'
  | 'SALES_VOLUME_DROP'
  | 'SALES_VOLUME_SPIKE'
  | 'AFTER_HOURS_ACTIVITY'
  | 'AUTH_FAILURE_SPIKE'
  | 'POSSIBLE_DUPLICATE_TX';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface AnomalyEvidence {
  metricName: string;
  detectedValue: string | number;
  expectedBaseline: string | number;
  deviationMultiplier?: number;
  additionalContext?: string;
}

export interface AnomalyRecord {
  id: string;
  type: AnomalyType;
  title: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  entityType: 'sale' | 'stock_adjustment' | 'auth_log' | 'customer' | 'store_day';
  entityId: string;
  entityName?: string;
  riskScore: number; // 0 - 100
  evidence: AnomalyEvidence;
  aiExplanation: string;
  suggestedAction: string;
  detectedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AnomalyFilter {
  severity?: AnomalySeverity;
  status?: AnomalyStatus;
  type?: AnomalyType;
  startDate?: string;
  endDate?: string;
}

export interface RiskSummaryPayload {
  overallRiskScore: number; // 0 - 100
  riskLabel: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  openCount: number;
  resolvedCount: number;
  recentAnomalies: AnomalyRecord[];
  generatedAt: string;
}

export interface AnomalyReviewRequest {
  anomalyId: string;
  action: 'acknowledge' | 'mark_under_review' | 'resolve' | 'dismiss';
  reviewerName: string;
  notes?: string;
}
