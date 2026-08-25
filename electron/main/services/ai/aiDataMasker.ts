import { UserAuthContext } from './aiRbacGuard';

export class AiDataMasker {
  private static SENSITIVE_FIELDS = new Set([
    'cost_price',
    'purchase_price',
    'purchase_rate',
    'supplier_cost',
    'profit_margin',
    'margin_percent',
    'gross_profit',
    'net_profit',
    'salary',
    'basic_salary',
    'payable_amount',
    'supplier_payable',
  ]);

  /**
   * Sanitizes payload data by stripping or redacting sensitive financial fields for non-admin/manager roles.
   */
  public static maskPayload<T>(data: T, user?: UserAuthContext): T {
    if (!user) return data;

    const roleName = (user.roleName || '').toLowerCase();
    const permissions = user.permissions || [];

    // Owner / Super Admin / Financial authorized users see unmasked data
    if (
      roleName === 'owner' ||
      roleName === 'super_admin' ||
      user.roleId === 1 ||
      permissions.includes('*') ||
      permissions.includes('financials.view')
    ) {
      return data;
    }

    return this.deepSanitize(data);
  }

  private static deepSanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (this.SENSITIVE_FIELDS.has(key.toLowerCase())) {
          // Omit sensitive financial keys entirely for non-manager callers
          continue;
        }
        sanitized[key] = this.deepSanitize(value);
      }
      return sanitized;
    }

    return obj;
  }
}
