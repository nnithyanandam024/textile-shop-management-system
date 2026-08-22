import { useState, useEffect, useCallback } from 'react';
import { attendanceApi, AttendanceRecord, AttendanceSummaryData } from '../api/attendanceApi';

export function useAttendance() {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [clocking, setClocking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, histRes, sumRes] = await Promise.all([
        attendanceApi.getToday(),
        attendanceApi.getMyAttendance(),
        attendanceApi.getAttendanceSummary(),
      ]);

      if (todayRes.success) setTodayRecord(todayRes.data || null);
      if (histRes.success && histRes.data) setHistory(histRes.data);
      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const checkIn = useCallback(async (coords?: { lat: number; lng: number }) => {
    setClocking(true);
    setError(null);
    try {
      const res = await attendanceApi.checkIn(coords);
      if (res.success && res.data) {
        setTodayRecord(res.data);
        await loadAttendance();
        return { success: true, data: res.data };
      }
      throw new Error(res.error?.message || 'Check-in failed.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setClocking(false);
    }
  }, [loadAttendance]);

  const checkOut = useCallback(async () => {
    setClocking(true);
    setError(null);
    try {
      const res = await attendanceApi.checkOut();
      if (res.success && res.data) {
        setTodayRecord(res.data);
        await loadAttendance();
        return { success: true, data: res.data };
      }
      throw new Error(res.error?.message || 'Check-out failed.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setClocking(false);
    }
  }, [loadAttendance]);

  return {
    todayRecord,
    history,
    summary,
    loading,
    clocking,
    error,
    checkIn,
    checkOut,
    refresh: loadAttendance,
    clearError: () => setError(null),
  };
}

export default useAttendance;
