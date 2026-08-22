import { useState, useEffect, useCallback } from 'react';
import { authApi, LoginCredentials } from '../api/authApi';
import { StorageManager, UserSessionData } from '../utils/storage';
import { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } from '../utils/permissions';
import apiClient from '../api/client';

export function useAuth() {
  const [user, setUser] = useState<UserSessionData | null>(() => StorageManager.getCurrentUser());
  const [permissions, setPermissions] = useState<string[]>(() => StorageManager.getPermissions());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => StorageManager.isAuthenticated());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!StorageManager.isAuthenticated()) {
        if (mounted) {
          setUser(null);
          setPermissions([]);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await authApi.getCurrentUser();
        if (mounted) {
          if (res.success && res.data) {
            setUser(res.data);
            setPermissions(res.data.permissions || []);
            setIsAuthenticated(true);
          } else {
            StorageManager.clearSession();
            setUser(null);
            setPermissions([]);
            setIsAuthenticated(false);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Session verification failed.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // Subscribe to client 401 invalidation
    const unsubscribe = apiClient.onAuthInvalid(() => {
      if (mounted) {
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        setUser(res.data.user);
        setPermissions(res.data.permissions || []);
        setIsAuthenticated(true);
        return { success: true, user: res.data.user };
      } else {
        const msg = res.error?.message || 'Invalid username or password.';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setPermissions([]);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (passwords: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.changePassword(passwords);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to update password.');
      }
      return { success: true, message: res.message || 'Password changed successfully.' };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    role: user?.role || null,
    permissions,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    changePassword,
    hasRole: useCallback((roles: string[]) => hasRole(user?.role, roles), [user?.role]),
    hasPermission: useCallback((perm: string) => hasPermission(permissions, perm), [permissions]),
    hasAnyPermission: useCallback((perms: string[]) => hasAnyPermission(permissions, perms), [permissions]),
    hasAllPermissions: useCallback((perms: string[]) => hasAllPermissions(permissions, perms), [permissions]),
    clearError: () => setError(null),
  };
}

export default useAuth;
