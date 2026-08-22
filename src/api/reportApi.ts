import apiClient, { ApiResponse } from './client';

export const reportApi = {
  /**
   * Get scoped sales performance report
   */
  async getMySales(filters?: { period?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffReports?.sales) {
      try {
        const res = await window.api.staffReports.sales(undefined, filters);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/reports/my-sales', { params: filters });
  },

  /**
   * Get scoped attendance and worked hours report
   */
  async getMyAttendance(monthYear?: string): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffReports?.attendance) {
      try {
        const res = await window.api.staffReports.attendance(undefined, monthYear);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/reports/my-attendance', { params: { monthYear } });
  },

  /**
   * Get scoped commission earnings report
   */
  async getMyCommission(period?: string): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffReports?.commission) {
      try {
        const res = await window.api.staffReports.commission(undefined, period);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/reports/my-commission', { params: { period } });
  },
};

export default reportApi;
