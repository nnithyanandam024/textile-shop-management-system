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
  staffAuth: {
    login: (input: { employeeId: string; password: string; rememberMe?: boolean }) => Promise<{ success: boolean; user?: any; error?: string }>;
    logout: () => Promise<{ success: boolean }>;
    getCurrentStaffUser: () => Promise<any | null>;
  };
  staffDashboard: {
    getDashboardSummary: () => Promise<{ success: boolean; data?: any; error?: string }>;
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
  performance: {
    getCycles: () => Promise<any[]>;
    createCycle: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getGoals: (filters?: any) => Promise<any[]>;
    createGoal: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateGoal: (input: { goalId: number; currentValue: number; status?: string }) => Promise<{ success: boolean; error?: string }>;
    getKPIs: () => Promise<any[]>;
    createKPI: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    assignKPIs: (input: { staffId: number; cycleId: number; kpis: any[] }) => Promise<{ success: boolean; error?: string }>;
    getReviews: (filters?: any) => Promise<any[]>;
    getReviewById: (id: number) => Promise<any>;
    submitSelfReview: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    submitManagerReview: (input: any) => Promise<{ success: boolean; id?: number; overall_score?: number; rating?: string; error?: string }>;
    getAppraisals: (filters?: any) => Promise<any[]>;
    submitAppraisal: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    approveAppraisal: (appraisalId: number) => Promise<{ success: boolean; error?: string }>;
    getHistory: (staffId: number) => Promise<any[]>;
  };
  documents: {
    getCategories: () => Promise<any[]>;
    getAll: (filters?: any) => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    upload: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    readBase64: (documentId: number) => Promise<{ success: boolean; base64?: string; mimeType?: string; error?: string }>;
    verify: (documentId: number) => Promise<{ success: boolean; error?: string }>;
    reject: (input: { documentId: number; reason: string }) => Promise<{ success: boolean; error?: string }>;
    replace: (input: { documentId: number; fileName: string; buffer: Buffer; reason?: string }) => Promise<{ success: boolean; error?: string }>;
    getExpiring: (thresholdDays?: number) => Promise<any[]>;
    getCompliance: (staffId: number) => Promise<{ totalRequired: number; completedCount: number; complianceScore: number; missingCategories: string[] }>;
  };
  communication: {
    getMyNotifications: (filters?: any) => Promise<any[]>;
    getUnreadCount: () => Promise<number>;
    markRead: (id: number) => Promise<{ success: boolean }>;
    markAllRead: () => Promise<{ success: boolean }>;
    getAnnouncements: () => Promise<any[]>;
    createAnnouncement: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getMyMessages: () => Promise<any[]>;
    sendMessage: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  };
  selfService: {
    getDashboard: () => Promise<any>;
    getProfile: () => Promise<any>;
    updateProfile: (fields: any) => Promise<{ success: boolean; error?: string }>;
    requestProfileChange: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getProfileChangeRequests: () => Promise<any[]>;
    getAttendance: (month?: string, year?: number) => Promise<any[]>;
    requestAttendanceCorrection: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getLeave: () => Promise<{ balances: any[]; requests: any[] }>;
    applyLeave: (input: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    cancelLeave: (leaveRequestId: number) => Promise<{ success: boolean; error?: string }>;
    getPayroll: () => Promise<any[]>;
    getDocuments: () => Promise<{ documents: any[]; compliance: any }>;
    getPerformance: () => Promise<{ scorecards: any[]; goals: any[] }>;
  };
  staffProfile: {
    getMyProfile: () => Promise<{ success: boolean; data?: any; error?: string }>;
    updateMyProfile: (fields: any) => Promise<{ success: boolean; message?: string; error?: string }>;
    getEmergencyContacts: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    saveEmergencyContact: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    deleteEmergencyContact: (id: number) => Promise<{ success: boolean; message?: string; error?: string }>;
    uploadPhoto: (dataUrl: string) => Promise<{ success: boolean; photoPath?: string; message?: string; error?: string }>;
    removePhoto: () => Promise<{ success: boolean; message?: string; error?: string }>;
    changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    getActivity: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    requestChange: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getChangeRequests: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  };
  staffAttendance: {
    getToday: () => Promise<{ success: boolean; data?: any; error?: string }>;
    checkIn: (customTime?: string) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
    checkOut: (customTime?: string) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
    startBreak: (customTime?: string) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
    endBreak: (customTime?: string) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
    getHistory: (filter?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getMonthlySummary: (monthStr?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getByDate: (dateStr: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    requestCorrection: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getCorrectionRequests: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  };
  staffShifts: {
    getToday: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getWeekly: (weekStartDate?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getMonthly: (monthStr?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getUpcoming: (count?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getDetails: (dateStr: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getHistory: (filter?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    requestChange: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    requestSwap: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getRequests: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    cancelRequest: (id: number, type: 'CHANGE' | 'SWAP') => Promise<{ success: boolean; message?: string; error?: string }>;
    getSwapCandidates: (dateStr: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getTemplates: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  };
  staffLeave: {
    getBalances: (year?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getTypes: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    apply: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getRequests: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getDetails: (requestId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    cancel: (requestId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
    getCalendar: (monthStr?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getHistory: (year?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    requestPermission: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getPermissions: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    cancelPermission: (id: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  };
  staffPayroll: {
    getCurrent: (periodId?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    getPeriods: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getDetails: (recordId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    getSalaryOverview: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getSalaryHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getOvertime: (monthStr?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getIncentives: (periodName?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  };
  staffInventory: {
    searchProducts: (query?: string, filters?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getProduct: (variantId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    getLowStock: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getTasks: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    submitCount: (input: any) => Promise<{ success: boolean; id?: number; difference?: number; message?: string; error?: string }>;
    createTransfer: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getTransfers: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getPoReceiving: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    submitReceiving: (input: any) => Promise<{ success: boolean; id?: number; message?: string; error?: string }>;
    getHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getMetrics: () => Promise<{ success: boolean; data?: any; error?: string }>;
  };
  staffPOS: {
    searchProducts: (query?: string, categoryId?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getByBarcode: (barcode: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getCustomers: (query?: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    quickCustomer: (input: any) => Promise<{ success: boolean; customer?: any; error?: string }>;
    customerHistory: (customerId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    calculateTotals: (input: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    completeSale: (input: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    holdSale: (input: any) => Promise<{ success: boolean; heldId?: number; message?: string; error?: string }>;
    getHeldSales: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    resumeSale: (heldId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    cancelHeldSale: (heldId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
    getMySales: (filters?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getInvoice: (saleId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    createReturn: (input: any) => Promise<{ success: boolean; returnId?: number; returnNumber?: string; refundAmount?: number; message?: string; error?: string }>;
  };
  staffCustomer: {
    search: (query?: string, filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getDetails: (customerId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    create: (input: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    update: (customerId: number, input: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    purchases: (customerId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    returns: (customerId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    loyalty: (customerId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    adjustLoyalty: (customerId: number, points: number, type: any, description: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    addNote: (customerId: number, note: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getNotes: (customerId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    updatePreferences: (customerId: number, preferences: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  };
  staffReports: {
    sales: (staffId?: number, filters?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    attendance: (staffId?: number, monthYear?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    commission: (staffId?: number, period?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    inventoryTasks: (staffId?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  };
  staffSettings: {
    getPreferences: (staffId?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    updatePreferences: (staffId: number, preferences: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getPrinters: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    testPrint: (printerName: string, printerType: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    updatePassword: (userId: number, oldPass: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    getVersion: () => Promise<{ success: boolean; data?: any; error?: string }>;
  };
  staffNotificationCenter: {
    getAll: (staffId?: number, filters?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    markRead: (notificationId: number, staffId?: number) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    markAllRead: (staffId?: number) => Promise<{ success: boolean; data?: boolean; error?: string }>;
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
    calculate: (input: any) => Promise<any>;
    checkout: (request: any) => Promise<{ success: boolean; saleId?: number; invoiceNumber?: string; grandTotal?: number; error?: string }>;
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
    seedEnterpriseData: () => Promise<{ success: boolean; message?: string; error?: string }>;
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
  realtime: {
    onEvent: (callback: (event: any) => void) => () => void;
    publishEvent: (event: any) => Promise<{ success: boolean; error?: string }>;
  };
  ai: {
    chat: (request: any, userContext?: any) => Promise<any>;
    getQuickPrompts: (userContext?: any) => Promise<any[]>;
    getLogs: (limit?: number) => Promise<any[]>;
    getStats: () => Promise<any>;
    getSalesInsights: (timeframe?: string, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getDailySummary: (dateStr?: string, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getInventoryIntelligence: (userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getProductForecast: (variantId: number, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getDeadStock: (userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getCartRecommendations: (request: any, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getCustomerIntelligence: (customerId: number, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getProductRecommendations: (productId: number, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    trackRecommendationFeedback: (event: any) => Promise<{ success: boolean }>;
    getAnomalies: (filter?: any, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getAnomalyDetails: (anomalyId: string, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    reviewAnomaly: (request: any, userContext?: any) => Promise<{ success: boolean; anomaly?: any; error?: string }>;
    getRiskSummary: (userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getSmartReport: (period: string, dateStr?: string, userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getReportHistory: (userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    biQuery: (request: any, userContext?: any) => Promise<{ conversationId: string; message: any }>;
    getBiConversations: (userContext?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getBiConversationMessages: (conversationId: string, userContext?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    clearBiConversation: (conversationId: string, userContext?: any) => Promise<{ success: boolean }>;
    getDashboardConfig: (userContext?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
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
  staffAuth: {
    login: (input) => ipcRenderer.invoke('staff-auth:login', input),
    logout: () => ipcRenderer.invoke('staff-auth:logout'),
    getCurrentStaffUser: () => ipcRenderer.invoke('staff-auth:get-current-user'),
  },
  staffDashboard: {
    getDashboardSummary: () => ipcRenderer.invoke('staff-dashboard:get-summary'),
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
  performance: {
    getCycles: () => ipcRenderer.invoke('performance:get-cycles'),
    createCycle: (input) => ipcRenderer.invoke('performance:create-cycle', input),
    getGoals: (filters) => ipcRenderer.invoke('performance:get-goals', filters),
    createGoal: (input) => ipcRenderer.invoke('performance:create-goal', input),
    updateGoal: (input) => ipcRenderer.invoke('performance:update-goal', input),
    getKPIs: () => ipcRenderer.invoke('performance:get-kpis'),
    createKPI: (input) => ipcRenderer.invoke('performance:create-kpi', input),
    assignKPIs: (input) => ipcRenderer.invoke('performance:assign-kpis', input),
    getReviews: (filters) => ipcRenderer.invoke('performance:get-reviews', filters),
    getReviewById: (id) => ipcRenderer.invoke('performance:get-review-by-id', id),
    submitSelfReview: (input) => ipcRenderer.invoke('performance:submit-self-review', input),
    submitManagerReview: (input) => ipcRenderer.invoke('performance:submit-manager-review', input),
    getAppraisals: (filters) => ipcRenderer.invoke('performance:get-appraisals', filters),
    submitAppraisal: (input) => ipcRenderer.invoke('performance:submit-appraisal', input),
    approveAppraisal: (appraisalId) => ipcRenderer.invoke('performance:approve-appraisal', appraisalId),
    getHistory: (staffId) => ipcRenderer.invoke('performance:get-history', staffId),
  },
  documents: {
    getCategories: () => ipcRenderer.invoke('documents:get-categories'),
    getAll: (filters) => ipcRenderer.invoke('documents:get-all', filters),
    getById: (id) => ipcRenderer.invoke('documents:get-by-id', id),
    upload: (input) => ipcRenderer.invoke('documents:upload', input),
    readBase64: (documentId) => ipcRenderer.invoke('documents:read-base64', documentId),
    verify: (documentId) => ipcRenderer.invoke('documents:verify', documentId),
    reject: (input) => ipcRenderer.invoke('documents:reject', input),
    replace: (input) => ipcRenderer.invoke('documents:replace', input),
    getExpiring: (thresholdDays) => ipcRenderer.invoke('documents:get-expiring', thresholdDays),
    getCompliance: (staffId) => ipcRenderer.invoke('documents:get-compliance', staffId),
  },
  communication: {
    getMyNotifications: (filters) => ipcRenderer.invoke('notifications:get-my', filters),
    getUnreadCount: () => ipcRenderer.invoke('notifications:get-unread-count'),
    markRead: (id) => ipcRenderer.invoke('notifications:mark-read', id),
    markAllRead: () => ipcRenderer.invoke('notifications:mark-all-read'),
    getAnnouncements: () => ipcRenderer.invoke('announcements:get-all'),
    createAnnouncement: (input) => ipcRenderer.invoke('announcements:create', input),
    getMyMessages: () => ipcRenderer.invoke('messages:get-my'),
    sendMessage: (input) => ipcRenderer.invoke('messages:send', input),
  },
  selfService: {
    getDashboard: () => ipcRenderer.invoke('self-service:get-dashboard'),
    getProfile: () => ipcRenderer.invoke('self-service:get-profile'),
    updateProfile: (fields) => ipcRenderer.invoke('self-service:update-profile', fields),
    requestProfileChange: (input) => ipcRenderer.invoke('self-service:request-profile-change', input),
    getProfileChangeRequests: () => ipcRenderer.invoke('self-service:get-profile-change-requests'),
    getAttendance: (month, year) => ipcRenderer.invoke('self-service:get-attendance', month, year),
    requestAttendanceCorrection: (input) => ipcRenderer.invoke('self-service:request-attendance-correction', input),
    getLeave: () => ipcRenderer.invoke('self-service:get-leave'),
    applyLeave: (input) => ipcRenderer.invoke('self-service:apply-leave', input),
    cancelLeave: (leaveRequestId) => ipcRenderer.invoke('self-service:cancel-leave', leaveRequestId),
    getPayroll: () => ipcRenderer.invoke('self-service:get-payroll'),
    getDocuments: () => ipcRenderer.invoke('self-service:get-documents'),
    getPerformance: () => ipcRenderer.invoke('self-service:get-performance'),
  },
  staffProfile: {
    getMyProfile: () => ipcRenderer.invoke('staff-profile:get-my-profile'),
    updateMyProfile: (fields) => ipcRenderer.invoke('staff-profile:update-my-profile', fields),
    getEmergencyContacts: () => ipcRenderer.invoke('staff-profile:get-emergency-contacts'),
    saveEmergencyContact: (input) => ipcRenderer.invoke('staff-profile:save-emergency-contact', input),
    deleteEmergencyContact: (id) => ipcRenderer.invoke('staff-profile:delete-emergency-contact', id),
    uploadPhoto: (dataUrl) => ipcRenderer.invoke('staff-profile:upload-photo', dataUrl),
    removePhoto: () => ipcRenderer.invoke('staff-profile:remove-photo'),
    changePassword: (input) => ipcRenderer.invoke('staff-profile:change-password', input),
    getActivity: () => ipcRenderer.invoke('staff-profile:get-activity'),
    requestChange: (input) => ipcRenderer.invoke('staff-profile:request-change', input),
    getChangeRequests: () => ipcRenderer.invoke('staff-profile:get-change-requests'),
  },
  staffAttendance: {
    getToday: () => ipcRenderer.invoke('staff-attendance:get-today'),
    checkIn: (customTime) => ipcRenderer.invoke('staff-attendance:check-in', customTime),
    checkOut: (customTime) => ipcRenderer.invoke('staff-attendance:check-out', customTime),
    startBreak: (customTime) => ipcRenderer.invoke('staff-attendance:start-break', customTime),
    endBreak: (customTime) => ipcRenderer.invoke('staff-attendance:end-break', customTime),
    getHistory: (filter) => ipcRenderer.invoke('staff-attendance:get-history', filter),
    getMonthlySummary: (monthStr) => ipcRenderer.invoke('staff-attendance:get-monthly-summary', monthStr),
    getByDate: (dateStr) => ipcRenderer.invoke('staff-attendance:get-by-date', dateStr),
    requestCorrection: (input) => ipcRenderer.invoke('staff-attendance:request-correction', input),
    getCorrectionRequests: () => ipcRenderer.invoke('staff-attendance:get-correction-requests'),
  },
  staffShifts: {
    getToday: () => ipcRenderer.invoke('staff-shifts:get-today'),
    getWeekly: (weekStartDate) => ipcRenderer.invoke('staff-shifts:get-weekly', weekStartDate),
    getMonthly: (monthStr) => ipcRenderer.invoke('staff-shifts:get-monthly', monthStr),
    getUpcoming: (count) => ipcRenderer.invoke('staff-shifts:get-upcoming', count),
    getDetails: (dateStr) => ipcRenderer.invoke('staff-shifts:get-details', dateStr),
    getHistory: (filter) => ipcRenderer.invoke('staff-shifts:get-history', filter),
    requestChange: (input) => ipcRenderer.invoke('staff-shifts:request-change', input),
    requestSwap: (input) => ipcRenderer.invoke('staff-shifts:request-swap', input),
    getRequests: () => ipcRenderer.invoke('staff-shifts:get-requests'),
    cancelRequest: (id, type) => ipcRenderer.invoke('staff-shifts:cancel-request', id, type),
    getSwapCandidates: (dateStr) => ipcRenderer.invoke('staff-shifts:get-swap-candidates', dateStr),
    getTemplates: () => ipcRenderer.invoke('staff-shifts:get-templates'),
  },
  staffLeave: {
    getBalances: (year) => ipcRenderer.invoke('staff-leave:get-balances', year),
    getTypes: () => ipcRenderer.invoke('staff-leave:get-types'),
    apply: (input) => ipcRenderer.invoke('staff-leave:apply', input),
    getRequests: (filters) => ipcRenderer.invoke('staff-leave:get-requests', filters),
    getDetails: (requestId) => ipcRenderer.invoke('staff-leave:get-details', requestId),
    cancel: (requestId) => ipcRenderer.invoke('staff-leave:cancel', requestId),
    getCalendar: (monthStr) => ipcRenderer.invoke('staff-leave:get-calendar', monthStr),
    getHistory: (year) => ipcRenderer.invoke('staff-leave:get-history', year),
    requestPermission: (input) => ipcRenderer.invoke('staff-leave:request-permission', input),
    getPermissions: () => ipcRenderer.invoke('staff-leave:get-permissions'),
    cancelPermission: (id) => ipcRenderer.invoke('staff-leave:cancel-permission', id),
  },
  staffPayroll: {
    getCurrent: (periodId) => ipcRenderer.invoke('staff-payroll:get-current', periodId),
    getPeriods: () => ipcRenderer.invoke('staff-payroll:get-periods'),
    getHistory: () => ipcRenderer.invoke('staff-payroll:get-history'),
    getDetails: (recordId) => ipcRenderer.invoke('staff-payroll:get-details', recordId),
    getSalaryOverview: () => ipcRenderer.invoke('staff-payroll:get-salary-overview'),
    getSalaryHistory: () => ipcRenderer.invoke('staff-payroll:get-salary-history'),
    getOvertime: (monthStr) => ipcRenderer.invoke('staff-payroll:get-overtime', monthStr),
    getIncentives: (periodName) => ipcRenderer.invoke('staff-payroll:get-incentives', periodName),
  },
  staffInventory: {
    searchProducts: (query, filters) => ipcRenderer.invoke('staff-inventory:search-products', query, filters),
    getProduct: (variantId) => ipcRenderer.invoke('staff-inventory:get-product', variantId),
    getLowStock: () => ipcRenderer.invoke('staff-inventory:get-low-stock'),
    getTasks: () => ipcRenderer.invoke('staff-inventory:get-tasks'),
    submitCount: (input) => ipcRenderer.invoke('staff-inventory:submit-count', input),
    createTransfer: (input) => ipcRenderer.invoke('staff-inventory:create-transfer', input),
    getTransfers: () => ipcRenderer.invoke('staff-inventory:get-transfers'),
    getPoReceiving: () => ipcRenderer.invoke('staff-inventory:get-po-receiving'),
    submitReceiving: (input) => ipcRenderer.invoke('staff-inventory:submit-receiving', input),
    getHistory: () => ipcRenderer.invoke('staff-inventory:get-history'),
    getMetrics: () => ipcRenderer.invoke('staff-inventory:get-metrics'),
  },
  staffPOS: {
    searchProducts: (query, categoryId) => ipcRenderer.invoke('staff-pos:search-products', query, categoryId),
    getByBarcode: (barcode) => ipcRenderer.invoke('staff-pos:get-by-barcode', barcode),
    getCustomers: (query) => ipcRenderer.invoke('staff-pos:get-customers', query),
    quickCustomer: (input) => ipcRenderer.invoke('staff-pos:quick-customer', input),
    customerHistory: (customerId) => ipcRenderer.invoke('staff-pos:customer-history', customerId),
    calculateTotals: (input) => ipcRenderer.invoke('staff-pos:calculate-totals', input),
    completeSale: (input) => ipcRenderer.invoke('staff-pos:complete-sale', input),
    holdSale: (input) => ipcRenderer.invoke('staff-pos:hold-sale', input),
    getHeldSales: () => ipcRenderer.invoke('staff-pos:get-held-sales'),
    resumeSale: (heldId) => ipcRenderer.invoke('staff-pos:resume-sale', heldId),
    cancelHeldSale: (heldId) => ipcRenderer.invoke('staff-pos:cancel-held-sale', heldId),
    getMySales: (filters) => ipcRenderer.invoke('staff-pos:get-my-sales', filters),
    getInvoice: (saleId) => ipcRenderer.invoke('staff-pos:get-invoice', saleId),
    createReturn: (input) => ipcRenderer.invoke('staff-pos:create-return', input),
  },
  staffCustomer: {
    search: (query, filters) => ipcRenderer.invoke('staff-customer:search', query, filters),
    getDetails: (customerId) => ipcRenderer.invoke('staff-customer:get-details', customerId),
    create: (input) => ipcRenderer.invoke('staff-customer:create', input),
    update: (customerId, input) => ipcRenderer.invoke('staff-customer:update', customerId, input),
    purchases: (customerId) => ipcRenderer.invoke('staff-customer:purchases', customerId),
    returns: (customerId) => ipcRenderer.invoke('staff-customer:returns', customerId),
    loyalty: (customerId) => ipcRenderer.invoke('staff-customer:loyalty', customerId),
    adjustLoyalty: (customerId, points, type, description) => ipcRenderer.invoke('staff-customer:adjust-loyalty', customerId, points, type, description),
    addNote: (customerId, note) => ipcRenderer.invoke('staff-customer:add-note', customerId, note),
    getNotes: (customerId) => ipcRenderer.invoke('staff-customer:get-notes', customerId),
    updatePreferences: (customerId, preferences) => ipcRenderer.invoke('staff-customer:update-preferences', customerId, preferences),
  },
  staffReports: {
    sales: (staffId, filters) => ipcRenderer.invoke('staff-reports:sales', staffId, filters),
    attendance: (staffId, monthYear) => ipcRenderer.invoke('staff-reports:attendance', staffId, monthYear),
    commission: (staffId, period) => ipcRenderer.invoke('staff-reports:commission', staffId, period),
    inventoryTasks: (staffId) => ipcRenderer.invoke('staff-reports:inventory-tasks', staffId),
  },
  staffSettings: {
    getPreferences: (staffId) => ipcRenderer.invoke('staff-settings:get-preferences', staffId),
    updatePreferences: (staffId, preferences) => ipcRenderer.invoke('staff-settings:update-preferences', staffId, preferences),
    getPrinters: () => ipcRenderer.invoke('staff-settings:get-printers'),
    testPrint: (printerName, printerType) => ipcRenderer.invoke('staff-settings:test-print', printerName, printerType),
    updatePassword: (userId, oldPass, newPass) => ipcRenderer.invoke('staff-settings:update-password', userId, oldPass, newPass),
    getVersion: () => ipcRenderer.invoke('staff-settings:get-version'),
  },
  staffNotificationCenter: {
    getAll: (staffId, filters) => ipcRenderer.invoke('staff-notifications:get-all', staffId, filters),
    markRead: (notificationId, staffId) => ipcRenderer.invoke('staff-notifications:mark-read', notificationId, staffId),
    markAllRead: (staffId) => ipcRenderer.invoke('staff-notifications:mark-all-read', staffId),
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
    calculate: (input) => ipcRenderer.invoke('sales:calculate', input),
    checkout: (request) => ipcRenderer.invoke('sales:checkout', request),
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
    seedEnterpriseData: () => ipcRenderer.invoke('system:seed-enterprise-data'),
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
  realtime: {
    onEvent: (callback) => {
      const handler = (_: any, event: any) => callback(event);
      ipcRenderer.on('realtime:event', handler);
      return () => {
        ipcRenderer.removeListener('realtime:event', handler);
      };
    },
    publishEvent: (event) => ipcRenderer.invoke('realtime:publish', event),
  },
  ai: {
    chat: (request: any, userContext?: any) => ipcRenderer.invoke('ai:chat', { request, userContext }),
    getQuickPrompts: (userContext?: any) => ipcRenderer.invoke('ai:getQuickPrompts', userContext),
    getLogs: (limit?: number) => ipcRenderer.invoke('ai:getLogs', limit),
    getStats: () => ipcRenderer.invoke('ai:getStats'),
    getSalesInsights: (timeframe?: string, userContext?: any) => ipcRenderer.invoke('ai:getSalesInsights', { timeframe, userContext }),
    getDailySummary: (dateStr?: string, userContext?: any) => ipcRenderer.invoke('ai:getDailySummary', { dateStr, userContext }),
    getInventoryIntelligence: (userContext?: any) => ipcRenderer.invoke('ai:getInventoryIntelligence', { userContext }),
    getProductForecast: (variantId: number, userContext?: any) => ipcRenderer.invoke('ai:getProductForecast', { variantId, userContext }),
    getDeadStock: (userContext?: any) => ipcRenderer.invoke('ai:getDeadStock', { userContext }),
    getCartRecommendations: (request: any, userContext?: any) => ipcRenderer.invoke('ai:getCartRecommendations', { request, userContext }),
    getCustomerIntelligence: (customerId: number, userContext?: any) => ipcRenderer.invoke('ai:getCustomerIntelligence', { customerId, userContext }),
    getProductRecommendations: (productId: number, userContext?: any) => ipcRenderer.invoke('ai:getProductRecommendations', { productId, userContext }),
    trackRecommendationFeedback: (event: any) => ipcRenderer.invoke('ai:trackRecommendationFeedback', { event }),
    getAnomalies: (filter?: any, userContext?: any) => ipcRenderer.invoke('ai:getAnomalies', { filter, userContext }),
    getAnomalyDetails: (anomalyId: string, userContext?: any) => ipcRenderer.invoke('ai:getAnomalyDetails', { anomalyId, userContext }),
    reviewAnomaly: (request: any, userContext?: any) => ipcRenderer.invoke('ai:reviewAnomaly', { request, userContext }),
    getRiskSummary: (userContext?: any) => ipcRenderer.invoke('ai:getRiskSummary', { userContext }),
    getSmartReport: (period: string, dateStr?: string, userContext?: any) => ipcRenderer.invoke('ai:getSmartReport', { period, dateStr, userContext }),
    getReportHistory: (userContext?: any) => ipcRenderer.invoke('ai:getReportHistory', { userContext }),
    biQuery: (request: any, userContext?: any) => ipcRenderer.invoke('ai:biQuery', { request, userContext }),
    getBiConversations: (userContext?: any) => ipcRenderer.invoke('ai:getBiConversations', { userContext }),
    getBiConversationMessages: (conversationId: string, userContext?: any) => ipcRenderer.invoke('ai:getBiConversationMessages', { conversationId, userContext }),
    clearBiConversation: (conversationId: string, userContext?: any) => ipcRenderer.invoke('ai:clearBiConversation', { conversationId, userContext }),
    getDashboardConfig: (userContext?: any) => ipcRenderer.invoke('ai:getDashboardConfig', { userContext }),
  },
};

contextBridge.exposeInMainWorld('api', api);
