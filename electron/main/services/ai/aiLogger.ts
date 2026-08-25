import log from '../../logger';
import { AI_RATE_LIMIT } from './aiConfig';

export interface AiLogEntry {
  id: string;
  userId?: number;
  roleName?: string;
  query: string;
  toolExecuted?: string;
  responseTimeMs: number;
  status: 'SUCCESS' | 'PERMISSION_DENIED' | 'OUT_OF_SCOPE' | 'RATE_LIMITED' | 'ERROR';
  error?: string;
  timestamp: string;
}

export class AiLogger {
  private static inMemoryLogs: AiLogEntry[] = [];
  private static userRequestTimestamps: Map<string, number[]> = new Map();
  private static readonly MAX_LOG_HISTORY = 100;

  /**
   * Evaluates if a request violates rate limiting rules.
   */
  public static checkRateLimit(userKey: string): { allowed: boolean; retryAfterSec?: number } {
    const now = Date.now();
    const windowStart = now - AI_RATE_LIMIT.windowMs;

    let timestamps = this.userRequestTimestamps.get(userKey) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= AI_RATE_LIMIT.maxRequestsPerMinute) {
      const oldestInWindow = timestamps[0];
      const retryAfterSec = Math.ceil((oldestInWindow + AI_RATE_LIMIT.windowMs - now) / 1000);
      return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
    }

    timestamps.push(now);
    this.userRequestTimestamps.set(userKey, timestamps);
    return { allowed: true };
  }

  /**
   * Records an audit log entry for an AI request.
   */
  public static logRequest(entry: Omit<AiLogEntry, 'id' | 'timestamp'>): AiLogEntry {
    const sanitizedQuery = (entry.query || '').trim().slice(0, 300);
    const logItem: AiLogEntry = {
      id: `ai_log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: entry.userId,
      roleName: entry.roleName || 'Guest',
      query: sanitizedQuery,
      toolExecuted: entry.toolExecuted,
      responseTimeMs: entry.responseTimeMs,
      status: entry.status,
      error: entry.error,
      timestamp: new Date().toISOString(),
    };

    this.inMemoryLogs.unshift(logItem);
    if (this.inMemoryLogs.length > this.MAX_LOG_HISTORY) {
      this.inMemoryLogs.pop();
    }

    log.info(`[AI_AUDIT] User:${logItem.userId || 'Anon'} (${logItem.roleName}) Tool:${logItem.toolExecuted || 'None'} Status:${logItem.status} Latency:${logItem.responseTimeMs}ms`);

    return logItem;
  }

  /**
   * Retrieves recent audit logs for administrative overview.
   */
  public static getRecentLogs(limit = 50): AiLogEntry[] {
    return this.inMemoryLogs.slice(0, limit);
  }

  /**
   * Retrieves summary analytics for AI usage.
   */
  public static getUsageStats() {
    const total = this.inMemoryLogs.length;
    const successes = this.inMemoryLogs.filter((l) => l.status === 'SUCCESS').length;
    const avgLatency = total > 0
      ? Math.round(this.inMemoryLogs.reduce((acc, l) => acc + l.responseTimeMs, 0) / total)
      : 0;

    return {
      totalRequests: total,
      successfulRequests: successes,
      averageLatencyMs: avgLatency,
      rateLimitRule: `${AI_RATE_LIMIT.maxRequestsPerMinute} reqs/min`,
    };
  }
}
