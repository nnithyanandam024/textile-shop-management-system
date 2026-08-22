/**
 * Phase 15 — Backend Authorization & Data Scoping Engine
 */
import { SessionService } from './sessionService';
import { checkPermissionMatch, ROLE_PERMISSION_TEMPLATES } from '../../auth/permissions';
import log from '../../logger';

export interface ResourceOwnershipContext {
  userId?: number;
  staffId?: number;
  branchId?: number | string;
}

export class AuthorizationService {
  /**
   * Check if current session possesses the requested permission (including aliases and admin bypass)
   */
  static hasPermission(permissionCode: string): boolean {
    const session = SessionService.getSession();
    if (!session) {
      log.warn(`Authorization check failed: No active session for permission '${permissionCode}'`);
      return false;
    }

    // Deactivated or Suspended user sessions are rejected
    if (
      session.status === 'INACTIVE' ||
      session.status === 'SUSPENDED' ||
      (session as any).isActive === false ||
      (session as any).isActive === 0
    ) {
      log.warn(`Authorization DENIED: Inactive/Suspended session for user '${session.username}'`);
      return false;
    }

    // Owner role (roleId 1 or name 'Owner' or 'ADMIN' or '*') bypasses all checks
    if (
      session.roleId === 1 ||
      session.roleName === 'Owner' ||
      session.roleName === 'SUPER_ADMIN' ||
      (session.permissions && session.permissions.includes('*'))
    ) {
      return true;
    }

    const perms = (session.permissions && session.permissions.length > 0)
      ? session.permissions
      : (ROLE_PERMISSION_TEMPLATES[session.roleName] || []);

    const allowed = checkPermissionMatch(perms, permissionCode);
    if (!allowed) {
      log.warn(`Authorization DENIED: User '${session.username}' (${session.roleName}) lacks permission '${permissionCode}'`);
    }
    return allowed;
  }

  /**
   * Enforce permission or throw 403 Forbidden Error
   */
  static requirePermission(permissionCode: string): void {
    if (!this.hasPermission(permissionCode)) {
      throw new Error(`Access Denied: You do not have permission to perform this action (${permissionCode}).`);
    }
  }

  /**
   * Enforce role check
   */
  static requireRole(allowedRoles: string | string[]): void {
    const session = SessionService.getSession();
    if (!session) {
      throw new Error('Access Denied: Authentication required.');
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (
      session.roleId === 1 ||
      session.roleName === 'Owner' ||
      session.roleName === 'SUPER_ADMIN' ||
      roles.includes(session.roleName)
    ) {
      return;
    }

    throw new Error(`Access Denied: Restricted to role(s): ${roles.join(', ')}.`);
  }

  /**
   * Enforce data-level ownership scope (IDOR Protection)
   */
  static requireDataScope(
    requiredScope: 'SELF' | 'TEAM' | 'BRANCH' | 'ALL',
    resourceOwner: ResourceOwnershipContext
  ): void {
    const session = SessionService.getSession();
    if (!session) {
      throw new Error('Access Denied: Authentication required.');
    }

    // Super Admin / Owner has unrestricted access to all records
    if (
      session.roleId === 1 ||
      session.roleName === 'Owner' ||
      session.roleName === 'SUPER_ADMIN' ||
      session.permissions.includes('*') ||
      session.permissions.includes('SALES_VIEW_ALL') ||
      session.permissions.includes('PAYROLL_VIEW_ALL') ||
      session.permissions.includes('ATTENDANCE_VIEW_ALL') ||
      session.permissions.includes('LEAVE_VIEW_ALL')
    ) {
      return;
    }

    if (requiredScope === 'SELF') {
      const matchesUser = resourceOwner.userId !== undefined && resourceOwner.userId === session.userId;
      const matchesStaff = resourceOwner.staffId !== undefined && resourceOwner.staffId === session.staffId;

      if (!matchesUser && !matchesStaff) {
        log.warn(`IDOR Violation attempt by user ${session.userId} on resource owned by user ${resourceOwner.userId} / staff ${resourceOwner.staffId}`);
        throw new Error('Access Denied: You cannot access or modify records belonging to another employee.');
      }
    }
  }

  /**
   * Validate POS discount threshold
   */
  static validateDiscountThreshold(discountPercent: number, maxCashierDiscount: number = 10): boolean {
    if (discountPercent <= maxCashierDiscount) {
      return true;
    }

    const session = SessionService.getSession();
    if (!session) return false;

    // Check for manager discount override permission
    return (
      session.roleId === 1 ||
      session.roleName === 'Owner' ||
      session.roleName === 'Manager' ||
      session.permissions.includes('POS_APPLY_MANAGER_DISCOUNT') ||
      session.permissions.includes('*')
    );
  }
}
