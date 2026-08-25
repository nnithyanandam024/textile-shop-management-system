export type BiSenderRole = 'user' | 'assistant' | 'system';

export interface BiChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

export interface BiChartData {
  type: 'bar' | 'area' | 'line' | 'pie';
  title: string;
  data: BiChartPoint[];
  xAxisKey: string;
  dataKey: string;
  secondaryKey?: string;
  unitPrefix?: string; // e.g. '₹'
  unitSuffix?: string; // e.g. ' units'
}

export interface BiTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  isMonetary?: boolean;
}

export interface BiTableData {
  title?: string;
  columns: BiTableColumn[];
  rows: Record<string, any>[];
}

export interface BiActionLink {
  label: string;
  route: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface BiMessage {
  id: string;
  conversationId: string;
  role: BiSenderRole;
  content: string;
  chart?: BiChartData;
  table?: BiTableData;
  actions?: BiActionLink[];
  suggestedFollowUps?: string[];
  source?: string;
  sourcesUsed?: string[];
  timestamp: string;
  confidence?: number;
  toolExecuted?: string;
  requiresPermission?: string;
  isError?: boolean;
}

export interface BiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  lastMessageSnippet?: string;
  messageCount: number;
}

export interface BiQueryRequest {
  conversationId?: string;
  message: string;
  language?: 'en' | 'ta';
}

export interface BiQueryResponse {
  conversationId: string;
  message: BiMessage;
}
