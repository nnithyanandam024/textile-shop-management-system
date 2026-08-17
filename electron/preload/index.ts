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

export interface AuthUser {
  userId: number;
  username: string;
  displayName: string;
  roleId: number;
  roleName: string;
  permissions: string[];
}

export interface InventoryMetrics {
  totalVariants: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
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
  auth: {
    checkSetup: () => Promise<{ setupRequired: boolean }>;
    firstTimeSetup: (input: any) => Promise<{ success: boolean; error?: string }>;
    login: (username: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
    logout: () => Promise<{ success: boolean }>;
    getCurrentUser: () => Promise<AuthUser | null>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  };
  users: {
    getAll: () => Promise<any[]>;
    create: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    update: (id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (targetUserId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  };
  products: {
    getAll: () => Promise<any[]>;
    create: (product: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    createWithVariants: (input: any) => Promise<{ success: boolean; productId?: number; error?: string }>;
    deactivate: (productId: number) => Promise<{ success: boolean; error?: string }>;
  };
  variants: {
    getAll: () => Promise<any[]>;
    getBySku: (sku: string) => Promise<any>;
    getByBarcode: (barcode: string) => Promise<any>;
    create: (variant: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  inventory: {
    getMetrics: () => Promise<InventoryMetrics>;
    getLowStock: () => Promise<any[]>;
    getOutOfStock: () => Promise<any[]>;
    getHistory: (variantId?: number) => Promise<any[]>;
    adjust: (input: any) => Promise<{ success: boolean; newStock?: number; error?: string }>;
  };
  categories: {
    getAll: () => Promise<any[]>;
    create: (category: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  brands: {
    getAll: () => Promise<any[]>;
    create: (brand: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  customers: {
    getAll: () => Promise<any[]>;
    getProfile: (id: number) => Promise<{ success: boolean; customer?: any; purchases?: any[]; error?: string }>;
    create: (customer: any) => Promise<{ success: boolean; id?: number; code?: string; error?: string }>;
    receivePayment: (input: { customerId: number; amount: number; paymentMethod: string }) => Promise<{ success: boolean; error?: string }>;
  };
  suppliers: {
    getAll: () => Promise<any[]>;
    getProfile: (id: number) => Promise<{ success: boolean; supplier?: any; purchases?: any[]; error?: string }>;
    create: (supplier: any) => Promise<{ success: boolean; id?: number; code?: string; error?: string }>;
    makePayment: (input: { supplierId: number; amount: number; paymentMethod: string }) => Promise<{ success: boolean; error?: string }>;
  };
  sales: {
    getAll: () => Promise<any[]>;
    getDetails: (saleId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    create: (sale: any) => Promise<{ success: boolean; saleId?: number; invoiceNumber?: string; error?: string }>;
    cancel: (saleId: number) => Promise<{ success: boolean; error?: string }>;
  };
  purchases: {
    getAll: () => Promise<any[]>;
    create: (purchase: any) => Promise<{ success: boolean; purchaseId?: number; purchaseNumber?: string; error?: string }>;
    cancel: (purchaseId: number) => Promise<{ success: boolean; error?: string }>;
  };
  dashboard: {
    getKPIs: (startDate?: string, endDate?: string) => Promise<any>;
    getSalesTrend: (days?: number) => Promise<any[]>;
    getBestSellers: (limit?: number) => Promise<any[]>;
    getLowStockAlerts: (limit?: number) => Promise<any[]>;
    getRecentTransactions: (limit?: number) => Promise<any[]>;
  };
  reports: {
    getSales: (filter?: any) => Promise<any>;
    getInventory: () => Promise<any>;
    getFinancial: (filter?: any) => Promise<any>;
    getCustomers: () => Promise<any[]>;
    getSuppliers: () => Promise<any[]>;
    exportCSV: (data: any[], headers: { key: string; label: string }[]) => Promise<string>;
  };
  returns: {
    getAll: () => Promise<any[]>;
    create: (input: any) => Promise<{ success: boolean; returnId?: number; returnNumber?: string; refundAmount?: number; error?: string }>;
  };
  exchanges: {
    create: (input: any) => Promise<{ success: boolean; exchangeNumber?: string; differenceAmount?: number; error?: string }>;
  };
  expenses: {
    getAll: () => Promise<any[]>;
    create: (expense: any) => Promise<{ success: boolean; id?: number; expenseNumber?: string; error?: string }>;
    cancel: (expenseId: number) => Promise<{ success: boolean; error?: string }>;
  };
  backup: {
    create: (customName?: string) => Promise<{ success: boolean; backupPath?: string; sha256?: string; error?: string }>;
    list: () => Promise<any[]>;
    verify: (filename: string) => Promise<{ valid: boolean; error?: string }>;
    export: (filename: string, targetDir: string) => Promise<{ success: boolean; error?: string }>;
    delete: (filename: string) => Promise<{ success: boolean; error?: string }>;
    restore: (filename: string) => Promise<{ success: boolean; error?: string }>;
  };
  system: {
    getHealth: () => Promise<any>;
    checkIntegrity: () => Promise<{ healthy: boolean; foreignKeysOk: boolean; error?: string }>;
  };
  settings: {
    getAll: () => Promise<{ success: boolean; data?: Record<string, string>; error?: string }>;
    update: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  };
  staff: {
    getAll: (params?: any) => Promise<{ staff: any[]; total: number }>;
    getById: (id: number) => Promise<any>;
    create: (token: string, input: any) => Promise<{ success: boolean; id?: number; staff_code?: string; error?: string }>;
    update: (token: string, id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    deactivate: (token: string, id: number) => Promise<{ success: boolean; error?: string }>;
  };
  department: {
    getAll: (includeInactive?: boolean) => Promise<any[]>;
    create: (token: string, input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    update: (token: string, id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    deactivate: (token: string, id: number) => Promise<{ success: boolean; activeStaffCount?: number; error?: string }>;
  };
  designation: {
    getAll: (departmentId?: number, includeInactive?: boolean) => Promise<any[]>;
    create: (token: string, input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    update: (token: string, id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    deactivate: (token: string, id: number) => Promise<{ success: boolean; activeStaffCount?: number; error?: string }>;
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
  auth: {
    checkSetup: () => ipcRenderer.invoke('auth:check-setup'),
    firstTimeSetup: (input) => ipcRenderer.invoke('auth:first-time-setup', input),
    login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:get-current-user'),
    changePassword: (currentPassword, newPassword) => ipcRenderer.invoke('auth:change-password', { currentPassword, newPassword }),
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:get-all'),
    create: (input) => ipcRenderer.invoke('users:create', input),
    update: (id, input) => ipcRenderer.invoke('users:update', { id, input }),
    resetPassword: (targetUserId, newPassword) => ipcRenderer.invoke('users:reset-password', { targetUserId, newPassword }),
  },
  products: {
    getAll: () => ipcRenderer.invoke('products:get-all'),
    create: (product) => ipcRenderer.invoke('products:create', product),
    createWithVariants: (input) => ipcRenderer.invoke('products:create-with-variants', input),
    deactivate: (productId) => ipcRenderer.invoke('products:deactivate', productId),
  },
  variants: {
    getAll: () => ipcRenderer.invoke('variants:get-all'),
    getBySku: (sku) => ipcRenderer.invoke('variants:get-by-sku', sku),
    getByBarcode: (barcode) => ipcRenderer.invoke('variants:get-by-barcode', barcode),
    create: (variant) => ipcRenderer.invoke('variants:create', variant),
  },
  inventory: {
    getMetrics: () => ipcRenderer.invoke('inventory:get-metrics'),
    getLowStock: () => ipcRenderer.invoke('inventory:get-low-stock'),
    getOutOfStock: () => ipcRenderer.invoke('inventory:get-out-of-stock'),
    getHistory: (variantId) => ipcRenderer.invoke('inventory:get-history', variantId),
    adjust: (input) => ipcRenderer.invoke('inventory:adjust', input),
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:get-all'),
    create: (category) => ipcRenderer.invoke('categories:create', category),
  },
  brands: {
    getAll: () => ipcRenderer.invoke('brands:get-all'),
    create: (brand) => ipcRenderer.invoke('brands:create', brand),
  },
  customers: {
    getAll: () => ipcRenderer.invoke('customers:get-all'),
    getProfile: (id) => ipcRenderer.invoke('customers:get-profile', id),
    create: (customer) => ipcRenderer.invoke('customers:create', customer),
    receivePayment: (input) => ipcRenderer.invoke('customers:receive-payment', input),
  },
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers:get-all'),
    getProfile: (id) => ipcRenderer.invoke('suppliers:get-profile', id),
    create: (supplier) => ipcRenderer.invoke('suppliers:create', supplier),
    makePayment: (input) => ipcRenderer.invoke('suppliers:make-payment', input),
  },
  sales: {
    getAll: () => ipcRenderer.invoke('sales:get-all'),
    getDetails: (saleId) => ipcRenderer.invoke('sales:get-details', saleId),
    create: (sale) => ipcRenderer.invoke('sales:create', sale),
    cancel: (saleId) => ipcRenderer.invoke('sales:cancel', saleId),
  },
  purchases: {
    getAll: () => ipcRenderer.invoke('purchases:get-all'),
    create: (purchase) => ipcRenderer.invoke('purchases:create', purchase),
    cancel: (purchaseId) => ipcRenderer.invoke('purchases:cancel', purchaseId),
  },
  dashboard: {
    getKPIs: (startDate, endDate) => ipcRenderer.invoke('dashboard:get-kpis', startDate, endDate),
    getSalesTrend: (days) => ipcRenderer.invoke('dashboard:get-sales-trend', days),
    getBestSellers: (limit) => ipcRenderer.invoke('dashboard:get-bestsellers', limit),
    getLowStockAlerts: (limit) => ipcRenderer.invoke('dashboard:get-low-stock-alerts', limit),
    getRecentTransactions: (limit) => ipcRenderer.invoke('dashboard:get-recent-transactions', limit),
  },
  reports: {
    getSales: (filter) => ipcRenderer.invoke('reports:get-sales', filter),
    getInventory: () => ipcRenderer.invoke('reports:get-inventory'),
    getFinancial: (filter) => ipcRenderer.invoke('reports:get-financial', filter),
    getCustomers: () => ipcRenderer.invoke('reports:get-customers'),
    getSuppliers: () => ipcRenderer.invoke('reports:get-suppliers'),
    exportCSV: (data, headers) => ipcRenderer.invoke('reports:export-csv', { data, headers }),
  },
  returns: {
    getAll: () => ipcRenderer.invoke('returns:get-all'),
    create: (input) => ipcRenderer.invoke('returns:create', input),
  },
  exchanges: {
    create: (input) => ipcRenderer.invoke('exchanges:create', input),
  },
  expenses: {
    getAll: () => ipcRenderer.invoke('expenses:get-all'),
    create: (expense) => ipcRenderer.invoke('expenses:create', expense),
    cancel: (expenseId) => ipcRenderer.invoke('expenses:cancel', expenseId),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    update: (key, value) => ipcRenderer.invoke('settings:update', { key, value }),
  },
  backup: {
    create: (customName) => ipcRenderer.invoke('backup:create', customName),
    list: () => ipcRenderer.invoke('backup:list'),
    verify: (filename) => ipcRenderer.invoke('backup:verify', filename),
    export: (filename, targetDir) => ipcRenderer.invoke('backup:export', { filename, targetDir }),
    delete: (filename) => ipcRenderer.invoke('backup:delete', filename),
    restore: (filename) => ipcRenderer.invoke('backup:restore', filename),
  },
  system: {
    getHealth: () => ipcRenderer.invoke('system:get-health'),
    checkIntegrity: () => ipcRenderer.invoke('system:check-integrity'),
  },
  staff: {
    getAll: (params) => ipcRenderer.invoke('staff:getAll', params),
    getById: (id) => ipcRenderer.invoke('staff:getById', id),
    create: (token, input) => ipcRenderer.invoke('staff:create', token, input),
    update: (token, id, input) => ipcRenderer.invoke('staff:update', token, id, input),
    deactivate: (token, id) => ipcRenderer.invoke('staff:deactivate', token, id),
  },
  department: {
    getAll: (includeInactive) => ipcRenderer.invoke('department:getAll', includeInactive),
    create: (token, input) => ipcRenderer.invoke('department:create', token, input),
    update: (token, id, input) => ipcRenderer.invoke('department:update', token, id, input),
    deactivate: (token, id) => ipcRenderer.invoke('department:deactivate', token, id),
  },
  designation: {
    getAll: (departmentId, includeInactive) => ipcRenderer.invoke('designation:getAll', departmentId, includeInactive),
    create: (token, input) => ipcRenderer.invoke('designation:create', token, input),
    update: (token, id, input) => ipcRenderer.invoke('designation:update', token, id, input),
    deactivate: (token, id) => ipcRenderer.invoke('designation:deactivate', token, id),
  },
};

contextBridge.exposeInMainWorld('api', api);
