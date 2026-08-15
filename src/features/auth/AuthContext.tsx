import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
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
          setCurrentUser(user);
        }
      } else {
        // Web Browser Fallback (when opened directly in Chrome browser at http://localhost:5173)
        console.warn('Electron IPC API not detected. Web Browser fallback active.');
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
    if (!window.api || !window.api.auth) {
      // Browser Demo Fallback
      console.info(`[Browser Mock Auth] Logging in user: ${username}`);
      const mockUser: AuthUser = {
        userId: 1,
        username: username || 'admin',
        displayName: username === 'admin' ? 'Store Administrator' : username,
        roleId: 1,
        roleName: 'Owner',
        permissions: ['*'],
      };
      setCurrentUser(mockUser);
      setIsLocked(false);
      return { success: true };
    }

    const res = await window.api.auth.login(username, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsLocked(false);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed.' };
  };

  const logout = async () => {
    if (window.api && window.api.auth) {
      await window.api.auth.logout();
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
    if (currentUser.roleId === 1 || currentUser.roleName === 'Owner' || currentUser.permissions.includes('*')) return true;
    return currentUser.permissions.includes(permissionCode);
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
