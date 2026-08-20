export interface StaffSalaryComponentItem {
  id: number;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationMethod: string;
  value: number;
  amount: number;
}

export interface StaffSalaryOverview {
  staffId: number;
  basicSalary: number;
  grossSalary: number;
  payFrequency: string;
  effectiveFrom: string;
  components: StaffSalaryComponentItem[];
}

export interface StaffAttendanceImpactSummary {
  scheduledDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  lateArrivals: number;
  attendanceDeduction: number;
}

export interface StaffLeaveImpactSummary {
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  dailyRate: number;
  unpaidLeaveDeduction: number;
}

export interface StaffOvertimeSummary {
  approvedHours: number;
  hourlyRate: number;
  overtimeAmount: number;
  recordsCount: number;
}

export interface StaffIncentiveSummary {
  totalIncentives: number;
  items: Array<{
    id: number;
    incentiveType: string;
    amount: number;
    targetAchievement?: number;
    reason?: string;
    status: string;
  }>;
}

export interface StaffPayrollDetails {
  id: number;
  payrollPeriodId: number;
  periodName: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  staffId: number;
  staffCode: string;
  staffName: string;
  departmentName: string;
  designationName: string;
  basicSalary: number;
  grossEarnings: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  finalizedAt?: string;
  earnings: Array<{ name: string; amount: number; code: string }>;
  deductions: Array<{ name: string; amount: number; code: string }>;
  attendanceImpact: StaffAttendanceImpactSummary;
  leaveImpact: StaffLeaveImpactSummary;
  overtimeSummary: StaffOvertimeSummary;
  incentiveSummary: StaffIncentiveSummary;
}

export interface StaffPayrollHistoryItem {
  id: number;
  payrollPeriodId: number;
  periodName: string;
  year: number;
  month: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  finalizedAt?: string;
}

export interface StaffSalaryRevisionItem {
  id: number;
  effectiveFrom: string;
  effectiveTo?: string;
  basicSalary: number;
  grossSalary: number;
  status: string;
  reason?: string;
}

export class StaffPayrollService {
  async getCurrentPayroll(periodId?: number): Promise<StaffPayrollDetails | null> {
    if (window.api?.staffPayroll?.getCurrent) {
      const res = await window.api.staffPayroll.getCurrent(periodId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch payroll summary.');
      return res.data;
    }
    return null;
  }

  async getPayrollPeriods(): Promise<Array<{ id: number; name: string; year: number; month: number; status: string }>> {
    if (window.api?.staffPayroll?.getPeriods) {
      const res = await window.api.staffPayroll.getPeriods();
      if (!res.success) throw new Error(res.error || 'Failed to fetch payroll periods.');
      return res.data || [];
    }
    return [];
  }

  async getPayrollHistory(): Promise<StaffPayrollHistoryItem[]> {
    if (window.api?.staffPayroll?.getHistory) {
      const res = await window.api.staffPayroll.getHistory();
      if (!res.success) throw new Error(res.error || 'Failed to fetch payroll history.');
      return res.data || [];
    }
    return [];
  }

  async getPayslipDetails(recordId: number): Promise<StaffPayrollDetails> {
    if (window.api?.staffPayroll?.getDetails) {
      const res = await window.api.staffPayroll.getDetails(recordId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch payslip details.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getSalaryOverview(): Promise<StaffSalaryOverview | null> {
    if (window.api?.staffPayroll?.getSalaryOverview) {
      const res = await window.api.staffPayroll.getSalaryOverview();
      if (!res.success) throw new Error(res.error || 'Failed to fetch salary overview.');
      return res.data;
    }
    return null;
  }

  async getSalaryHistory(): Promise<StaffSalaryRevisionItem[]> {
    if (window.api?.staffPayroll?.getSalaryHistory) {
      const res = await window.api.staffPayroll.getSalaryHistory();
      if (!res.success) throw new Error(res.error || 'Failed to fetch salary history.');
      return res.data || [];
    }
    return [];
  }

  async getOvertimeSummary(monthStr?: string): Promise<StaffOvertimeSummary | null> {
    if (window.api?.staffPayroll?.getOvertime) {
      const res = await window.api.staffPayroll.getOvertime(monthStr);
      if (!res.success) throw new Error(res.error || 'Failed to fetch overtime summary.');
      return res.data;
    }
    return null;
  }

  async getIncentiveSummary(periodName?: string): Promise<StaffIncentiveSummary | null> {
    if (window.api?.staffPayroll?.getIncentives) {
      const res = await window.api.staffPayroll.getIncentives(periodName);
      if (!res.success) throw new Error(res.error || 'Failed to fetch incentives.');
      return res.data;
    }
    return null;
  }
}

export const staffPayrollService = new StaffPayrollService();
