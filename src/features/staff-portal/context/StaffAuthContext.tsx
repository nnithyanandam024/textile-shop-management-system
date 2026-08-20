import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { staffAuthService, StaffUser } from '../services/staffAuthService';

interface StaffAuthContextType {
  currentStaffUser: StaffUser | null;
  isLoading: boolean;
  login: (employeeId: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkStaffAuth: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkStaffAuth = async () => {
    setIsLoading(true);
    try {
      const staff = await staffAuthService.getCurrentStaffUser();
      setCurrentStaffUser(staff);
    } catch (err) {
      console.error('Failed to check staff auth status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStaffAuth();
  }, []);

  const login = async (employeeId: string, password: string, rememberMe: boolean = false) => {
    const res = await staffAuthService.login(employeeId, password, rememberMe);
    if (res.success && res.user) {
      setCurrentStaffUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid Employee ID or Password.' };
  };

  const logout = async () => {
    await staffAuthService.logout();
    setCurrentStaffUser(null);
  };

  return (
    <StaffAuthContext.Provider
      value={{
        currentStaffUser,
        isLoading,
        login,
        logout,
        checkStaffAuth,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = (): StaffAuthContextType => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};
