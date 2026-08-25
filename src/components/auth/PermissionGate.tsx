import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { checkPermissionMatch } from '../../auth/permissions';

interface PermissionGateProps {
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  hideIfUnauthorized?: boolean;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  hideIfUnauthorized = true,
  children,
}) => {
  const { currentUser, hasPermission } = useAuth();

  const roleName = (currentUser?.roleName || '').toLowerCase().trim();
  const permissions = currentUser?.permissions || [];

  const isOwnerOrAdmin =
    currentUser?.roleId === 1 ||
    roleName.includes('owner') ||
    roleName.includes('admin') ||
    roleName.includes('super');

  if (isOwnerOrAdmin) {
    return <>{children}</>;
  }

  const permArray = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permArray.every((p) => hasPermission(p) || checkPermissionMatch(permissions, p))
    : permArray.some((p) => hasPermission(p) || checkPermissionMatch(permissions, p));

  if (!hasAccess) {
    return hideIfUnauthorized ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * React hook to evaluate permission inside components
 */
export function usePermission(permission: string | string[]): boolean {
  const { currentUser, hasPermission } = useAuth();

  const roleName = (currentUser?.roleName || '').toLowerCase().trim();
  const permissions = currentUser?.permissions || [];

  if (
    currentUser?.roleId === 1 ||
    roleName.includes('owner') ||
    roleName.includes('admin') ||
    roleName.includes('super')
  ) {
    return true;
  }

  const permArray = Array.isArray(permission) ? permission : [permission];
  return permArray.some((p) => hasPermission(p) || checkPermissionMatch(permissions, p));
}
