export interface StaffLeaveBalanceItem {
  leaveTypeId: number;
  leaveCode: string;
  leaveName: string;
  isPaid: boolean;
  allocatedDays: number;
  carryForwardDays: number;
  usedDays: number;
  adjustmentDays: number;
  availableDays: number;
  pendingDays: number;
  remainingAfterPending: number;
}

export interface StaffLeaveTypeOption {
  id: number;
  code: string;
  name: string;
  description?: string;
  isPaid: boolean;
  requiresApproval: boolean;
  requiresDocument: boolean;
  annualAllocation: number;
  maxConsecutiveDays: number;
}

export interface StaffLeaveRequestItem {
  id: number;
  staffId: number;
  leaveTypeId: number;
  leaveCode: string;
  leaveName: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationType: 'FULL_DAY' | 'HALF_DAY';
  session?: 'MORNING' | 'AFTERNOON';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  attachmentPath?: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface StaffPermissionRequestItem {
  id: number;
  staffId: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  durationFormatted: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface LeaveCalendarDayItem {
  date: string;
  dayNum: number;
  dayName: string;
  shortDayName: string;
  status: 'APPROVED_LEAVE' | 'PENDING_LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'WORKING';
  symbol: 'L' | 'P' | 'H' | 'O' | 'W';
  label: string;
  leaveTypeName?: string;
  isHalfDay?: boolean;
  session?: 'MORNING' | 'AFTERNOON';
  holidayName?: string;
}

export interface LeaveCalendarData {
  month: string;
  monthStr: string;
  totalDays: number;
  days: LeaveCalendarDayItem[];
}

export interface LeaveHistoryData {
  year: number;
  requests: StaffLeaveRequestItem[];
  summaryByMonth: Record<string, number>;
}

export class StaffLeaveService {
  async getLeaveBalances(year?: number): Promise<StaffLeaveBalanceItem[]> {
    if (window.api?.staffLeave?.getBalances) {
      const res = await window.api.staffLeave.getBalances(year);
      if (!res.success) throw new Error(res.error || 'Failed to fetch leave balances.');
      return res.data || [];
    }
    return [];
  }

  async getLeaveTypes(): Promise<StaffLeaveTypeOption[]> {
    if (window.api?.staffLeave?.getTypes) {
      const res = await window.api.staffLeave.getTypes();
      if (!res.success) throw new Error(res.error || 'Failed to fetch leave types.');
      return res.data || [];
    }
    return [];
  }

  async applyLeave(input: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    duration_type?: 'FULL_DAY' | 'HALF_DAY';
    session?: 'MORNING' | 'AFTERNOON';
    reason: string;
    attachment_path?: string;
  }): Promise<{ success: boolean; id: number; message: string }> {
    if (window.api?.staffLeave?.apply) {
      const res = await window.api.staffLeave.apply(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit leave request.');
      return { success: true, id: res.id || 0, message: res.message || 'Leave applied successfully.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getLeaveRequests(filters?: {
    leave_type_id?: number;
    status?: string;
    year?: number;
  }): Promise<StaffLeaveRequestItem[]> {
    if (window.api?.staffLeave?.getRequests) {
      const res = await window.api.staffLeave.getRequests(filters);
      if (!res.success) throw new Error(res.error || 'Failed to fetch leave requests.');
      return res.data || [];
    }
    return [];
  }

  async getLeaveDetails(requestId: number): Promise<StaffLeaveRequestItem> {
    if (window.api?.staffLeave?.getDetails) {
      const res = await window.api.staffLeave.getDetails(requestId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch leave details.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async cancelLeave(requestId: number): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffLeave?.cancel) {
      const res = await window.api.staffLeave.cancel(requestId);
      if (!res.success) throw new Error(res.error || 'Failed to cancel leave request.');
      return { success: true, message: res.message || 'Leave request cancelled.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getLeaveCalendar(monthStr?: string): Promise<LeaveCalendarData> {
    if (window.api?.staffLeave?.getCalendar) {
      const res = await window.api.staffLeave.getCalendar(monthStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch leave calendar.');
      return res.data;
    }
    return { month: '', monthStr: '', totalDays: 0, days: [] };
  }

  async getLeaveHistory(year?: number): Promise<LeaveHistoryData> {
    if (window.api?.staffLeave?.getHistory) {
      const res = await window.api.staffLeave.getHistory(year);
      if (!res.success) throw new Error(res.error || 'Failed to fetch leave history.');
      return res.data;
    }
    return { year: year || new Date().getFullYear(), requests: [], summaryByMonth: {} };
  }

  async requestPermission(input: {
    request_date: string;
    start_time: string;
    end_time: string;
    reason: string;
  }): Promise<{ success: boolean; id: number; message: string }> {
    if (window.api?.staffLeave?.requestPermission) {
      const res = await window.api.staffLeave.requestPermission(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit permission request.');
      return { success: true, id: res.id || 0, message: res.message || 'Permission request submitted.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getPermissionRequests(): Promise<StaffPermissionRequestItem[]> {
    if (window.api?.staffLeave?.getPermissions) {
      const res = await window.api.staffLeave.getPermissions();
      if (!res.success) throw new Error(res.error || 'Failed to fetch permission requests.');
      return res.data || [];
    }
    return [];
  }

  async cancelPermission(id: number): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffLeave?.cancelPermission) {
      const res = await window.api.staffLeave.cancelPermission(id);
      if (!res.success) throw new Error(res.error || 'Failed to cancel permission request.');
      return { success: true, message: res.message || 'Permission request cancelled.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }
}

export const staffLeaveService = new StaffLeaveService();
