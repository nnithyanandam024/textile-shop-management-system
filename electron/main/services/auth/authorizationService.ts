import { SessionService } from './sessionService';
import log from '../../logger';

export class AuthorizationService {
  static hasPermission(permissionCode: string): boolean {
    const session = SessionService.getSession();
    if (!session) {
      log.warn(`Authorization check failed: No active session for permission '${permissionCode}'`);
      return false;
    }

    // Owner role (roleId 1) bypasses all permission checks
    if (session.roleId === 1 || session.roleName === 'Owner') {
      return true;
    }

    const allowed = session.permissions.includes(permissionCode);
    if (!allowed) {
      log.warn(`Authorization DENIED: User '${session.username}' (${session.roleName}) lacks permission '${permissionCode}'`);
    }
    return allowed;
  }

  static requirePermission(permissionCode: string) {
    if (!this.hasPermission(permissionCode)) {
      throw new Error(`Access Denied: You do not have permission to perform this action (${permissionCode}).`);
    }
  }
}
