import { AnomalyRecord, AnomalyReviewRequest } from './anomalyTypes';
import { AnomalyDetectionEngine } from './anomalyDetectionEngine';

export class AnomalyReviewService {
  // In-memory status overrides for session persistence
  private static statusOverrides: Map<string, Partial<AnomalyRecord>> = new Map();

  public static getAnomalies(filter?: any): AnomalyRecord[] {
    const anomalies = AnomalyDetectionEngine.scanAnomalies(filter);
    return anomalies.map((a) => {
      const override = this.statusOverrides.get(a.id);
      return override ? { ...a, ...override } : a;
    });
  }

  public static getAnomalyById(anomalyId: string): AnomalyRecord | null {
    const all = this.getAnomalies();
    return all.find((a) => a.id === anomalyId) || null;
  }

  public static reviewAnomaly(request: AnomalyReviewRequest): { success: boolean; anomaly?: AnomalyRecord } {
    const { anomalyId, action, reviewerName, notes } = request;
    const existing = this.getAnomalyById(anomalyId);

    if (!existing) {
      return { success: false };
    }

    let newStatus: AnomalyRecord['status'] = 'open';
    if (action === 'acknowledge' || action === 'mark_under_review') {
      newStatus = 'under_review';
    } else if (action === 'resolve') {
      newStatus = 'resolved';
    } else if (action === 'dismiss') {
      newStatus = 'dismissed';
    }

    const updatedData: Partial<AnomalyRecord> = {
      status: newStatus,
      reviewedBy: reviewerName || 'Manager',
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes || `Marked as ${newStatus} by ${reviewerName || 'Manager'}.`,
    };

    this.statusOverrides.set(anomalyId, updatedData);

    return {
      success: true,
      anomaly: { ...existing, ...updatedData },
    };
  }
}
