import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../../api/authApi';
import { StorageManager, UserSessionData } from '../../utils/storage';
import { checkPermissionMatch } from '../../auth/permissions';

export interface AuthUser {
  userId: number;
  username: string;
  displayName: string;
  roleId: number;
  roleName: string;
  permissions: string[];
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  isLocked: boolean;
  setupRequired: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  lockScreen: () => void;
  unlockScreen: (password: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = StorageManager.getCurrentUser();
    if (saved && StorageManager.isAuthenticated()) {
      return {
        userId: Number(saved.id) || 1,
        username: saved.username,
        displayName: saved.name,
        roleId: saved.roleId || 1,
        roleName: saved.role,
        permissions: saved.permissions || [],
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.auth) {
        const setupRes = await window.api.auth.checkSetup();
        setSetupRequired(setupRes.setupRequired);

        if (!setupRes.setupRequired) {
          const user = await window.api.auth.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            const userSession: UserSessionData = {
              id: user.userId,
              username: user.username,
              name: user.displayName,
              role: user.roleName,
              roleId: user.roleId,
              permissions: user.permissions,
            };
            StorageManager.setCurrentUser(userSession);
          }
        }
      } else {
        const res = await authApi.getCurrentUser();
        if (res.success && res.data) {
          const uRole = res.data.role || 'Cashier';
          const uRoleId = res.data.roleId || (uRole === 'Owner' ? 1 : 3);
          setCurrentUser({
            userId: Number(res.data.id) || 1,
            username: res.data.username,
            displayName: res.data.name,
            roleId: uRoleId,
            roleName: uRole,
            permissions: res.data.permissions || [],
          });
        }
        setSetupRequired(false);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    if (window.api && window.api.auth) {
      const res = await window.api.auth.login(username, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        const userSession: UserSessionData = {
          id: res.user.userId,
          username: res.user.username,
          name: res.user.displayName,
          role: res.user.roleName,
          roleId: res.user.roleId,
          permissions: res.user.permissions,
        };
        StorageManager.setToken(`texora_token_${Date.now()}`);
        StorageManager.setCurrentUser(userSession);
        setIsLocked(false);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed.' };
    }

    const res = await authApi.login({ username, password });
    if (res.success && res.data) {
      const uRole = res.data.user.role || 'Cashier';
      const uRoleId = res.data.user.roleId || (uRole === 'Owner' ? 1 : 3);
      const uPerms = res.data.user.permissions || res.data.permissions || (uRole === 'Owner' ? ['*'] : []);
      setCurrentUser({
        userId: Number(res.data.user.id) || 1,
        username: res.data.user.username,
        displayName: res.data.user.name,
        roleId: uRoleId,
        roleName: uRole,
        permissions: uPerms,
      });
      setIsLocked(false);
      return { success: true };
    }
    return { success: false, error: res.error?.message || 'Login failed.' };
  };

  const logout = async () => {
    await authApi.logout();
    if (window.api && window.api.auth) {
      try {
        await window.api.auth.logout();
      } catch {}
    }
    setCurrentUser(null);
    setIsLocked(false);
  };

  const lockScreen = () => {
    if (currentUser) {
      setIsLocked(true);
    }
  };

  const unlockScreen = async (password: string) => {
    if (!currentUser) {
      return { success: false, error: 'Session expired.' };
    }

    if (!window.api || !window.api.auth) {
      setIsLocked(false);
      return { success: true };
    }

    const res = await window.api.auth.login(currentUser.username, password);
    if (res.success) {
      setIsLocked(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid password.' };
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.roleId === 1 || currentUser.roleName === 'Owner' || currentUser.roleName === 'SUPER_ADMIN' || currentUser.permissions.includes('*')) {
      return true;
    }
    return checkPermissionMatch(currentUser.permissions, permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isLocked,
        setupRequired,
        login,
        logout,
        lockScreen,
        unlockScreen,
        checkAuth,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
