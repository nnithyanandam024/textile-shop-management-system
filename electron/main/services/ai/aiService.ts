import { AiChatRequest, AiChatResponse, AiQuickPrompt } from './aiConfig';
import { AiRbacGuard, UserAuthContext, AiToolName } from './aiRbacGuard';
import { AiTools } from './aiTools';
import { AiValidator } from './aiValidator';
import { AiLogger } from './aiLogger';
import log from '../../logger';

export class AiService {
  /**
   * Main entry point for processing AI chat prompts.
   */
  public static async processChat(request: AiChatRequest, userContext?: UserAuthContext): Promise<AiChatResponse> {
    const startTime = Date.now();
    const query = (request.message || '').trim();
    const userKey = `${userContext?.userId || 'anon'}_${userContext?.roleName || 'guest'}`;

    log.info(`[AiService] Received query="${query}" from User=${userKey}`);

    // 1. Rate Limiting Check
    const rateCheck = AiLogger.checkRateLimit(userKey);
    if (!rateCheck.allowed) {
      const resp: AiChatResponse = {
        answer: `⏳ **Rate Limit Reached**\n\nYou have made multiple requests in a short time. Please wait **${rateCheck.retryAfterSec || 30} seconds** before asking another question.`,
        source: 'Texora AI Rate Limiter',
        sourcesUsed: ['Traffic Protection Policy'],
        generatedAt: new Date().toISOString(),
        confidence: 1.0,
        isError: true,
      };

      AiLogger.logRequest({
        userId: userContext?.userId,
        roleName: userContext?.roleName,
        query,
        responseTimeMs: Date.now() - startTime,
        status: 'RATE_LIMITED',
        error: 'Too many requests in 1 minute window',
      });

      return resp;
    }

    // 2. Intent Identification
    const intent = this.identifyIntent(query);

    // If intent requires payroll/salary check
    if (intent.tool === 'getStaffPayrollSummary') {
      const rbac = AiRbacGuard.canExecuteTool('getStaffPayrollSummary', userContext);
      if (!rbac.allowed) {
        const resp = AiValidator.formatPermissionDenied(rbac.reason);
        AiLogger.logRequest({
          userId: userContext?.userId,
          roleName: userContext?.roleName,
          query,
          toolExecuted: 'getStaffPayrollSummary',
          responseTimeMs: Date.now() - startTime,
          status: 'PERMISSION_DENIED',
          error: rbac.reason,
        });
        return resp;
      }
      // If allowed, fallback to payroll summary
      const resp: AiChatResponse = {
        answer: 'Staff payroll records and salary disbursements are processed through the monthly HR Ledger.',
        source: 'Staff Payroll Ledger',
        sourcesUsed: ['Payroll Database'],
        generatedAt: new Date().toISOString(),
        confidence: 1.0,
        toolExecuted: 'getStaffPayrollSummary',
      };
      AiLogger.logRequest({
        userId: userContext?.userId,
        roleName: userContext?.roleName,
        query,
        toolExecuted: 'getStaffPayrollSummary',
        responseTimeMs: Date.now() - startTime,
        status: 'SUCCESS',
      });
      return resp;
    }

    // If query is Out of Scope or unsupported in Phase 1
    if (!intent.tool) {
      const resp = AiValidator.formatOutOfScopeResponse(query);
      AiLogger.logRequest({
        userId: userContext?.userId,
        roleName: userContext?.roleName,
        query,
        responseTimeMs: Date.now() - startTime,
        status: 'OUT_OF_SCOPE',
      });
      return resp;
    }

    // 3. RBAC Permission Validation before executing tool
    const rbacCheck = AiRbacGuard.canExecuteTool(intent.tool, userContext);
    if (!rbacCheck.allowed) {
      const resp = AiValidator.formatPermissionDenied(rbacCheck.reason);
      AiLogger.logRequest({
        userId: userContext?.userId,
        roleName: userContext?.roleName,
        query,
        toolExecuted: intent.tool,
        responseTimeMs: Date.now() - startTime,
        status: 'PERMISSION_DENIED',
        error: rbacCheck.reason,
      });
      return resp;
    }

    // 4. Authorized Tool Execution with error boundary
    try {
      let result: AiChatResponse;

      switch (intent.tool) {
        case 'getSalesSummary': {
          const timeframe = intent.params?.timeframe || 'today';
          const data = await AiTools.getSalesSummary(timeframe);
          result = AiValidator.formatSalesResponse(data);
          break;
        }
        case 'getTopSellingProducts': {
          const limit = intent.params?.limit || 5;
          const data = await AiTools.getTopSellingProducts(limit);
          result = AiValidator.formatTopProductsResponse(data);
          break;
        }
        case 'getLowStockProducts': {
          const data = await AiTools.getLowStockProducts();
          result = AiValidator.formatLowStockResponse(data);
          break;
        }
        case 'getInventorySummary': {
          const data = await AiTools.getInventorySummary();
          result = AiValidator.formatInventorySummaryResponse(data);
          break;
        }
        case 'getCustomerSummary': {
          const data = await AiTools.getCustomerSummary();
          result = AiValidator.formatCustomerResponse(data);
          break;
        }
        case 'getAttendanceSummary': {
          const data = await AiTools.getAttendanceSummary();
          result = AiValidator.formatAttendanceResponse(data);
          break;
        }
        case 'getLeaveSummary': {
          const data = await AiTools.getLeaveSummary();
          result = {
            answer: `### 🌴 Staff Leave Applications\n\n• **Pending Approvals:** **${data.pendingApprovalCount} requests**\n\n` +
              data.pendingRequests.map((r: any) => `• **${r.staffName}** — ${r.leaveType} (${r.dates})\n  *Reason: ${r.reason}*`).join('\n'),
            source: 'Staff Leave Ledger',
            sourcesUsed: ['Leave Applications', 'Department Manager Queue'],
            generatedAt: new Date().toISOString(),
            confidence: 1.0,
            toolExecuted: 'getLeaveSummary',
          };
          break;
        }
        case 'getDailyReport': {
          const data = await AiTools.getDailyReport();
          result = AiValidator.formatDailyBusinessReport(data);
          break;
        }
        default:
          result = AiValidator.formatOutOfScopeResponse(query);
      }

      AiLogger.logRequest({
        userId: userContext?.userId,
        roleName: userContext?.roleName,
        query,
        toolExecuted: intent.tool,
        responseTimeMs: Date.now() - startTime,
        status: 'SUCCESS',
      });

      return result;
    } catch (err: any) {
      log.error(`[AiService] Error executing tool ${intent.tool}:`, err);

      const fallback: AiChatResponse = {
        answer: '⚠️ **AI Assistant is temporarily unable to retrieve this data.** Your normal shop operations, billing, and inventory continue to work normally.',
        source: 'Error Handler',
        sourcesUsed: [],
        generatedAt: new Date().toISOString(),
        confidence: 0,
        isError: true,
      };

      AiLogger.logRequest({
        userId: userContext?.userId,
        roleName: userContext?.roleName,
        query,
        toolExecuted: intent.tool,
        responseTimeMs: Date.now() - startTime,
        status: 'ERROR',
        error: err.message,
      });

      return fallback;
    }
  }

