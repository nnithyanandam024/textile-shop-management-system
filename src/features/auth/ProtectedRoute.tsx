import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldAlert } from 'lucide-react';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps): React.ReactElement {
  const { currentUser, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafc] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#2818cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading Texora System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Denied (403)</h2>
          <p className="text-slate-500 mt-2 mb-6 text-sm">
            Your assigned role (<span className="font-semibold text-slate-800">{currentUser.roleName}</span>) does not have permission to access this module.
          </p>
          <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono">
            Required Permission: {permission}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
