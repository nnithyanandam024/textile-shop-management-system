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
    createStaffLogin: (staffId: number, input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    update: (id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (targetUserId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  };
  roles: {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    getAllPermissions: () => Promise<any[]>;
    getRolePermissions: (roleId: number) => Promise<string[]>;
    create: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    update: (id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
  attendance: {
    getSettings: () => Promise<any>;
    updateSettings: (input: any) => Promise<{ success: boolean; error?: string }>;
    checkIn: (staffId: number, time?: string) => Promise<{ success: boolean; error?: string }>;
    checkOut: (staffId: number, time?: string) => Promise<{ success: boolean; error?: string }>;
    getDaily: (date: string, filters?: any) => Promise<{ kpis: any; list: any[] }>;
    getStaffMonthly: (staffId: number, year: number, month: number) => Promise<any>;
    markManual: (input: any) => Promise<{ success: boolean; error?: string }>;
    requestCorrection: (attendanceId: number, input: any) => Promise<{ success: boolean; error?: string }>;
    approveCorrection: (correctionId: number, approve: boolean) => Promise<{ success: boolean; error?: string }>;
    getPendingCorrections: () => Promise<any[]>;
  };
  shifts: {
    getTemplates: (includeInactive?: boolean) => Promise<any[]>;
    getTemplateById: (id: number) => Promise<any>;
    createTemplate: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateTemplate: (id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    deactivateTemplate: (id: number) => Promise<{ success: boolean; error?: string }>;
    assignStaff: (input: any) => Promise<{ success: boolean; error?: string }>;
    getStaffHistory: (staffId: number) => Promise<any[]>;
    getSchedule: (staffId: number, dateStr?: string) => Promise<any[]>;
    setSchedule: (staffId: number, scheduleDays: any[]) => Promise<{ success: boolean; error?: string }>;
    createOverride: (input: any) => Promise<{ success: boolean; error?: string }>;
    deleteOverride: (id: number) => Promise<{ success: boolean; error?: string }>;
    getOverrides: (startDate: string, endDate: string) => Promise<any[]>;
    resolveDate: (staffId: number, dateStr: string) => Promise<any>;
  };
  leave: {
    getTypes: (includeInactive?: boolean) => Promise<any[]>;
    createType: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateType: (id: number, input: any) => Promise<{ success: boolean; error?: string }>;
    getBalances: (staffId: number, year?: number) => Promise<any[]>;
    adjustBalance: (input: any) => Promise<{ success: boolean; error?: string }>;
    getRequests: (filters?: any) => Promise<any[]>;
    apply: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    approve: (requestId: number) => Promise<{ success: boolean; error?: string }>;
    reject: (requestId: number, rejectionReason: string) => Promise<{ success: boolean; error?: string }>;
    cancel: (requestId: number) => Promise<{ success: boolean; error?: string }>;
    getHolidays: (includeInactive?: boolean) => Promise<any[]>;
    createHoliday: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    deleteHoliday: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
  payroll: {
    getPeriods: () => Promise<any[]>;
    getPeriodById: (id: number) => Promise<any>;
    createPeriod: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    calculatePeriod: (periodId: number) => Promise<{ success: boolean; recordCount?: number; error?: string }>;
    approvePeriod: (periodId: number) => Promise<{ success: boolean; error?: string }>;
    lockPeriod: (periodId: number) => Promise<{ success: boolean; error?: string }>;
    getRecords: (periodId: number) => Promise<any[]>;
    getRecordById: (recordId: number) => Promise<any>;
    getStaffHistory: (staffId: number) => Promise<any[]>;
  };
  salary: {
    getStructure: (staffId: number, dateStr?: string) => Promise<any>;
    assignStructure: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getHistory: (staffId: number) => Promise<any[]>;
  };
  advance: {
    getAll: (filters?: any) => Promise<any[]>;
    issue: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
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
    getEmergencyContacts: (staffId: number) => Promise<any[]>;
    saveEmergencyContact: (token: string, input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    deleteEmergencyContact: (token: string, id: number) => Promise<{ success: boolean; error?: string }>;
    getBankDetails: (staffId: number, revealFull?: boolean) => Promise<any>;
    saveBankDetails: (token: string, input: any) => Promise<{ success: boolean; error?: string }>;
    getDocuments: (staffId: number) => Promise<any[]>;
    uploadDocument: (token: string, input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    verifyDocument: (token: string, id: number, status: string) => Promise<{ success: boolean; error?: string }>;
    deleteDocument: (token: string, id: number) => Promise<{ success: boolean; error?: string }>;
    getNotes: (staffId: number) => Promise<any[]>;
    addNote: (token: string, input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    deleteNote: (token: string, id: number) => Promise<{ success: boolean; error?: string }>;
    getHistory: (staffId: number) => Promise<any[]>;
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
    createStaffLogin: (staffId, input) => ipcRenderer.invoke('users:create-staff-login', { staffId, input }),
    update: (id, input) => ipcRenderer.invoke('users:update', { id, input }),
    resetPassword: (targetUserId, newPassword) => ipcRenderer.invoke('users:reset-password', { targetUserId, newPassword }),
  },
  roles: {
    getAll: () => ipcRenderer.invoke('roles:get-all'),
    getById: (id) => ipcRenderer.invoke('roles:get-by-id', id),
    getAllPermissions: () => ipcRenderer.invoke('roles:get-all-permissions'),
    getRolePermissions: (roleId) => ipcRenderer.invoke('roles:get-role-permissions', roleId),
    create: (input) => ipcRenderer.invoke('roles:create', input),
    update: (id, input) => ipcRenderer.invoke('roles:update', { id, input }),
    delete: (id) => ipcRenderer.invoke('roles:delete', id),
  },
  attendance: {
    getSettings: () => ipcRenderer.invoke('attendance:get-settings'),
    updateSettings: (input) => ipcRenderer.invoke('attendance:update-settings', input),
    checkIn: (staffId, time) => ipcRenderer.invoke('attendance:check-in', { staffId, time }),
    checkOut: (staffId, time) => ipcRenderer.invoke('attendance:check-out', { staffId, time }),
    getDaily: (date, filters) => ipcRenderer.invoke('attendance:get-daily', { date, filters }),
    getStaffMonthly: (staffId, year, month) => ipcRenderer.invoke('attendance:get-staff-monthly', { staffId, year, month }),
    markManual: (input) => ipcRenderer.invoke('attendance:mark-manual', input),
    requestCorrection: (attendanceId, input) => ipcRenderer.invoke('attendance:request-correction', { attendanceId, input }),
    approveCorrection: (correctionId, approve) => ipcRenderer.invoke('attendance:approve-correction', { correctionId, approve }),
    getPendingCorrections: () => ipcRenderer.invoke('attendance:get-pending-corrections'),
  },
  shifts: {
    getTemplates: (includeInactive) => ipcRenderer.invoke('shift:get-templates', includeInactive),
    getTemplateById: (id) => ipcRenderer.invoke('shift:get-template-by-id', id),
    createTemplate: (input) => ipcRenderer.invoke('shift:create-template', input),
    updateTemplate: (id, input) => ipcRenderer.invoke('shift:update-template', { id, input }),
    deactivateTemplate: (id) => ipcRenderer.invoke('shift:deactivate-template', id),
    assignStaff: (input) => ipcRenderer.invoke('shift:assign-staff', input),
    getStaffHistory: (staffId) => ipcRenderer.invoke('shift:get-staff-history', staffId),
    getSchedule: (staffId, dateStr) => ipcRenderer.invoke('shift:get-schedule', { staffId, dateStr }),
    setSchedule: (staffId, scheduleDays) => ipcRenderer.invoke('shift:set-schedule', { staffId, scheduleDays }),
    createOverride: (input) => ipcRenderer.invoke('shift:create-override', input),
    deleteOverride: (id) => ipcRenderer.invoke('shift:delete-override', id),
    getOverrides: (startDate, endDate) => ipcRenderer.invoke('shift:get-overrides', { startDate, endDate }),
    resolveDate: (staffId, dateStr) => ipcRenderer.invoke('shift:resolve-date', { staffId, dateStr }),
  },
  leave: {
    getTypes: (includeInactive) => ipcRenderer.invoke('leave:get-types', includeInactive),
    createType: (input) => ipcRenderer.invoke('leave:create-type', input),
    updateType: (id, input) => ipcRenderer.invoke('leave:update-type', { id, input }),
    getBalances: (staffId, year) => ipcRenderer.invoke('leave:get-balances', { staffId, year }),
    adjustBalance: (input) => ipcRenderer.invoke('leave:adjust-balance', input),
    getRequests: (filters) => ipcRenderer.invoke('leave:get-requests', filters),
    apply: (input) => ipcRenderer.invoke('leave:apply', input),
    approve: (requestId) => ipcRenderer.invoke('leave:approve', requestId),
    reject: (requestId, rejectionReason) => ipcRenderer.invoke('leave:reject', { requestId, rejectionReason }),
    cancel: (requestId) => ipcRenderer.invoke('leave:cancel', requestId),
    getHolidays: (includeInactive) => ipcRenderer.invoke('leave:get-holidays', includeInactive),
    createHoliday: (input) => ipcRenderer.invoke('leave:create-holiday', input),
    deleteHoliday: (id) => ipcRenderer.invoke('leave:delete-holiday', id),
  },
  payroll: {
    getPeriods: () => ipcRenderer.invoke('payroll:get-periods'),
    getPeriodById: (id) => ipcRenderer.invoke('payroll:get-period-by-id', id),
    createPeriod: (input) => ipcRenderer.invoke('payroll:create-period', input),
    calculatePeriod: (periodId) => ipcRenderer.invoke('payroll:calculate-period', periodId),
    approvePeriod: (periodId) => ipcRenderer.invoke('payroll:approve-period', periodId),
    lockPeriod: (periodId) => ipcRenderer.invoke('payroll:lock-period', periodId),
    getRecords: (periodId) => ipcRenderer.invoke('payroll:get-records', periodId),
    getRecordById: (recordId) => ipcRenderer.invoke('payroll:get-record-by-id', recordId),
    getStaffHistory: (staffId) => ipcRenderer.invoke('payroll:get-staff-history', staffId),
  },
  salary: {
    getStructure: (staffId, dateStr) => ipcRenderer.invoke('salary:get-structure', { staffId, dateStr }),
    assignStructure: (input) => ipcRenderer.invoke('salary:assign-structure', input),
    getHistory: (staffId) => ipcRenderer.invoke('salary:get-history', staffId),
  },
  advance: {
    getAll: (filters) => ipcRenderer.invoke('advance:get-all', filters),
    issue: (input) => ipcRenderer.invoke('advance:issue', input),
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
    getEmergencyContacts: (staffId) => ipcRenderer.invoke('staff:emergency:getAll', staffId),
    saveEmergencyContact: (token, input) => ipcRenderer.invoke('staff:emergency:save', token, input),
    deleteEmergencyContact: (token, id) => ipcRenderer.invoke('staff:emergency:delete', token, id),
    getBankDetails: (staffId, revealFull) => ipcRenderer.invoke('staff:bank:get', staffId, revealFull),
    saveBankDetails: (token, input) => ipcRenderer.invoke('staff:bank:save', token, input),
    getDocuments: (staffId) => ipcRenderer.invoke('staff:document:getAll', staffId),
    uploadDocument: (token, input) => ipcRenderer.invoke('staff:document:upload', token, input),
    verifyDocument: (token, id, status) => ipcRenderer.invoke('staff:document:verify', token, id, status),
    deleteDocument: (token, id) => ipcRenderer.invoke('staff:document:delete', token, id),
    getNotes: (staffId) => ipcRenderer.invoke('staff:notes:getAll', staffId),
    addNote: (token, input) => ipcRenderer.invoke('staff:notes:add', token, input),
    deleteNote: (token, id) => ipcRenderer.invoke('staff:notes:delete', token, id),
    getHistory: (staffId) => ipcRenderer.invoke('staff:history:getAll', staffId),
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
