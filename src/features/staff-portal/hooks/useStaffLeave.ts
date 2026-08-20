import { useState, useEffect, useCallback } from 'react';
import {
  staffLeaveService,
  StaffLeaveBalanceItem,
  StaffLeaveTypeOption,
  StaffLeaveRequestItem,
  StaffPermissionRequestItem,
  LeaveCalendarData,
  LeaveHistoryData,
} from '../services/staffLeaveService';

export function useStaffLeave() {
  const [balances, setBalances] = useState<StaffLeaveBalanceItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<StaffLeaveTypeOption[]>([]);
  const [requests, setRequests] = useState<StaffLeaveRequestItem[]>([]);
  const [permissions, setPermissions] = useState<StaffPermissionRequestItem[]>([]);
  const [calendar, setCalendar] = useState<LeaveCalendarData | null>(null);
  const [history, setHistory] = useState<LeaveHistoryData | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balList, typeList, reqList, permList, calData, histData] = await Promise.all([
        staffLeaveService.getLeaveBalances(selectedYear),
        staffLeaveService.getLeaveTypes(),
        staffLeaveService.getLeaveRequests({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          leave_type_id: typeFilter,
          year: selectedYear,
        }),
        staffLeaveService.getPermissionRequests(),
        staffLeaveService.getLeaveCalendar(selectedMonth),
        staffLeaveService.getLeaveHistory(selectedYear),
      ]);

      setBalances(balList);
      setLeaveTypes(typeList);
      setRequests(reqList);
      setPermissions(permList);
      setCalendar(calData);
      setHistory(histData);
    } catch (err: any) {
      setError(err.message || 'Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, statusFilter, typeFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleApplyLeave = async (input: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    duration_type?: 'FULL_DAY' | 'HALF_DAY';
    session?: 'MORNING' | 'AFTERNOON';
    reason: string;
    attachment_path?: string;
  }): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffLeaveService.applyLeave(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to apply leave.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLeave = async (requestId: number): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffLeaveService.cancelLeave(requestId);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel leave request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPermission = async (input: {
    request_date: string;
    start_time: string;
    end_time: string;
    reason: string;
  }): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffLeaveService.requestPermission(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit permission request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPermission = async (id: number): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffLeaveService.cancelPermission(id);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel permission request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    balances,
    leaveTypes,
    requests,
    permissions,
    calendar,
    history,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    loading,
    actionLoading,
    error,
    successMessage,
    applyLeave: handleApplyLeave,
    cancelLeave: handleCancelLeave,
    requestPermission: handleRequestPermission,
    cancelPermission: handleCancelPermission,
    refresh: fetchAll,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
  };
}
