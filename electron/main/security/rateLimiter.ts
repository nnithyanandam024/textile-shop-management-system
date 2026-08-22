/**
 * Phase 17 — In-Memory Sliding-Window Rate Limiter & Brute-Force Defense
 * Protects authentication endpoints, password resets, and PIN verifications.
 */

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: number; // timestamp in ms
  retryAfterSeconds?: number;
  message?: string;
}

interface AttemptRecord {
  attempts: number[];
  lockedUntil?: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private records: Map<string, AttemptRecord> = new Map();

  private maxAttempts: number = 5;
  private windowMs: number = 15 * 60 * 1000; // 15 minutes window
  private lockDurationMs: number = 15 * 60 * 1000; // 15 minutes lockout

  constructor(maxAttempts: number = 5, lockDurationMinutes: number = 15, windowMinutes: number = 15) {
    this.maxAttempts = maxAttempts;
    this.lockDurationMs = lockDurationMinutes * 60 * 1000;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if action is currently permitted for key
   */
  public check(key: string): RateLimitStatus {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      return {
        allowed: true,
        remainingAttempts: this.maxAttempts,
      };
    }

    // Check active lockout
    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
        retryAfterSeconds,
        message: `Too many failed attempts. Account temporarily locked for security. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
      };
    }

    // Filter attempts strictly within sliding window
    record.attempts = record.attempts.filter((timestamp) => now - timestamp < this.windowMs);
    const count = record.attempts.length;

    if (count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockDurationMs;
      const retryAfterSeconds = Math.ceil(this.lockDurationMs / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
        retryAfterSeconds,
        message: `Too many failed attempts. Account temporarily locked for security. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - count,
    };
  }

  /**
   * Record a failed attempt
   */
  public recordFailure(key: string): RateLimitStatus {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { attempts: [] };
      this.records.set(key, record);
    }

    record.attempts = record.attempts.filter((timestamp) => now - timestamp < this.windowMs);
    record.attempts.push(now);

    if (record.attempts.length >= this.maxAttempts) {
      record.lockedUntil = now + this.lockDurationMs;
    }

    return this.check(key);
  }

  /**
   * Reset attempts on successful action/login
   */
  public reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Clear all records (testing/cleanup)
   */
  public clear(): void {
    this.records.clear();
  }
}

export const authRateLimiter = RateLimiter.getInstance();
