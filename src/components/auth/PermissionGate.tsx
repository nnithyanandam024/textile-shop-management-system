/**
 * Phase 15 — PermissionGate Component
 * Granular UI Authorization Wrapper for conditional element/button rendering.
 */
import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';

export interface PermissionGateProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  disableOnly?: boolean;
  disabledTooltip?: string;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  disableOnly = false,
  disabledTooltip = 'You do not have permission to perform this action.',
  children,
}) => {
  const { hasPermission } = useAuth();

  let isAuthorized = true;

  if (permission) {
    isAuthorized = hasPermission(permission);
  }

  if (isAuthorized && anyPermissions && anyPermissions.length > 0) {
    isAuthorized = anyPermissions.some((p) => hasPermission(p));
  }

  if (isAuthorized && allPermissions && allPermissions.length > 0) {
    isAuthorized = allPermissions.every((p) => hasPermission(p));
  }

  if (!isAuthorized) {
    if (disableOnly) {
      return (
        <div className="relative inline-flex group cursor-not-allowed" title={disabledTooltip}>
          <div className="pointer-events-none opacity-50 select-none">
            {children}
          </div>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
