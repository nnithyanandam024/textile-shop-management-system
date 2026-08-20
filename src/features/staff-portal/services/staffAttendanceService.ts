export interface TodayAttendance {
  id?: number;
  staffId: number;
  staffName: string;
  attendanceDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workedMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  scheduledStart: string;
  scheduledEnd: string;
  shiftName: string;
  isLate: boolean;
  isEarlyExit: boolean;
  isOnBreak: boolean;
  canCheckIn: boolean;
  canCheckOut: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
}

export interface AttendanceHistoryItem {
  id: number;
  attendanceDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workedMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  formattedHours: string;
  shiftName?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  correctionStatus?: string | null;
}

export interface MonthlyAttendanceSummary {
  month: string;
  monthStr: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  halfDayCount: number;
  holidayCount: number;
  weekOffCount: number;
  totalWorkedMinutes: number;
  totalHoursFormatted: string;
  scheduledWorkingDays: number;
  attendanceRate: number;
}

export interface AttendanceCorrectionRequestItem {
  id: number;
  attendanceId?: number;
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const staffAttendanceService = {
  async getTodayAttendance(): Promise<TodayAttendance> {
    if (window.api?.staffAttendance?.getToday) {
      const res = await window.api.staffAttendance.getToday();
      if (!res.success) throw new Error(res.error || 'Failed to fetch today attendance.');
      return res.data;
    }

    // Mock fallback
    return {
      staffId: 2,
      staffName: 'Arun Kumar',
      attendanceDate: '2026-08-20',
      status: 'WORKING',
      checkIn: '09:02',
      checkOut: null,
      breakStart: null,
      breakEnd: null,
      totalBreakMinutes: 0,
      workedMinutes: 342,
      lateMinutes: 0,
      earlyExitMinutes: 0,
      scheduledStart: '09:00',
      scheduledEnd: '18:00',
      shiftName: 'Morning Shift',
      isLate: false,
      isEarlyExit: false,
      isOnBreak: false,
      canCheckIn: false,
      canCheckOut: true,
      canStartBreak: true,
      canEndBreak: false,
    };
  },

  async checkIn(customTime?: string): Promise<{ success: boolean; data: TodayAttendance; message: string }> {
    if (window.api?.staffAttendance?.checkIn) {
      const res = await window.api.staffAttendance.checkIn(customTime);
      if (!res.success) throw new Error(res.error || 'Failed to check in.');
      return { success: true, data: res.data, message: res.message || 'Checked in successfully.' };
    }
    return {
      success: true,
      data: {
        staffId: 2,
        staffName: 'Arun Kumar',
        attendanceDate: '2026-08-20',
        status: 'WORKING',
        checkIn: '09:02',
        checkOut: null,
        breakStart: null,
        breakEnd: null,
        totalBreakMinutes: 0,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        scheduledStart: '09:00',
        scheduledEnd: '18:00',
        shiftName: 'Morning Shift',
        isLate: false,
        isEarlyExit: false,
        isOnBreak: false,
        canCheckIn: false,
        canCheckOut: true,
        canStartBreak: true,
        canEndBreak: false,
      },
      message: 'Checked in successfully in mock mode.',
    };
  },

  async checkOut(customTime?: string): Promise<{ success: boolean; data: TodayAttendance; message: string }> {
    if (window.api?.staffAttendance?.checkOut) {
      const res = await window.api.staffAttendance.checkOut(customTime);
      if (!res.success) throw new Error(res.error || 'Failed to check out.');
      return { success: true, data: res.data, message: res.message || 'Checked out successfully.' };
    }
    return {
      success: true,
      data: {
        staffId: 2,
        staffName: 'Arun Kumar',
        attendanceDate: '2026-08-20',
        status: 'COMPLETED',
        checkIn: '09:02',
        checkOut: '18:04',
        breakStart: null,
        breakEnd: null,
        totalBreakMinutes: 60,
        workedMinutes: 482,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        scheduledStart: '09:00',
        scheduledEnd: '18:00',
        shiftName: 'Morning Shift',
        isLate: false,
        isEarlyExit: false,
        isOnBreak: false,
        canCheckIn: false,
        canCheckOut: false,
        canStartBreak: false,
        canEndBreak: false,
      },
      message: 'Checked out successfully in mock mode.',
    };
  },

  async startBreak(customTime?: string): Promise<{ success: boolean; data: TodayAttendance; message: string }> {
    if (window.api?.staffAttendance?.startBreak) {
      const res = await window.api.staffAttendance.startBreak(customTime);
      if (!res.success) throw new Error(res.error || 'Failed to start break.');
      return { success: true, data: res.data, message: res.message || 'Break started.' };
    }
    return {
      success: true,
      data: {
        staffId: 2,
        staffName: 'Arun Kumar',
        attendanceDate: '2026-08-20',
        status: 'ON_BREAK',
        checkIn: '09:02',
        checkOut: null,
        breakStart: '13:00',
        breakEnd: null,
        totalBreakMinutes: 0,
        workedMinutes: 238,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        scheduledStart: '09:00',
        scheduledEnd: '18:00',
        shiftName: 'Morning Shift',
        isLate: false,
        isEarlyExit: false,
        isOnBreak: true,
        canCheckIn: false,
        canCheckOut: false,
        canStartBreak: false,
        canEndBreak: true,
      },
      message: 'Break started in mock mode.',
    };
  },

  async endBreak(customTime?: string): Promise<{ success: boolean; data: TodayAttendance; message: string }> {
    if (window.api?.staffAttendance?.endBreak) {
      const res = await window.api.staffAttendance.endBreak(customTime);
      if (!res.success) throw new Error(res.error || 'Failed to end break.');
      return { success: true, data: res.data, message: res.message || 'Break ended.' };
    }
    return {
      success: true,
      data: {
        staffId: 2,
        staffName: 'Arun Kumar',
        attendanceDate: '2026-08-20',
        status: 'WORKING',
        checkIn: '09:02',
        checkOut: null,
        breakStart: '13:00',
        breakEnd: '14:00',
        totalBreakMinutes: 60,
        workedMinutes: 238,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        scheduledStart: '09:00',
        scheduledEnd: '18:00',
        shiftName: 'Morning Shift',
        isLate: false,
        isEarlyExit: false,
        isOnBreak: false,
        canCheckIn: false,
        canCheckOut: true,
        canStartBreak: true,
        canEndBreak: false,
      },
      message: 'Break ended in mock mode.',
    };
  },

  async getAttendanceHistory(filter?: any): Promise<AttendanceHistoryItem[]> {
    if (window.api?.staffAttendance?.getHistory) {
      const res = await window.api.staffAttendance.getHistory(filter);
      if (!res.success) throw new Error(res.error || 'Failed to fetch history.');
      return res.data || [];
    }
    return [];
  },

  async getMonthlySummary(monthStr?: string): Promise<MonthlyAttendanceSummary> {
    if (window.api?.staffAttendance?.getMonthlySummary) {
      const res = await window.api.staffAttendance.getMonthlySummary(monthStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch summary.');
      return res.data;
    }
    return {
      month: 'August 2026',
      monthStr: '2026-08',
      presentCount: 22,
      lateCount: 3,
      absentCount: 1,
      leaveCount: 2,
      halfDayCount: 0,
      holidayCount: 2,
      weekOffCount: 8,
      totalWorkedMinutes: 10580,
      totalHoursFormatted: '176h 20m',
      scheduledWorkingDays: 24,
      attendanceRate: 91.7,
    };
  },

  async getAttendanceByDate(dateStr: string): Promise<AttendanceHistoryItem | null> {
    if (window.api?.staffAttendance?.getByDate) {
      const res = await window.api.staffAttendance.getByDate(dateStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch date details.');
      return res.data || null;
    }
    return null;
  },

  async requestCorrection(input: {
    date: string;
    attendanceId?: number;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }): Promise<{ success: boolean; id?: number; message: string }> {
    if (window.api?.staffAttendance?.requestCorrection) {
      const res = await window.api.staffAttendance.requestCorrection(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit correction request.');
      return { success: true, id: res.id, message: res.message || 'Correction requested.' };
    }
    return { success: true, id: 1, message: 'Correction requested in mock mode.' };
  },

  async getCorrectionRequests(): Promise<AttendanceCorrectionRequestItem[]> {
    if (window.api?.staffAttendance?.getCorrectionRequests) {
      const res = await window.api.staffAttendance.getCorrectionRequests();
      if (!res.success) throw new Error(res.error || 'Failed to fetch correction requests.');
      return res.data || [];
    }
    return [];
  },
};