  /**
   * Identifies user query intent using natural language semantic rules.
   */
  private static identifyIntent(query: string): { tool?: AiToolName; params?: any } {
    const q = query.toLowerCase().trim();

    // 1. Business Report / Executive Summary
    if (
      q.includes('business summary') ||
      q.includes('daily summary') ||
      q.includes('daily report') ||
      q.includes('store overview') ||
      q.includes('shop overview') ||
      q.includes('overall summary') ||
      q.includes('executive summary')
    ) {
      return { tool: 'getDailyReport' };
    }

    // 2. Sensitive Payroll / Salary queries (to trigger RBAC interception)
    if (
      q.includes('salary') ||
      q.includes('salaries') ||
      q.includes('payroll') ||
      q.includes('wage') ||
      q.includes('compensation')
    ) {
      return { tool: 'getStaffPayrollSummary' };
    }

    // 3. Sales Queries
    if (q.includes('yesterday')) {
      return { tool: 'getSalesSummary', params: { timeframe: 'yesterday' } };
    }
    if (q.includes('week') || q.includes('7 days')) {
      return { tool: 'getSalesSummary', params: { timeframe: 'week' } };
    }
    if (q.includes('month') || q.includes('30 days')) {
      return { tool: 'getSalesSummary', params: { timeframe: 'month' } };
    }
    if (
      q.includes('sale') ||
      q.includes('sold') ||
      q.includes('revenue') ||
      q.includes('turnover') ||
      q.includes('collection') ||
      q.includes('bills') ||
      q.includes('transactions')
    ) {
      return { tool: 'getSalesSummary', params: { timeframe: 'today' } };
    }

    // 4. Top Selling Products
    if (
      q.includes('top selling') ||
      q.includes('top product') ||
      q.includes('best seller') ||
      q.includes('fast moving') ||
      q.includes('popular') ||
      q.includes('most sold') ||
      q.includes('top category')
    ) {
      return { tool: 'getTopSellingProducts', params: { limit: 5 } };
    }

    // 5. Low Stock & Out of Stock Queries
    if (
      q.includes('low stock') ||
      q.includes('out of stock') ||
      q.includes('reorder') ||
      q.includes('shortage') ||
      q.includes('empty stock') ||
      q.includes('stock alert')
    ) {
      return { tool: 'getLowStockProducts' };
    }

    // 6. Master Inventory Summary
    if (
      q.includes('inventory') ||
      q.includes('total stock') ||
      q.includes('stock valuation') ||
      q.includes('stock value') ||
      q.includes('warehouse') ||
      q.includes('how many products') ||
      q.includes('how many items')
    ) {
      return { tool: 'getInventorySummary' };
    }

    // 7. Customers & Loyalty
    if (
      q.includes('customer') ||
      q.includes('client') ||
      q.includes('patron') ||
      q.includes('loyalty') ||
      q.includes('buyer') ||
      q.includes('footfall')
    ) {
      return { tool: 'getCustomerSummary' };
    }

    // 8. Attendance
    if (
      q.includes('attendance') ||
      q.includes('present') ||
      q.includes('on duty') ||
      q.includes('who is working') ||
      q.includes('staff on floor') ||
      q.includes('late')
    ) {
      return { tool: 'getAttendanceSummary' };
    }

    // 9. Leaves
    if (
      q.includes('leave') ||
      q.includes('holiday') ||
      q.includes('vacation') ||
      q.includes('absent')
    ) {
      return { tool: 'getLeaveSummary' };
    }

    return {};
  }

