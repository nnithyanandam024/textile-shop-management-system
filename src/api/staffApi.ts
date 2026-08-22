import apiClient, { ApiResponse } from './client';

export interface StaffProfileData {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentName?: string;
  designationName?: string;
  workLocation?: string;
  joiningDate?: string;
  status: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

export const staffApi = {
  /**
   * Get authenticated staff profile
   */
  async getProfile(): Promise<ApiResponse<StaffProfileData>> {
    if (typeof window !== 'undefined' && window.api?.staffProfile?.getMyProfile) {
      try {
        const res = await window.api.staffProfile.getMyProfile();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
        return { success: false, error: { code: 'NOT_FOUND', message: res.error || 'Profile not found.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.get<StaffProfileData>('/staff/profile');
  },

  /**
   * Update staff profile info
   */
  async updateProfile(data: Partial<StaffProfileData>): Promise<ApiResponse<StaffProfileData>> {
    if (typeof window !== 'undefined' && window.api?.staffProfile?.updateMyProfile) {
      try {
        const res = await window.api.staffProfile.updateMyProfile(data);
        if (res.success) {
          return { success: true, data: data as any, message: res.message || 'Profile updated successfully.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Failed to update.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.patch<StaffProfileData>('/staff/profile', data);
  },

  /**
   * Get operational dashboard snapshot
   */
  async getDashboard(): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffDashboard?.getDashboardSummary) {
      try {
        const res = await window.api.staffDashboard.getDashboardSummary();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
        return { success: false, error: { code: 'SERVER_ERROR', message: res.error || 'Failed to load dashboard.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.get('/staff/dashboard');
  },

  /**
   * Get specific staff details by ID (Manager/Admin scoped)
   */
  async getStaffDetails(staffId: number): Promise<ApiResponse<StaffProfileData>> {
    if (typeof window !== 'undefined' && window.api?.staff?.getById) {
      try {
        const res = await window.api.staff.getById(staffId);
        if (res) return { success: true, data: res };
      } catch {}
    }
    return apiClient.get<StaffProfileData>(`/staff/${staffId}`);
  },
};

export default staffApi;
