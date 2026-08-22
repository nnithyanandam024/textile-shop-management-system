import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getDefaultRouteForUser } from '../../auth/permissions';
import { Button } from '../ui/Button';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Home } from 'lucide-react';

interface AccessDeniedPageProps {
  requiredPermission?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ requiredPermission }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const defaultRoute = getDefaultRouteForUser(currentUser);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-lg shadow-rose-100/50">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Denied</h1>
      <p className="text-xs font-semibold text-slate-500 max-w-md mt-2 leading-relaxed">
        You do not have permission to access this feature or section.
        {requiredPermission && (
          <span className="block mt-1 font-mono text-[#2818cf] font-bold">
            Required Permission Code: {requiredPermission}
          </span>
        )}
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button
          variant="primary"
          icon={defaultRoute === '/dashboard' ? <LayoutDashboard className="w-4 h-4" /> : <Home className="w-4 h-4" />}
          onClick={() => navigate(defaultRoute, { replace: true })}
        >
          {defaultRoute === '/dashboard' ? 'Back to Dashboard' : 'Back to My Workspace'}
        </Button>
      </div>
    </div>
  );
};
