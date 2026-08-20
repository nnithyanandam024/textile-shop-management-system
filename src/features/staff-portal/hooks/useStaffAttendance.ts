import { useState, useEffect, useCallback, useRef } from 'react';
import {
  staffAttendanceService,
  TodayAttendance,
  AttendanceHistoryItem,
  MonthlyAttendanceSummary,
  AttendanceCorrectionRequestItem,
} from '../services/staffAttendanceService';

export function useStaffAttendance() {
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequestItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Working seconds timer
  const [liveSeconds, setLiveSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, h, s, cr] = await Promise.all([
        staffAttendanceService.getTodayAttendance(),
        staffAttendanceService.getAttendanceHistory({ month: selectedMonth, status: statusFilter }),
        staffAttendanceService.getMonthlySummary(selectedMonth),
        staffAttendanceService.getCorrectionRequests(),
      ]);
      setToday(t);
      setHistory(h);
      setSummary(s);
      setCorrectionRequests(cr);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, statusFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (today && today.status === 'WORKING' && today.checkIn) {
      const [hh, mm] = today.checkIn.split(':').map(Number);
      const checkInDate = new Date();
      checkInDate.setHours(hh, mm, 0, 0);

      const updateSeconds = () => {
        const now = new Date();
        const elapsedSec = Math.max(0, Math.floor((now.getTime() - checkInDate.getTime()) / 1000));
        const breakSec = (today.totalBreakMinutes || 0) * 60;
        setLiveSeconds(Math.max(0, elapsedSec - breakSec));
      };

      updateSeconds();
      timerRef.current = setInterval(updateSeconds, 1000);
    } else if (today && today.workedMinutes) {
      setLiveSeconds(today.workedMinutes * 60);
    } else {
      setLiveSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [today]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCheckIn = async (customTime?: string): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffAttendanceService.checkIn(customTime);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to record check in.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (customTime?: string): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffAttendanceService.checkOut(customTime);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to record check out.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async (customTime?: string): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffAttendanceService.startBreak(customTime);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to start break.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async (customTime?: string): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffAttendanceService.endBreak(customTime);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to end break.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async (input: {
    date: string;
    attendanceId?: number;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffAttendanceService.requestCorrection(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit correction request.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    today,
    history,
    summary,
    correctionRequests,
    selectedMonth,
    setSelectedMonth,
    statusFilter,
    setStatusFilter,
    loading,
    actionLoading,
    error,
    successMessage,
    liveSeconds,
    checkIn: handleCheckIn,
    checkOut: handleCheckOut,
    startBreak: handleStartBreak,
    endBreak: handleEndBreak,
    requestCorrection: handleRequestCorrection,
    refresh: fetchAll,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
  };
}
