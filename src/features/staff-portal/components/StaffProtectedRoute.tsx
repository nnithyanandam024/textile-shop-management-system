import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../hooks/useStaffAuth';

interface StaffProtectedRouteProps {
  children: ReactNode;
}

export const StaffProtectedRoute: React.FC<StaffProtectedRouteProps> = ({ children }) => {
  const { currentStaffUser, isLoading } = useStaffAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#2818cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Verifying staff credentials...</p>
      </div>
    );
  }

  if (!currentStaffUser) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
