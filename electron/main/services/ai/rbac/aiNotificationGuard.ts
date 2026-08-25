import { AI_PERMISSIONS, hasDefaultAiPermission } from './aiPermissions';
import log from '../../../logger';

export interface AiAlertEvent {
  id: string;
  type: 'ANOMALY_RISK' | 'STOCKOUT_CRITICAL' | 'SALES_MILESTONE' | 'SYSTEM_SECURITY';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiredPermission: string;
  timestamp: string;
}

export class AiNotificationGuard {
  /**
   * Evaluates if a given user should receive the AI notification event
   */
  public static shouldDeliverToUser(event: AiAlertEvent, user: { roleName?: string; permissions?: string[] }): boolean {
    const role = (user.roleName || 'Cashier').toLowerCase().trim();
    if (role === 'owner' || role === 'admin' || role === 'super_admin') {
      return true;
    }

    const userPerms = user.permissions || [];
    const hasExplicitPerm =
      userPerms.includes(event.requiredPermission) ||
      userPerms.includes(AI_PERMISSIONS.ALERTS_RECEIVE);

    const hasDefaultPerm =
      hasDefaultAiPermission(role, event.requiredPermission as any) ||
      hasDefaultAiPermission(role, AI_PERMISSIONS.ALERTS_RECEIVE);

    return hasExplicitPerm || hasDefaultPerm;
  }

  /**
   * Filters a recipient user list for targeted AI alert dispatching
   */
  public static filterRecipients(event: AiAlertEvent, allUsers: Array<{ id: number; roleName?: string; permissions?: string[] }>): number[] {
    const authorizedUserIds = allUsers
      .filter((u) => this.shouldDeliverToUser(event, u))
      .map((u) => u.id);

    log.info(`[AiNotificationGuard] Event ${event.id} (${event.type}) routed to ${authorizedUserIds.length} authorized recipients.`);
    return authorizedUserIds;
  }
}
