import apiClient, { ApiResponse } from './client';

export interface SalaryBreakdown {
  payrollId: number;
  monthYear: string;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PROCESSING';
  paymentDate?: string;
  paymentMode?: string;
}

export const payrollApi = {
  /**
   * Get employee's current payroll and payslip breakdown
   */
  async getMyPayroll(period?: string): Promise<ApiResponse<SalaryBreakdown>> {
    if (typeof window !== 'undefined' && window.api?.staffPayroll?.getSalaryOverview) {
      try {
        const res = await window.api.staffPayroll.getSalaryOverview();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<SalaryBreakdown>('/payroll/my-salary', { params: { period } });
  },

  /**
   * Get PDF payslip download advice or binary payload
   */
  async getPayslip(payrollId: number): Promise<ApiResponse<{ downloadUrl?: string; pdfBase64?: string }>> {
    if (typeof window !== 'undefined' && window.api?.staffPayroll?.getDetails) {
      try {
        const res = await window.api.staffPayroll.getDetails(payrollId);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get(`/payroll/payslip/${payrollId}`);
  },

  /**
   * Get employee's historical payroll records
   */
  async getPayrollHistory(_year?: number): Promise<ApiResponse<SalaryBreakdown[]>> {
    if (typeof window !== 'undefined' && window.api?.staffPayroll?.getHistory) {
      try {
        const res = await window.api.staffPayroll.getHistory();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<SalaryBreakdown[]>('/payroll/history', { params: { year: _year } });
  },
};

export default payrollApi;
