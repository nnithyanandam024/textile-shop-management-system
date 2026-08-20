export interface StaffShiftItem {
  id?: number;
  date: string;
  dayOfWeek: number;
  dayName: string;
  shortDayName: string;
  shiftName: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  breakMinutes: number;
  graceMinutes: number;
  workLocation: string;
  departmentName: string;
  status: string;
  symbol: string;
  isWeekOff: boolean;
  isHoliday: boolean;
  isLeave: boolean;
  isOverride: boolean;
  holidayName?: string;
  leaveTypeName?: string;
  overrideReason?: string;
}

export interface WeeklyScheduleData {
  weekStart: string;
  weekEnd: string;
  days: StaffShiftItem[];
}

export interface MonthlyScheduleData {
  month: string;
  monthStr: string;
  totalDays: number;
  days: StaffShiftItem[];
}

export interface ShiftRequestItem {
  id: number;
  type: 'CHANGE' | 'SWAP';
  date: string;
  currentShiftName?: string;
  requestedShiftName?: string;
  isRequestedWeekOff?: boolean;
  targetStaffId?: number;
  targetStaffName?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface SwapCandidateItem {
  id: number;
  name: string;
  staffCode: string;
  currentShift: string;
}

export interface ShiftTemplateOption {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export const staffShiftService = {
  async getTodayShift(): Promise<StaffShiftItem> {
    if (window.api?.staffShifts?.getToday) {
      const res = await window.api.staffShifts.getToday();
      if (!res.success) throw new Error(res.error || 'Failed to fetch today shift.');
      return res.data;
    }
    return {
      date: '2026-08-20',
      dayOfWeek: 4,
      dayName: 'Thursday',
      shortDayName: 'Thu',
      shiftName: 'Morning Shift',
      shiftCode: 'MS-01',
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      breakMinutes: 60,
      graceMinutes: 15,
      workLocation: 'Main Store',
      departmentName: 'Storefront Sales',
      status: 'SCHEDULED',
      symbol: 'M',
      isWeekOff: false,
      isHoliday: false,
      isLeave: false,
      isOverride: false,
    };
  },

  async getWeeklySchedule(weekStartDate?: string): Promise<WeeklyScheduleData> {
    if (window.api?.staffShifts?.getWeekly) {
      const res = await window.api.staffShifts.getWeekly(weekStartDate);
      if (!res.success) throw new Error(res.error || 'Failed to fetch weekly schedule.');
      return res.data;
    }
    return {
      weekStart: '2026-08-17',
      weekEnd: '2026-08-23',
      days: [],
    };
  },

  async getMonthlySchedule(monthStr?: string): Promise<MonthlyScheduleData> {
    if (window.api?.staffShifts?.getMonthly) {
      const res = await window.api.staffShifts.getMonthly(monthStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch monthly schedule.');
      return res.data;
    }
    return {
      month: 'August 2026',
      monthStr: '2026-08',
      totalDays: 31,
      days: [],
    };
  },

  async getUpcomingShifts(count: number = 7): Promise<StaffShiftItem[]> {
    if (window.api?.staffShifts?.getUpcoming) {
      const res = await window.api.staffShifts.getUpcoming(count);
      if (!res.success) throw new Error(res.error || 'Failed to fetch upcoming shifts.');
      return res.data || [];
    }
    return [];
  },

  async getShiftDetails(dateStr: string): Promise<StaffShiftItem> {
    if (window.api?.staffShifts?.getDetails) {
      const res = await window.api.staffShifts.getDetails(dateStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch shift details.');
      return res.data;
    }
    throw new Error('Shift details API unavailable.');
  },

  async getShiftHistory(filter?: { month?: string }): Promise<StaffShiftItem[]> {
    if (window.api?.staffShifts?.getHistory) {
      const res = await window.api.staffShifts.getHistory(filter);
      if (!res.success) throw new Error(res.error || 'Failed to fetch shift history.');
      return res.data || [];
    }
    return [];
  },

  async requestShiftChange(input: {
    target_date: string;
    requested_shift_template_id?: number;
    is_requested_week_off?: boolean;
    reason: string;
  }): Promise<{ success: boolean; id?: number; message: string }> {
    if (window.api?.staffShifts?.requestChange) {
      const res = await window.api.staffShifts.requestChange(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit shift change request.');
      return { success: true, id: res.id, message: res.message || 'Request submitted.' };
    }
    return { success: true, id: 1, message: 'Request submitted in mock mode.' };
  },

  async requestShiftSwap(input: {
    target_staff_id: number;
    shift_date: string;
    reason: string;
  }): Promise<{ success: boolean; id?: number; message: string }> {
    if (window.api?.staffShifts?.requestSwap) {
      const res = await window.api.staffShifts.requestSwap(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit shift swap request.');
      return { success: true, id: res.id, message: res.message || 'Swap request submitted.' };
    }
    return { success: true, id: 1, message: 'Swap request submitted in mock mode.' };
  },

  async getShiftRequests(): Promise<ShiftRequestItem[]> {
    if (window.api?.staffShifts?.getRequests) {
      const res = await window.api.staffShifts.getRequests();
      if (!res.success) throw new Error(res.error || 'Failed to fetch shift requests.');
      return res.data || [];
    }
    return [];
  },

  async cancelRequest(id: number, type: 'CHANGE' | 'SWAP'): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffShifts?.cancelRequest) {
      const res = await window.api.staffShifts.cancelRequest(id, type);
      if (!res.success) throw new Error(res.error || 'Failed to cancel request.');
      return { success: true, message: res.message || 'Request cancelled.' };
    }
    return { success: true, message: 'Request cancelled in mock mode.' };
  },

  async getSwapCandidates(dateStr: string): Promise<SwapCandidateItem[]> {
    if (window.api?.staffShifts?.getSwapCandidates) {
      const res = await window.api.staffShifts.getSwapCandidates(dateStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch swap candidates.');
      return res.data || [];
    }
    return [];
  },

  async getShiftTemplates(): Promise<ShiftTemplateOption[]> {
    if (window.api?.staffShifts?.getTemplates) {
      const res = await window.api.staffShifts.getTemplates();
      if (!res.success) throw new Error(res.error || 'Failed to fetch shift templates.');
      return res.data || [];
    }
    return [];
  },
};
