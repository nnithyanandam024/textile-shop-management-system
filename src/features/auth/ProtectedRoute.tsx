import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AccessDeniedPage } from '../../components/auth/AccessDeniedPage';
import { checkPermissionMatch } from '../../auth/permissions';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps): React.ReactElement {
  const { currentUser, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafc] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#2012ad] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const roleName = (currentUser?.roleName || '').toLowerCase().trim();
  const isOwnerOrAdmin =
    currentUser?.roleId === 1 ||
    roleName.includes('owner') ||
    roleName.includes('admin') ||
    roleName.includes('super');

  if (isOwnerOrAdmin) {
    return <>{children}</>;
  }

  if (permission) {
    const isGranted =
      hasPermission(permission) ||
      checkPermissionMatch(currentUser.permissions || [], permission);

    if (!isGranted) {
      return <AccessDeniedPage requiredPermission={permission} />;
    }
  }

  return <>{children}</>;
}
