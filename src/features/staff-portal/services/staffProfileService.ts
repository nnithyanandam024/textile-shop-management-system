export interface StaffProfile {
  id: number;
  staffCode: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  designationId: number;
  designationName: string;
  designationCode: string;
  managerId: number | null;
  managerName: string | null;
  workLocation: string;
  joiningDate: string;
  employmentType: string;
  status: string;
  photoPath: string | null;
  userId: number | null;
  username: string | null;
  emergencyContact?: {
    id: number;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
  } | null;
}

export interface EmergencyContact {
  id: number;
  staff_id: number;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone?: string;
  address?: string;
  is_primary: number;
}

export interface ProfileActivityItem {
  id: number;
  action: string;
  description: string;
  timestamp: string;
}

export interface ProfileChangeRequest {
  id: number;
  staff_id: number;
  field_name: string;
  old_value?: string;
  new_value: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export const staffProfileService = {
  async getMyProfile(): Promise<StaffProfile> {
    if (window.api?.staffProfile?.getMyProfile) {
      const res = await window.api.staffProfile.getMyProfile();
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch profile.');
      }
      return res.data;
    }

    // Mock fallback
    return {
      id: 2,
      staffCode: 'STF-0002',
      firstName: 'Arun',
      lastName: 'Kumar',
      fullName: 'Arun Kumar',
      dateOfBirth: '1996-05-15',
      gender: 'Male',
      phone: '+91 98765 22002',
      alternatePhone: null,
      email: 'arun.cashier@ratnavilas.com',
      addressLine1: '123 Crosscut Road',
      addressLine2: 'Gandhipuram',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641012',
      departmentId: 1,
      departmentName: 'Storefront Sales',
      departmentCode: 'DEP-001',
      designationId: 1,
      designationName: 'Senior Sales Associate',
      designationCode: 'DES-001',
      managerId: 1,
      managerName: 'Rajesh Kumar',
      workLocation: 'Main Store',
      joiningDate: '2026-01-01',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      photoPath: null,
      userId: 3,
      username: 'arun.cashier',
      emergencyContact: {
        id: 1,
        name: 'Ramesh Kumar',
        relationship: 'Father',
        phone: '+91 98765 00111',
      },
    };
  },

  async updateMyProfile(fields: Partial<StaffProfile>): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffProfile?.updateMyProfile) {
      const res = await window.api.staffProfile.updateMyProfile(fields);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile.');
      }
      return { success: true, message: res.message || 'Profile updated successfully.' };
    }
    return { success: true, message: 'Profile updated in mock mode.' };
  },

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    if (window.api?.staffProfile?.getEmergencyContacts) {
      const res = await window.api.staffProfile.getEmergencyContacts();
      if (!res.success) throw new Error(res.error || 'Failed to get contacts');
      return res.data || [];
    }
    return [];
  },

  async saveEmergencyContact(input: {
    id?: number;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    isPrimary?: boolean;
  }): Promise<{ success: boolean; id?: number; message: string }> {
    if (window.api?.staffProfile?.saveEmergencyContact) {
      const res = await window.api.staffProfile.saveEmergencyContact(input);
      if (!res.success) throw new Error(res.error || 'Failed to save contact.');
      return { success: true, id: res.id, message: res.message || 'Saved successfully.' };
    }
    return { success: true, id: 1, message: 'Saved in mock mode.' };
  },

  async deleteEmergencyContact(id: number): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffProfile?.deleteEmergencyContact) {
      const res = await window.api.staffProfile.deleteEmergencyContact(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete contact.');
      return { success: true, message: res.message || 'Deleted successfully.' };
    }
    return { success: true, message: 'Deleted in mock mode.' };
  },

  async uploadPhoto(dataUrl: string): Promise<{ success: boolean; photoPath: string; message: string }> {
    if (window.api?.staffProfile?.uploadPhoto) {
      const res = await window.api.staffProfile.uploadPhoto(dataUrl);
      if (!res.success) throw new Error(res.error || 'Failed to upload photo.');
      return { success: true, photoPath: res.photoPath || dataUrl, message: res.message || 'Photo updated.' };
    }
    return { success: true, photoPath: dataUrl, message: 'Photo uploaded in mock mode.' };
  },

  async removePhoto(): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffProfile?.removePhoto) {
      const res = await window.api.staffProfile.removePhoto();
      if (!res.success) throw new Error(res.error || 'Failed to remove photo.');
      return { success: true, message: res.message || 'Photo removed.' };
    }
    return { success: true, message: 'Photo removed in mock mode.' };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffProfile?.changePassword) {
      const res = await window.api.staffProfile.changePassword({ currentPassword, newPassword });
      if (!res.success) throw new Error(res.error || 'Failed to change password.');
      return { success: true, message: res.message || 'Password changed successfully.' };
    }
    return { success: true, message: 'Password changed in mock mode.' };
  },

  async getActivity(): Promise<ProfileActivityItem[]> {
    if (window.api?.staffProfile?.getActivity) {
      const res = await window.api.staffProfile.getActivity();
      if (!res.success) throw new Error(res.error || 'Failed to fetch activity.');
      return res.data || [];
    }
    return [];
  },

  async requestChange(input: {
    fieldName: string;
    oldValue?: string;
    newValue: string;
    reason: string;
  }): Promise<{ success: boolean; id?: number; message: string }> {
    if (window.api?.staffProfile?.requestChange) {
      const res = await window.api.staffProfile.requestChange(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit change request.');
      return { success: true, id: res.id, message: res.message || 'Request submitted.' };
    }
    return { success: true, id: 1, message: 'Request submitted in mock mode.' };
  },

  async getChangeRequests(): Promise<ProfileChangeRequest[]> {
    if (window.api?.staffProfile?.getChangeRequests) {
      const res = await window.api.staffProfile.getChangeRequests();
      if (!res.success) throw new Error(res.error || 'Failed to fetch change requests.');
      return res.data || [];
    }
    return [];
  },
};
