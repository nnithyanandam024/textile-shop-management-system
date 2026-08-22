export interface AppEnvironment {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  APP_ENV: 'development' | 'production' | 'test';
  APP_VERSION: string;
  API_TIMEOUT_MS: number;
}

const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && (window as any).env?.[key]) {
    return (window as any).env[key];
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      return metaEnv[key] || metaEnv[`VITE_${key}`];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key] || (process.env as any)[`VITE_${key}`];
    }
  } catch {}
  return undefined;
};

const metaMode = (import.meta as any)?.env?.MODE;
const processMode = typeof process !== 'undefined' ? (process.env as any)?.NODE_ENV : undefined;
const mode = metaMode || processMode || 'development';

const isProduction = mode === 'production';
const isTest = mode === 'test';

export const env: AppEnvironment = {
  API_BASE_URL: getEnvVar('API_BASE_URL') ||
    getEnvVar('VITE_API_BASE_URL') ||
    (isProduction ? 'https://production-api/api' : 'http://localhost:5000/api'),
  WS_BASE_URL: getEnvVar('WS_BASE_URL') ||
    getEnvVar('VITE_WS_BASE_URL') ||
    (isProduction ? 'wss://production-api' : 'ws://localhost:5000'),
  APP_ENV: isTest ? 'test' : isProduction ? 'production' : 'development',
  APP_VERSION: '1.0.0',
  API_TIMEOUT_MS: 15000, // 15 seconds default timeout
};

export default env;
