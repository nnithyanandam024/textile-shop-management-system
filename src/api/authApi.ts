import apiClient, { ApiResponse } from './client';
import { StorageManager, UserSessionData } from '../utils/storage';

export interface LoginCredentials {
  username?: string;
  employeeCode?: string;
  password?: string;
  pin?: string;
}

export interface LoginResponseData {
  token: string;
  user: UserSessionData;
  permissions: string[];
  expiresIn?: number;
}

export const authApi = {
  /**
   * Login with username/password or PIN
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    // 1. Electron IPC Bridge
    if (typeof window !== 'undefined' && window.api?.staffAuth?.login) {
      try {
        const res = await window.api.staffAuth.login({
          employeeId: credentials.employeeCode || credentials.username || '',
          password: credentials.password || credentials.pin || '',
        });

        if (res.success && res.user) {
          const userSession: UserSessionData = {
            id: res.user.id,
            username: res.user.username,
            name: res.user.displayName,
            role: res.user.roleName || 'STAFF',
            roleId: res.user.roleId,
            staffId: res.user.staffId,
            permissions: res.user.permissions || [],
          };

          const token = `texora_ipc_${Date.now()}_${res.user.id}`;
          StorageManager.setToken(token);
          StorageManager.setCurrentUser(userSession);
          StorageManager.setPermissions(userSession.permissions);

          return {
            success: true,
            data: {
              token,
              user: userSession,
              permissions: userSession.permissions,
            },
            message: 'Login successful',
          };
        }

        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: res.error || 'Invalid credentials.',
          },
        };
      } catch (err: any) {
        return {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: err.message || 'Login failed.',
          },
        };
      }
    }

    // 2. HTTP Transport Fallback
    const res = await apiClient.post<LoginResponseData>('/auth/login', credentials, { skipAuth: true });
    if (res.success && res.data) {
      StorageManager.setToken(res.data.token, res.data.expiresIn);
      StorageManager.setCurrentUser(res.data.user);
      StorageManager.setPermissions(res.data.permissions);
    }
    return res;
  },

  /**
   * Logout and clear local/IPC session
   */
  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    if (typeof window !== 'undefined' && window.api?.staffAuth?.logout) {
      try {
        await window.api.staffAuth.logout();
      } catch {}
    } else {
      try {
        await apiClient.post('/auth/logout');
      } catch {}
    }

    StorageManager.clearSession();
    return { success: true, data: { success: true }, message: 'Logged out successfully.' };
  },

  /**
   * Get Current Authenticated User & Session State
   */
  async getCurrentUser(): Promise<ApiResponse<UserSessionData>> {
    if (typeof window !== 'undefined' && window.api?.staffAuth?.getCurrentStaffUser) {
      try {
        const res = await window.api.staffAuth.getCurrentStaffUser();
        if (res) {
          const userSession: UserSessionData = {
            id: res.id,
            username: res.username,
            name: res.displayName || res.username,
            role: res.roleName || 'STAFF',
            roleId: res.roleId,
            staffId: res.staffId,
            permissions: res.permissions || [],
          };
          StorageManager.setCurrentUser(userSession);
          return { success: true, data: userSession };
        }
      } catch {}
    }

    const localUser = StorageManager.getCurrentUser();
    if (localUser && StorageManager.isAuthenticated()) {
      return { success: true, data: localUser };
    }

    return apiClient.get<UserSessionData>('/auth/me');
  },

  /**
   * Refresh session token & permissions
   */
  async refreshSession(): Promise<ApiResponse<{ token: string; user: UserSessionData }>> {
    const res = await apiClient.post<{ token: string; user: UserSessionData }>('/auth/refresh');
    if (res.success && res.data) {
      StorageManager.setToken(res.data.token);
      StorageManager.setCurrentUser(res.data.user);
    }
    return res;
  },

  /**
   * Change user password securely
   */
  async changePassword(passwords: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ success: boolean }>> {
    if (typeof window !== 'undefined' && window.api?.staffSettings?.updatePassword) {
      try {
        const user = StorageManager.getCurrentUser();
        const res = await window.api.staffSettings.updatePassword(
          Number(user?.id) || 0,
          passwords.currentPassword,
          passwords.newPassword
        );
        if (res.success) {
          return { success: true, data: { success: true }, message: res.message || 'Password changed.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Failed to change password.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: err.message || 'Failed to change password.' } };
      }
    }

    return apiClient.post<{ success: boolean }>('/auth/change-password', passwords);
  },
};

export default authApi;
