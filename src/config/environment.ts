export interface AppEnvironment {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  APP_ENV: 'development' | 'production' | 'test';
  APP_VERSION: string;
  API_TIMEOUT_MS: number;
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const env: AppEnvironment = {
  API_BASE_URL: (typeof window !== 'undefined' && (window as any).env?.API_BASE_URL) ||
    process.env.VITE_API_BASE_URL ||
    (isProduction ? 'https://production-api/api' : 'http://localhost:5000/api'),
  WS_BASE_URL: (typeof window !== 'undefined' && (window as any).env?.WS_BASE_URL) ||
    process.env.VITE_WS_BASE_URL ||
    (isProduction ? 'wss://production-api' : 'ws://localhost:5000'),
  APP_ENV: isTest ? 'test' : isProduction ? 'production' : 'development',
  APP_VERSION: '1.0.0',
  API_TIMEOUT_MS: 15000, // 15 seconds default timeout
};

export default env;
