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
  tablesCount?: number;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'error';
  databasePath: string;
  backupDirectory: string;
  sizeBytes: number;
  tablesCount: number;
  settingsCount: number;
  lastBackupDate?: string;
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
    healthCheck: () => Promise<HealthCheckResult>;
    seed: () => Promise<{ success: boolean; error?: string }>;
  };
  products: {
    getAll: () => Promise<any[]>;
    create: (product: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  variants: {
    getAll: () => Promise<any[]>;
    getBySku: (sku: string) => Promise<any>;
    getByBarcode: (barcode: string) => Promise<any>;
    create: (variant: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  categories: {
    getAll: () => Promise<any[]>;
  };
  brands: {
    getAll: () => Promise<any[]>;
  };
  customers: {
    getAll: () => Promise<any[]>;
    create: (customer: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  suppliers: {
    getAll: () => Promise<any[]>;
    create: (supplier: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  sales: {
    getAll: () => Promise<any[]>;
    create: (sale: any) => Promise<{ success: boolean; saleId?: number; error?: string }>;
  };
  purchases: {
    getAll: () => Promise<any[]>;
    create: (purchase: any) => Promise<{ success: boolean; purchaseId?: number; error?: string }>;
  };
  stock: {
    getTransactions: () => Promise<any[]>;
  };
  expenses: {
    getAll: () => Promise<any[]>;
    create: (expense: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  settings: {
    getAll: () => Promise<{ success: boolean; data?: Record<string, string>; error?: string }>;
    update: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  };
  backup: {
    create: (customName?: string) => Promise<{ success: boolean; backupPath?: string; error?: string }>;
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
    healthCheck: () => ipcRenderer.invoke('db:health-check'),
    seed: () => ipcRenderer.invoke('db:seed'),
  },
  products: {
    getAll: () => ipcRenderer.invoke('products:get-all'),
    create: (product) => ipcRenderer.invoke('products:create', product),
  },
  variants: {
    getAll: () => ipcRenderer.invoke('variants:get-all'),
    getBySku: (sku) => ipcRenderer.invoke('variants:get-by-sku', sku),
    getByBarcode: (barcode) => ipcRenderer.invoke('variants:get-by-barcode', barcode),
    create: (variant) => ipcRenderer.invoke('variants:create', variant),
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:get-all'),
  },
  brands: {
    getAll: () => ipcRenderer.invoke('brands:get-all'),
  },
  customers: {
    getAll: () => ipcRenderer.invoke('customers:get-all'),
    create: (customer) => ipcRenderer.invoke('customers:create', customer),
  },
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers:get-all'),
    create: (supplier) => ipcRenderer.invoke('suppliers:create', supplier),
  },
  sales: {
    getAll: () => ipcRenderer.invoke('sales:get-all'),
    create: (sale) => ipcRenderer.invoke('sales:create', sale),
  },
  purchases: {
    getAll: () => ipcRenderer.invoke('purchases:get-all'),
    create: (purchase) => ipcRenderer.invoke('purchases:create', purchase),
  },
  stock: {
    getTransactions: () => ipcRenderer.invoke('stock:get-transactions'),
  },
  expenses: {
    getAll: () => ipcRenderer.invoke('expenses:get-all'),
    create: (expense) => ipcRenderer.invoke('expenses:create', expense),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    update: (key, value) => ipcRenderer.invoke('settings:update', { key, value }),
  },
  backup: {
    create: (customName) => ipcRenderer.invoke('backup:create', customName),
  },
};

contextBridge.exposeInMainWorld('api', api);
