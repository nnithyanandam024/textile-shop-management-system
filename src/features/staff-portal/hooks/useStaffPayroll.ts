import { useState, useEffect, useCallback } from 'react';
import {
  staffPayrollService,
  StaffPayrollDetails,
  StaffPayrollHistoryItem,
  StaffSalaryOverview,
  StaffSalaryRevisionItem,
  StaffOvertimeSummary,
  StaffIncentiveSummary,
} from '../services/staffPayrollService';

export function useStaffPayroll() {
  const [currentPayroll, setCurrentPayroll] = useState<StaffPayrollDetails | null>(null);
  const [periods, setPeriods] = useState<Array<{ id: number; name: string; year: number; month: number; status: string }>>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<StaffPayrollHistoryItem[]>([]);
  const [salaryOverview, setSalaryOverview] = useState<StaffSalaryOverview | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<StaffSalaryRevisionItem[]>([]);
  const [overtimeSummary, setOvertimeSummary] = useState<StaffOvertimeSummary | null>(null);
  const [incentiveSummary, setIncentiveSummary] = useState<StaffIncentiveSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePayslipDetails, setActivePayslipDetails] = useState<StaffPayrollDetails | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [periodsList, historyList, salaryOverviewData, salaryHistoryList] = await Promise.all([
        staffPayrollService.getPayrollPeriods(),
        staffPayrollService.getPayrollHistory(),
        staffPayrollService.getSalaryOverview(),
        staffPayrollService.getSalaryHistory(),
      ]);

      setPeriods(periodsList);
      setHistory(historyList);
      setSalaryOverview(salaryOverviewData);
      setSalaryHistory(salaryHistoryList);

      const targetPeriodId = selectedPeriodId || (periodsList.length > 0 ? periodsList[0].id : undefined);
      const payrollData = await staffPayrollService.getCurrentPayroll(targetPeriodId);
      setCurrentPayroll(payrollData);

      if (payrollData) {
        setOvertimeSummary(payrollData.overtimeSummary);
        setIncentiveSummary(payrollData.incentiveSummary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payroll data.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSelectPeriod = async (periodId: number) => {
    setSelectedPeriodId(periodId);
    setLoading(true);
    try {
      const payrollData = await staffPayrollService.getCurrentPayroll(periodId);
      setCurrentPayroll(payrollData);
      if (payrollData) {
        setOvertimeSummary(payrollData.overtimeSummary);
        setIncentiveSummary(payrollData.incentiveSummary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch payroll period.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (recordId?: number) => {
    try {
      if (recordId) {
        const details = await staffPayrollService.getPayslipDetails(recordId);
        setActivePayslipDetails(details);
      } else if (currentPayroll) {
        setActivePayslipDetails(currentPayroll);
      }
      setIsPayslipModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to open payslip.');
    }
  };

  return {
    currentPayroll,
    periods,
    selectedPeriodId,
    history,
    salaryOverview,
    salaryHistory,
    overtimeSummary,
    incentiveSummary,
    loading,
    error,
    activePayslipDetails,
    isPayslipModalOpen,
    setIsPayslipModalOpen,
    selectPeriod: handleSelectPeriod,
    viewPayslip: handleViewPayslip,
    refresh: fetchAll,
    clearError: () => setError(null),
  };
}
