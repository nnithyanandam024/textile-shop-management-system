import apiClient, { ApiResponse } from './client';

export interface LeaveRequestInput {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  documentPath?: string;
}

export interface LeaveRequestRecord {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export const leaveApi = {
  /**
   * Submit a new leave application
   */
  async createRequest(input: LeaveRequestInput): Promise<ApiResponse<LeaveRequestRecord>> {
    if (typeof window !== 'undefined' && window.api?.staffLeave?.apply) {
      try {
        const res = await window.api.staffLeave.apply({
          leave_type_id: input.leaveTypeId,
          start_date: input.startDate,
          end_date: input.endDate,
          reason: input.reason,
          document_path: input.documentPath,
        });
        if (res.success) {
          return { success: true, data: res as any, message: res.message || 'Leave application submitted successfully.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Failed to submit leave.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.post<LeaveRequestRecord>('/leave/requests', input);
  },

  /**
   * Get employee's leave requests history
   */
  async getMyRequests(filters?: { status?: string; year?: number }): Promise<ApiResponse<LeaveRequestRecord[]>> {
    if (typeof window !== 'undefined' && window.api?.staffLeave?.getRequests) {
      try {
        const res = await window.api.staffLeave.getRequests(filters);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<LeaveRequestRecord[]>('/leave/my-requests', { params: filters });
  },

  /**
   * Get leave request details by ID
   */
  async getRequest(id: number): Promise<ApiResponse<LeaveRequestRecord>> {
    if (typeof window !== 'undefined' && window.api?.staffLeave?.getDetails) {
      try {
        const res = await window.api.staffLeave.getDetails(id);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<LeaveRequestRecord>(`/leave/requests/${id}`);
  },

  /**
   * Cancel a pending leave request
   */
  async cancelRequest(id: number): Promise<ApiResponse<{ success: boolean }>> {
    if (typeof window !== 'undefined' && window.api?.staffLeave?.cancel) {
      try {
        const res = await window.api.staffLeave.cancel(id);
        if (res.success) {
          return { success: true, data: { success: true }, message: res.message || 'Leave request cancelled.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Failed to cancel.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.delete<{ success: boolean }>(`/leave/requests/${id}`);
  },
};

export default leaveApi;
