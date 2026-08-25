export interface AiRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AiChatRequest {
  message: string;
  context?: {
    currentRoute?: string;
    recentMessages?: AiRequestMessage[];
  };
  userId?: number;
  roleId?: number;
  roleName?: string;
}

export interface AiStructuredData {
  type: 'sales_summary' | 'inventory_summary' | 'low_stock' | 'top_products' | 'customer_summary' | 'attendance_summary' | 'leave_summary' | 'daily_business_report' | 'permission_denied' | 'out_of_scope' | 'general_answer';
  title?: string;
  metrics?: Record<string, string | number>;
  items?: any[];
  aiInsight?: string;
  raw?: any;
}

export interface AiChatResponse {
  answer: string;
  data?: AiStructuredData;
  source: string;
  sourcesUsed: string[];
  generatedAt: string;
  confidence: number;
  toolExecuted?: string;
  requiresPermission?: string;
  isError?: boolean;
}

export interface AiQuickPrompt {
  id: string;
  label: string;
  prompt: string;
  category: 'sales' | 'inventory' | 'customers' | 'reports' | 'staff';
  requiredPermission?: string;
  allowedRoles?: string[];
}

export const AI_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequestsPerMinute: 30,
};

export const AI_SYSTEM_PROMPT = `You are the Texora AI Business Assistant, an expert retail intelligence assistant designed specifically for textile showrooms, saree houses, and garment retailers.
Your responsibilities:
1. Answer business questions accurately using ONLY the authorized tool data provided by the backend.
2. Never invent, guess, or hallucinate financial numbers or stock quantities.
3. If data is unavailable or empty, state clearly that no records were found for that period.
4. Format financial numbers with Indian Rupee (₹) symbols and comma separators (e.g. ₹84,250).
5. Always respect user role permissions. Never attempt to bypass data access restrictions.
6. Provide concise, clear, and actionable retail insights.`;
