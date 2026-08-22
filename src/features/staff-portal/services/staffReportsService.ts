export interface StaffSalesReportData {
  period: string;
  totalSalesVolume: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscountGiven: number;
  totalReturnsCount: number;
  totalRefundAmount: number;
  tenderBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  topProducts: Array<{
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  recentSales: Array<{
    id: number;
    invoiceNumber: string;
    total: number;
    saleDate: string;
    customerName: string;
    paymentMethod: string;
    itemsCount: number;
  }>;
}

export interface StaffAttendanceReportData {
  monthYear: string;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  lateArrivals: number;
  totalWorkedHours: number;
  averageDailyHours: number;
  dailyLogs: Array<{
    id: number;
    date: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    totalHours?: number;
    isLate: boolean;
  }>;
}

export interface StaffCommissionReportData {
  period: string;
  totalSalesVolume: number;
  commissionableVolume: number;
  commissionRate: number;
  commissionEarned: number;
  payoutStatus: 'PROCESSING' | 'FINALIZED' | 'PAID';
  recentCommissionSales: Array<{
    invoiceNumber: string;
    saleDate: string;
    saleTotal: number;
    commissionAmount: number;
    customerName: string;
  }>;
}

export interface StaffInventoryTasksReportData {
  stockCountsAssigned: number;
  stockCountsCompleted: number;
  stockMovementsHandled: number;
  adjustmentsSubmitted: number;
  recentTransactions: Array<{
    id: number;
    productName: string;
    sku: string;
    transactionType: string;
    quantity: number;
    createdAt: string;
    notes?: string;
  }>;
}

export class StaffReportsService {
  async getSalesReport(filters?: { period?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'; startDate?: string; endDate?: string }): Promise<StaffSalesReportData> {
    if (window.api?.staffReports?.sales) {
      const res = await window.api.staffReports.sales(undefined, filters);
      if (!res.success) throw new Error(res.error || 'Failed to generate sales report.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getAttendanceReport(monthYear?: string): Promise<StaffAttendanceReportData> {
    if (window.api?.staffReports?.attendance) {
      const res = await window.api.staffReports.attendance(undefined, monthYear);
      if (!res.success) throw new Error(res.error || 'Failed to generate attendance report.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getCommissionReport(period?: string): Promise<StaffCommissionReportData> {
    if (window.api?.staffReports?.commission) {
      const res = await window.api.staffReports.commission(undefined, period);
      if (!res.success) throw new Error(res.error || 'Failed to generate commission report.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getInventoryTasksReport(): Promise<StaffInventoryTasksReportData> {
    if (window.api?.staffReports?.inventoryTasks) {
      const res = await window.api.staffReports.inventoryTasks(undefined);
      if (!res.success) throw new Error(res.error || 'Failed to generate inventory tasks report.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }
}

export const staffReportsService = new StaffReportsService();