  /**
   * Returns role-customized quick question chips.
   */
  public static getQuickPrompts(userContext?: UserAuthContext): AiQuickPrompt[] {
    const role = (userContext?.roleName || 'Cashier').toLowerCase();

    const allPrompts: AiQuickPrompt[] = [
      {
        id: 'sales_today',
        label: '📊 Sales Today',
        prompt: 'How much did we sell today?',
        category: 'sales',
        requiredPermission: 'sales.view',
      },
      {
        id: 'top_sellers',
        label: '🏆 Top Selling Items',
        prompt: 'What are today’s top-selling products?',
        category: 'sales',
        requiredPermission: 'sales.view',
      },
      {
        id: 'low_stock',
        label: '🚨 Low Stock Alerts',
        prompt: 'Which products are low or out of stock?',
        category: 'inventory',
        requiredPermission: 'inventory.view',
      },
      {
        id: 'business_summary',
        label: '📈 Business Summary',
        prompt: 'Give me today’s executive business summary.',
        category: 'reports',
        requiredPermission: 'reports.view',
      },
      {
        id: 'inventory_overview',
        label: '📦 Inventory Overview',
        prompt: 'What is our total stock and inventory valuation?',
        category: 'inventory',
        requiredPermission: 'inventory.view',
      },
      {
        id: 'top_customers',
        label: '👥 Customer Insights',
        prompt: 'How many customers purchased today and who are the top patrons?',
        category: 'customers',
        requiredPermission: 'customers.view',
      },
      {
        id: 'attendance_check',
        label: '⏱️ Staff on Duty',
        prompt: 'How many staff members are present on duty today?',
        category: 'staff',
        requiredPermission: 'attendance.view',
      },
    ];

    return allPrompts.filter((p) => {
      if (!p.requiredPermission) return true;
      if (role === 'owner' || role === 'super_admin' || userContext?.permissions?.includes('*')) return true;
      return userContext?.permissions?.includes(p.requiredPermission);
    });
  }
}
