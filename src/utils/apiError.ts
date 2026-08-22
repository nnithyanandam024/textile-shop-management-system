export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'TOO_MANY_REQUESTS'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    status?: number;
    details?: ApiErrorDetail[];
  };
}

export class ApiError extends Error {
  public status: number;
  public code: ApiErrorCode;
  public details?: ApiErrorDetail[];
  public isNetworkError: boolean;
  public isTimeout: boolean;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: ApiErrorCode;
      details?: ApiErrorDetail[];
      isNetworkError?: boolean;
      isTimeout?: boolean;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status || 500;
    this.code = options?.code || ApiError.mapStatusToCode(this.status);
    this.details = options?.details;
    this.isNetworkError = options?.isNetworkError || false;
    this.isTimeout = options?.isTimeout || false;

    // Restore prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public static mapStatusToCode(status: number): ApiErrorCode {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'SERVER_ERROR';
      default:
        return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
    }
  }

  public static fromStatus(status: number, message?: string, details?: ApiErrorDetail[]): ApiError {
    const defaultMessages: Record<number, string> = {
      400: 'Bad Request. Please verify your input parameters.',
      401: 'Authentication required. Your session has expired or is invalid.',
      403: 'Access Denied. You do not have sufficient permissions.',
      404: 'The requested resource was not found.',
      409: 'Conflict. The resource has been modified or already exists.',
      422: 'Validation error. Please verify the submitted data.',
      429: 'Too many requests. Please slow down.',
      500: 'Internal server error occurred.',
    };

    return new ApiError(message || defaultMessages[status] || 'An unexpected API error occurred.', {
      status,
      code: ApiError.mapStatusToCode(status),
      details,
    });
  }

  public static networkError(message: string = 'Unable to connect to server. Please check your network connection.'): ApiError {
    return new ApiError(message, {
      status: 0,
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }

  public static timeoutError(timeoutMs: number): ApiError {
    return new ApiError(`Request timed out after ${timeoutMs}ms. Please try again.`, {
      status: 408,
      code: 'TIMEOUT',
      isTimeout: true,
    });
  }

  public static fromError(err: any): ApiError {
    if (err instanceof ApiError) return err;
    if (err?.name === 'AbortError') return ApiError.timeoutError(15000);
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
      return ApiError.networkError();
    }
    return new ApiError(err?.message || 'An unknown error occurred.', {
      status: err?.status || 500,
      code: err?.code || 'UNKNOWN_ERROR',
    });
  }

  public toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        details: this.details,
      },
    };
  }
}
