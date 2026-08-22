import { useState, useEffect, useCallback } from 'react';
import {
  staffReportsService,
  StaffSalesReportData,
  StaffAttendanceReportData,
  StaffCommissionReportData,
  StaffInventoryTasksReportData,
} from '../services/staffReportsService';

export function useStaffReports() {
  const [activeTab, setActiveTab] = useState<'SALES' | 'ATTENDANCE' | 'COMMISSION' | 'INVENTORY'>('SALES');
  const [period, setPeriod] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'>('TODAY');

  const [salesReport, setSalesReport] = useState<StaffSalesReportData | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<StaffAttendanceReportData | null>(null);
  const [commissionReport, setCommissionReport] = useState<StaffCommissionReportData | null>(null);
  const [inventoryReport, setInventoryReport] = useState<StaffInventoryTasksReportData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'SALES') {
        const data = await staffReportsService.getSalesReport({ period });
        setSalesReport(data);
      } else if (activeTab === 'ATTENDANCE') {
        const data = await staffReportsService.getAttendanceReport();
        setAttendanceReport(data);
      } else if (activeTab === 'COMMISSION') {
        const data = await staffReportsService.getCommissionReport(period);
        setCommissionReport(data);
      } else if (activeTab === 'INVENTORY') {
        const data = await staffReportsService.getInventoryTasksReport();
        setInventoryReport(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    activeTab,
    period,
    salesReport,
    attendanceReport,
    commissionReport,
    inventoryReport,
    loading,
    error,
    setActiveTab,
    setPeriod,
    refresh: loadData,
  };
}
