import { contextBridge, ipcRenderer } from 'electron';

export interface SystemInfo {
  appName: string;
  version: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
  platform: string;
  arch: string;
  totalMemMB: number;
  freeMemMB: number;
  dbPath: string;
  backupPath: string;
}

export interface DbStatus {
  status: 'online' | 'error';
  path?: string;
  settingsCount?: number;
  error?: string;
}

export interface SettingsResponse {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}

export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getSystemInfo: () => Promise<SystemInfo>;
    log: (level: 'info' | 'warn' | 'error', message: string, details?: any) => Promise<boolean>;
  };
  db: {
    checkStatus: () => Promise<DbStatus>;
  };
  settings: {
    getAll: () => Promise<SettingsResponse>;
    update: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  };
}

const api: ElectronAPI = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getSystemInfo: () => ipcRenderer.invoke('app:get-system-info'),
    log: (level, message, details) => ipcRenderer.invoke('app:log', { level, message, details }),
  },
  db: {
    checkStatus: () => ipcRenderer.invoke('db:check-status'),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    update: (key, value) => ipcRenderer.invoke('settings:update', { key, value }),
  },
};

contextBridge.exposeInMainWorld('api', api);
