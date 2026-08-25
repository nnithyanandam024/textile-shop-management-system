import { ReportPeriod, SmartBusinessReport } from './reportTypes';
import { ReportSynthesisEngine } from './reportSynthesisEngine';

export class ReportHistoryService {
  private static reportCache: Map<string, SmartBusinessReport> = new Map();

  public static getReport(period: ReportPeriod, dateStr?: string): SmartBusinessReport {
    const key = `${period}_${dateStr || 'latest'}`;
    if (this.reportCache.has(key)) {
      return this.reportCache.get(key)!;
    }

    const report = ReportSynthesisEngine.generateReport(period, dateStr);
    this.reportCache.set(key, report);
    return report;
  }

  public static getReportHistory(): { id: string; period: ReportPeriod; label: string; date: string; revenue: number }[] {
    const defaultReports: { id: string; period: ReportPeriod; label: string; date: string; revenue: number }[] = [
      { id: 'rep-m-aug-2026', period: 'monthly', label: 'Monthly Management Report — August 2026', date: '2026-08-25', revenue: 2480000 },
      { id: 'rep-w-aug-w3', period: 'weekly', label: 'Weekly Business Report — Aug 17 to Aug 23, 2026', date: '2026-08-23', revenue: 582400 },
      { id: 'rep-d-aug-25', period: 'daily', label: 'Daily Business Summary — Aug 25, 2026', date: '2026-08-25', revenue: 84250 },
      { id: 'rep-d-aug-24', period: 'daily', label: 'Daily Business Summary — Aug 24, 2026', date: '2026-08-24', revenue: 91400 },
    ];

    return defaultReports;
  }
}
