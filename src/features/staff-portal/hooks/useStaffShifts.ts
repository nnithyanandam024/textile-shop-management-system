import { useState, useEffect, useCallback } from 'react';
import {
  staffShiftService,
  StaffShiftItem,
  WeeklyScheduleData,
  MonthlyScheduleData,
  ShiftRequestItem,
  ShiftTemplateOption,
} from '../services/staffShiftService';

export function useStaffShifts() {
  const [todayShift, setTodayShift] = useState<StaffShiftItem | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleData | null>(null);
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlyScheduleData | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<StaffShiftItem[]>([]);
  const [requests, setRequests] = useState<ShiftRequestItem[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateOption[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedWeekStart, setSelectedWeekStart] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [today, weekly, monthly, upcoming, reqs, tmpls] = await Promise.all([
        staffShiftService.getTodayShift(),
        staffShiftService.getWeeklySchedule(selectedWeekStart),
        staffShiftService.getMonthlySchedule(selectedMonth),
        staffShiftService.getUpcomingShifts(7),
        staffShiftService.getShiftRequests(),
        staffShiftService.getShiftTemplates(),
      ]);

      setTodayShift(today);
      setWeeklySchedule(weekly);
      setMonthlySchedule(monthly);
      setUpcomingShifts(upcoming);
      setRequests(reqs);
      setTemplates(tmpls);
    } catch (err: any) {
      setError(err.message || 'Failed to load shift schedule.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedWeekStart]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleRequestChange = async (input: {
    target_date: string;
    requested_shift_template_id?: number;
    is_requested_week_off?: boolean;
    reason: string;
  }): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffShiftService.requestShiftChange(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit shift change request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestSwap = async (input: {
    target_staff_id: number;
    shift_date: string;
    reason: string;
  }): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffShiftService.requestShiftSwap(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit shift swap request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (id: number, type: 'CHANGE' | 'SWAP'): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffShiftService.cancelRequest(id, type);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    todayShift,
    weeklySchedule,
    monthlySchedule,
    upcomingShifts,
    requests,
    templates,
    selectedMonth,
    setSelectedMonth,
    selectedWeekStart,
    setSelectedWeekStart,
    loading,
    actionLoading,
    error,
    successMessage,
    requestChange: handleRequestChange,
    requestSwap: handleRequestSwap,
    cancelRequest: handleCancelRequest,
    refresh: fetchAll,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
  };
}
