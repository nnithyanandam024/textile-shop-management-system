import apiClient, { ApiResponse } from './client';

export interface AttendanceRecord {
  id: number;
  staffId: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'ON_DUTY';
  checkIn?: string;
  checkOut?: string;
  workedHours?: number;
  lateMinutes?: number;
  remarks?: string;
}

export interface AttendanceSummaryData {
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateArrivals: number;
  totalWorkedHours: number;
  averageDailyHours: number;
}

export const attendanceApi = {
  /**
   * Clock in for the current shift
   */
  async checkIn(coordinates?: { lat: number; lng: number }): Promise<ApiResponse<AttendanceRecord>> {
    if (typeof window !== 'undefined' && window.api?.staffAttendance?.checkIn) {
      try {
        const res = await window.api.staffAttendance.checkIn();
        if (res.success && res.data) {
          return { success: true, data: res.data, message: res.message || 'Check-in recorded successfully.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Check-in failed.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.post<AttendanceRecord>('/attendance/check-in', { coordinates });
  },

  /**
   * Clock out for the current shift
   */
  async checkOut(): Promise<ApiResponse<AttendanceRecord>> {
    if (typeof window !== 'undefined' && window.api?.staffAttendance?.checkOut) {
      try {
        const res = await window.api.staffAttendance.checkOut();
        if (res.success && res.data) {
          return { success: true, data: res.data, message: res.message || 'Check-out recorded successfully.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Check-out failed.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.post<AttendanceRecord>('/attendance/check-out');
  },

  /**
   * Get today's active attendance status
   */
  async getToday(): Promise<ApiResponse<AttendanceRecord | null>> {
    if (typeof window !== 'undefined' && window.api?.staffAttendance?.getToday) {
      try {
        const res = await window.api.staffAttendance.getToday();
        if (res.success) {
          return { success: true, data: res.data || null };
        }
      } catch {}
    }
    return apiClient.get<AttendanceRecord | null>('/attendance/today');
  },

  /**
   * Get attendance logs for month
   */
  async getMyAttendance(monthYear?: string): Promise<ApiResponse<AttendanceRecord[]>> {
    if (typeof window !== 'undefined' && window.api?.staffAttendance?.getHistory) {
      try {
        const res = await window.api.staffAttendance.getHistory({ monthStr: monthYear });
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<AttendanceRecord[]>('/attendance/my-history', { params: { monthYear } });
  },

  /**
   * Get attendance analytics summary
   */
  async getAttendanceSummary(monthYear?: string): Promise<ApiResponse<AttendanceSummaryData>> {
    if (typeof window !== 'undefined' && window.api?.staffReports?.attendance) {
      try {
        const res = await window.api.staffReports.attendance(undefined, monthYear);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<AttendanceSummaryData>('/attendance/summary', { params: { monthYear } });
  },
};

export default attendanceApi;
