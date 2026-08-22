import env from '../config/environment';
import { ApiError } from '../utils/apiError';
import { StorageManager } from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    status?: number;
    details?: any[];
  };
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  idempotencyKey?: string;
  params?: Record<string, any>;
}

type AuthInvalidHandler = () => void;

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private inFlightRequests: Map<string, Promise<any>>;
  private authInvalidCallbacks: Set<AuthInvalidHandler>;

  constructor() {
    this.baseURL = env.API_BASE_URL;
    this.defaultTimeout = env.API_TIMEOUT_MS;
    this.inFlightRequests = new Map();
    this.authInvalidCallbacks = new Set();
  }

  public setBaseURL(url: string): void {
    this.baseURL = url;
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  public onAuthInvalid(callback: AuthInvalidHandler): () => void {
    this.authInvalidCallbacks.add(callback);
    return () => this.authInvalidCallbacks.delete(callback);
  }

  private triggerAuthInvalid(): void {
    StorageManager.clearSession();
    this.authInvalidCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error executing auth invalid callback:', err);
      }
    });
  }

  private sanitizeLogPayload(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const clone = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = ['password', 'currentPassword', 'newPassword', 'password_hash', 'token', 'cardNumber', 'cvv'];

    for (const key of Object.keys(clone)) {
      if (sensitiveKeys.some((s) => s.toLowerCase() === key.toLowerCase())) {
        clone[key] = '******';
      } else if (typeof clone[key] === 'object') {
        clone[key] = this.sanitizeLogPayload(clone[key]);
      }
    }
    return clone;
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    let fullUrl = path.startsWith('http') ? path : `${this.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }
    return fullUrl;
  }

  private getRequestDeduplicationKey(method: string, path: string, body?: any): string {
    return `${method}:${path}:${body ? JSON.stringify(body) : ''}`;
  }

  /**
   * Primary Request Dispatcher
   */
  public async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || this.defaultTimeout;
    const dedupeKey = method !== 'GET' ? this.getRequestDeduplicationKey(method, path, body) : null;

    // 1. In-flight duplicate request protection for mutations
    if (dedupeKey && this.inFlightRequests.has(dedupeKey)) {
      if (env.APP_ENV === 'development') {
        console.warn(`[API] In-flight request duplicate prevented for: ${method} ${path}`);
      }
      return this.inFlightRequests.get(dedupeKey)!;
    }

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const url = this.buildUrl(path, options.params);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Request-Id': options.idempotencyKey || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          ...(options.headers as Record<string, string>),
        };

        if (!options.skipAuth) {
          const token = StorageManager.getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
          ...options,
        };

        if (body && method !== 'GET') {
          fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        if (env.APP_ENV === 'development') {
          const sanitizedBody = body ? this.sanitizeLogPayload(body) : undefined;
          console.log(`[API] ${method} ${path} -> ${response.status} (${duration}ms)`, sanitizedBody || '');
        }

        let json: any = null;
        try {
          const text = await response.text();
          json = text ? JSON.parse(text) : {};
        } catch {
          json = {};
        }

        // Handle standard HTTP error codes
        if (!response.ok) {
          if (response.status === 401) {
            this.triggerAuthInvalid();
            throw ApiError.fromStatus(401, json?.error?.message || json?.message || 'Session expired.');
          }

          if (response.status === 403) {
            throw ApiError.fromStatus(403, json?.error?.message || json?.message || 'Access denied.');
          }

          throw ApiError.fromStatus(
            response.status,
            json?.error?.message || json?.message || `HTTP request failed with status ${response.status}`,
            json?.error?.details || json?.details
          );
        }

        // Return standardized successful response
        return {
          success: true,
          data: json.data !== undefined ? json.data : json,
          message: json.message || 'Operation successful',
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        let apiError: ApiError;
        if (err?.name === 'AbortError') {
          apiError = ApiError.timeoutError(timeoutMs);
        } else if (err instanceof ApiError) {
          apiError = err;
        } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
          apiError = ApiError.networkError();
        } else {
          apiError = ApiError.fromError(err);
        }

        if (env.APP_ENV === 'development') {
          console.error(`[API Error] ${method} ${path} -> [${apiError.code}] ${apiError.message} (${duration}ms)`);
        }

        return {
          success: false,
          error: {
            code: apiError.code,
            message: apiError.message,
            status: apiError.status,
            details: apiError.details,
          },
        };
      } finally {
        if (dedupeKey) {
          this.inFlightRequests.delete(dedupeKey);
        }
      }
    };

    const promise = executeRequest();
    if (dedupeKey) {
      this.inFlightRequests.set(dedupeKey, promise);
    }
    return promise;
  }

  // Convenience Methods
  public get<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  public post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  public put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  public patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  public delete<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
