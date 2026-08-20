export interface StaffUser {
  userId: number;
  staffId: number;
  employeeCode: string;
  username: string;
  displayName: string;
  roleId: number;
  roleName: string;
  departmentName?: string;
  designationName?: string;
  status: string;
  permissions: string[];
}

const REMEMBER_ME_KEY = 'texora_staff_remember';

export const staffAuthService = {
  async login(
    employeeId: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; user?: StaffUser; error?: string }> {
    if (!window.api?.staffAuth) {
      // Browser Demo Mock Fallback
      if (!employeeId.trim() && !password.trim()) {
        return { success: false, error: 'Please enter your Employee ID and Password.' };
      }
      if (!employeeId.trim()) {
        return { success: false, error: 'Employee ID is required.' };
      }
      if (!password.trim()) {
        return { success: false, error: 'Password is required.' };
      }
      if (password === 'wrong') {
        return { success: false, error: 'Invalid Employee ID or Password.' };
      }

      const mockUser: StaffUser = {
        userId: 2,
        staffId: 1,
        employeeCode: employeeId || 'STF-0001',
        username: employeeId.toLowerCase(),
        displayName: 'Arun Kumar',
        roleId: 3,
        roleName: 'STAFF',
        departmentName: 'Storefront Sales',
        designationName: 'Senior Sales Associate',
        status: 'ACTIVE',
        permissions: ['self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view'],
      };

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ employeeCode: mockUser.employeeCode }));
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      return { success: true, user: mockUser };
    }

    const res = await window.api.staffAuth.login({ employeeId, password, rememberMe });
    if (res.success && res.user) {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ employeeCode: res.user.employeeCode }));
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    }
    return res;
  },

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem(REMEMBER_ME_KEY);
    if (window.api?.staffAuth) {
      return await window.api.staffAuth.logout();
    }
    return { success: true };
  },

  async getCurrentStaffUser(): Promise<StaffUser | null> {
    if (window.api?.staffAuth) {
      return await window.api.staffAuth.getCurrentStaffUser();
    }
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          userId: 2,
          staffId: 1,
          employeeCode: parsed.employeeCode || 'STF-0001',
          username: 'arun.cashier',
          displayName: 'Arun Kumar',
          roleId: 3,
          roleName: 'STAFF',
          departmentName: 'Storefront Sales',
          designationName: 'Senior Sales Associate',
          status: 'ACTIVE',
          permissions: ['self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view'],
        };
      } catch {
        return null;
      }
    }
    return null;
  },

  getRememberedEmployeeId(): string {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.employeeCode || '';
      } catch {
        return '';
      }
    }
    return '';
  },
};
