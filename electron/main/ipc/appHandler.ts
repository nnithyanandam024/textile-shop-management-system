import { ipcMain, app } from 'electron';
import os from 'os';
import path from 'path';
import { getDatabase, getDatabasePath, getBackupDirectoryPath } from '../database';
import { seedDatabase } from '../database/seed';
import { ProductRepository } from '../repositories/productRepository';
import { CategoryRepository } from '../repositories/categoryRepository';
import { BrandRepository } from '../repositories/brandRepository';
import { CustomerRepository } from '../repositories/customerRepository';
import { SupplierRepository } from '../repositories/supplierRepository';
import { SaleRepository } from '../repositories/saleRepository';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { StockRepository } from '../repositories/stockRepository';
import { SettingsRepository } from '../repositories/settingsRepository';
import { CustomerService } from '../services/customerService';
import { SupplierService } from '../services/supplierService';
import { SalesService, CreateSaleInput } from '../services/salesService';
import { PurchaseService, CreatePurchaseInput } from '../services/purchaseService';
import { ReturnService, ProcessReturnInput, ProcessExchangeInput } from '../services/returnService';
import { ExpenseService, CreateExpenseInput } from '../services/expenseService';
import { DashboardService } from '../services/dashboardService';
import { ReportService } from '../services/reportService';
import { BackupService } from '../services/backupService';
import { RestoreService } from '../services/restoreService';
import { InvoiceService } from '../services/invoiceService';
import { AuthService } from '../services/auth/authService';
import { UserService, CreateUserInput, UpdateUserInput } from '../services/auth/userService';
import { RoleService } from '../services/auth/roleService';
import { ProductService, CreateProductInput } from '../services/productService';
import { InventoryService } from '../services/inventoryService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';
import { registerStaffHandlers } from './staffHandler';
import { registerAttendanceHandlers } from './attendanceHandler';
import { registerShiftHandlers } from './shiftHandler';
import { registerLeaveHandlers } from './leaveHandler';
import { registerPayrollHandlers } from './payrollHandler';
import { registerPerformanceHandlers } from './performanceHandler';
import { registerDocumentHandlers } from './documentHandler';
import log from '../logger';

export function registerIpcHandlers() {
  const db = getDatabase();
  registerStaffHandlers(db);
  registerAttendanceHandlers(db);
  registerShiftHandlers(db);
  registerLeaveHandlers(db);
  registerPayrollHandlers(db);
  registerPerformanceHandlers(db);
  registerDocumentHandlers(db);

  // App Info
  ipcMain.handle('app:get-version', () => app.getVersion() || '0.1.0');

  ipcMain.handle('app:get-system-info', () => {
    return {
      appName: 'Textile Shop Management System',
      version: app.getVersion() || '0.1.0',
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: os.arch(),
      totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMB: Math.round(os.freemem() / (1024 * 1024)),
      dbPath: getDatabasePath(),
      backupPath: getBackupDirectoryPath(),
    };
  });

  // DB Health & Seed
  ipcMain.handle('db:check-status', () => {
    const health = BackupService.getHealthCheck();
    return {
      status: health.status === 'healthy' ? 'online' : 'error',
      path: health.databasePath,
      settingsCount: health.settingsCount,
      tablesCount: health.tablesCount,
      error: health.error,
    };
  });

  ipcMain.handle('db:health-check', () => BackupService.getHealthCheck());

  ipcMain.handle('db:seed', () => {
    try {
      const db = getDatabase();
      seedDatabase(db);
      return { success: true };
    } catch (error: any) {
      log.error('IPC Seed error:', error);
      return { success: false, error: error.message || String(error) };
    }
  });

  // ----------------------------------------------------
  // AUTHENTICATION & USER MANAGEMENT
  // ----------------------------------------------------
  ipcMain.handle('auth:check-setup', () => {
    const service = new AuthService(getDatabase());
    return service.checkInitialSetup();
  });

  ipcMain.handle('auth:first-time-setup', (_, input) => {
    const service = new AuthService(getDatabase());
    return service.firstTimeSetup(input);
  });

  ipcMain.handle('auth:login', (_, { username, password }) => {
    const service = new AuthService(getDatabase());
    return service.login(username, password);
  });

  ipcMain.handle('auth:logout', () => {
    const service = new AuthService(getDatabase());
    return service.logout();
  });

  ipcMain.handle('auth:get-current-user', () => {
    const service = new AuthService(getDatabase());
    return service.getCurrentUser();
  });

  ipcMain.handle('auth:change-password', (_, { currentPassword, newPassword }) => {
    const session = SessionService.getSession();
    if (!session) return { success: false, error: 'Unauthorized.' };
    const service = new AuthService(getDatabase());
    return service.changePassword(session.userId, currentPassword, newPassword);
  });

  ipcMain.handle('users:get-all', () => {
    AuthorizationService.requirePermission('users.view');
    const service = new UserService(getDatabase());
    return service.getUsers();
  });

  ipcMain.handle('users:create', (_, input: CreateUserInput) => {
    AuthorizationService.requirePermission('users.manage');
    const session = SessionService.getSession();
    const service = new UserService(getDatabase());
    return service.createUser(input, session?.userId);
  });

  ipcMain.handle('users:update', (_, { id, input }: { id: number; input: UpdateUserInput }) => {
    AuthorizationService.requirePermission('users.manage');
    const session = SessionService.getSession();
    const service = new UserService(getDatabase());
    return service.updateUser(id, input, session?.userId);
  });

  ipcMain.handle('users:reset-password', (_, { targetUserId, newPassword }: { targetUserId: number; newPassword: string }) => {
    AuthorizationService.requirePermission('users.manage');
    const session = SessionService.getSession();
    const service = new UserService(getDatabase());
    return service.resetPassword(session?.userId || 1, targetUserId, newPassword);
  });

  ipcMain.handle('users:create-staff-login', async (_, { staffId, input }: { staffId: number; input: CreateUserInput }) => {
    AuthorizationService.requirePermission('user.create');
    const session = SessionService.getSession();
    const service = new UserService(getDatabase());
    return await service.createStaffLogin(staffId, input, session?.userId);
  });

  // ----------------------------------------------------
  // ROLES & PERMISSIONS API
  // ----------------------------------------------------
  ipcMain.handle('roles:get-all', () => {
    AuthorizationService.requirePermission('role.view');
    const service = new RoleService(getDatabase());
    return service.getRoles();
  });

  ipcMain.handle('roles:get-by-id', (_, id: number) => {
    AuthorizationService.requirePermission('role.view');
    const service = new RoleService(getDatabase());
    return service.getRoleById(id);
  });

  ipcMain.handle('roles:get-all-permissions', () => {
    AuthorizationService.requirePermission('role.view');
    const service = new RoleService(getDatabase());
    return service.getAllPermissions();
  });

  ipcMain.handle('roles:get-role-permissions', (_, roleId: number) => {
    AuthorizationService.requirePermission('role.view');
    const service = new RoleService(getDatabase());
    return service.getRolePermissions(roleId);
  });

  ipcMain.handle('roles:create', (_, input: any) => {
    AuthorizationService.requirePermission('role.create');
    const session = SessionService.getSession();
    const service = new RoleService(getDatabase());
    return service.createRole(input, session?.userId);
  });

  ipcMain.handle('roles:update', (_, { id, input }: { id: number; input: any }) => {
    AuthorizationService.requirePermission('role.update');
    const session = SessionService.getSession();
    const service = new RoleService(getDatabase());
    return service.updateRole(id, input, session?.userId);
  });

  ipcMain.handle('roles:delete', (_, id: number) => {
    AuthorizationService.requirePermission('role.delete');
    const session = SessionService.getSession();
    const service = new RoleService(getDatabase());
    return service.deleteRole(id, session?.userId);
  });

  // ----------------------------------------------------
  // PRODUCTS & VARIANTS
  // ----------------------------------------------------
  ipcMain.handle('products:get-all', () => {
    AuthorizationService.requirePermission('products.view');
    const repo = new ProductRepository(getDatabase());
    return repo.getAllProducts();
  });

  ipcMain.handle('variants:get-all', () => {
    AuthorizationService.requirePermission('products.view');
    const repo = new ProductRepository(getDatabase());
    return repo.getAllVariants();
  });

  ipcMain.handle('variants:get-by-sku', (_, sku: string) => {
    AuthorizationService.requirePermission('products.view');
    const repo = new ProductRepository(getDatabase());
    return repo.getVariantBySku(sku);
  });

  ipcMain.handle('variants:get-by-barcode', (_, barcode: string) => {
    AuthorizationService.requirePermission('products.view');
    const repo = new ProductRepository(getDatabase());
    return repo.getVariantByBarcode(barcode);
  });

  ipcMain.handle('products:create-with-variants', (_, input: CreateProductInput) => {
    AuthorizationService.requirePermission('products.manage');
    const session = SessionService.getSession();
    const service = new ProductService(getDatabase());
    return service.createProductWithVariants(input, session?.userId);
  });

  ipcMain.handle('products:deactivate', (_, productId: number) => {
    AuthorizationService.requirePermission('products.manage');
    const session = SessionService.getSession();
    const service = new ProductService(getDatabase());
    return service.deactivateProduct(productId, session?.userId);
  });

  // ----------------------------------------------------
  // INVENTORY & STOCK CONTROL
  // ----------------------------------------------------
  ipcMain.handle('inventory:get-metrics', () => {
    AuthorizationService.requirePermission('inventory.view');
    const service = new InventoryService(getDatabase());
    return service.getMetrics();
  });

  ipcMain.handle('inventory:get-low-stock', () => {
    AuthorizationService.requirePermission('inventory.view');
    const service = new InventoryService(getDatabase());
    return service.getLowStockVariants();
  });

  ipcMain.handle('inventory:get-out-of-stock', () => {
    AuthorizationService.requirePermission('inventory.view');
    const service = new InventoryService(getDatabase());
    return service.getOutOfStockVariants();
  });

  ipcMain.handle('inventory:get-history', (_, variantId?: number) => {
    AuthorizationService.requirePermission('inventory.view');
    const service = new InventoryService(getDatabase());
    return service.getStockHistory(variantId);
  });

  ipcMain.handle('inventory:adjust', (_, input) => {
    AuthorizationService.requirePermission('inventory.adjust');
    const session = SessionService.getSession();
    const service = new InventoryService(getDatabase());
    return service.adjustStock({ ...input, created_by: session?.userId });
  });

  // Categories & Brands
  ipcMain.handle('categories:get-all', () => {
    const repo = new CategoryRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('categories:create', (_, c: { name: string; description?: string; parent_id?: number }) => {
    AuthorizationService.requirePermission('products.manage');
    try {
      const repo = new CategoryRepository(getDatabase());
      const id = repo.create(c);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle('brands:get-all', () => {
    const repo = new BrandRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('brands:create', (_, b: { name: string; description?: string }) => {
    AuthorizationService.requirePermission('products.manage');
    try {
      const repo = new BrandRepository(getDatabase());
      const id = repo.create(b);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Customers & Suppliers
  ipcMain.handle('customers:get-all', () => {
    AuthorizationService.requirePermission('customers.view');
    const repo = new CustomerRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('customers:get-profile', (_, id: number) => {
    AuthorizationService.requirePermission('customers.view');
    const service = new CustomerService(getDatabase());
    return service.getCustomerProfile(id);
  });

  ipcMain.handle('customers:create', (_, c: any) => {
    AuthorizationService.requirePermission('customers.manage');
    const session = SessionService.getSession();
    const service = new CustomerService(getDatabase());
    return service.createCustomer(c, session?.userId);
  });

  ipcMain.handle('customers:receive-payment', (_, { customerId, amount, paymentMethod }: { customerId: number; amount: number; paymentMethod: string }) => {
    AuthorizationService.requirePermission('customers.manage');
    const session = SessionService.getSession();
    const service = new CustomerService(getDatabase());
    return service.receiveCustomerPayment(customerId, amount, paymentMethod, session?.userId);
  });

  ipcMain.handle('suppliers:get-all', () => {
    AuthorizationService.requirePermission('suppliers.view');
    const repo = new SupplierRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('suppliers:get-profile', (_, id: number) => {
    AuthorizationService.requirePermission('suppliers.view');
    const service = new SupplierService(getDatabase());
    return service.getSupplierProfile(id);
  });

  ipcMain.handle('suppliers:create', (_, s: any) => {
    AuthorizationService.requirePermission('suppliers.manage');
    const session = SessionService.getSession();
    const service = new SupplierService(getDatabase());
    return service.createSupplier(s, session?.userId);
  });

  ipcMain.handle('suppliers:make-payment', (_, { supplierId, amount, paymentMethod }: { supplierId: number; amount: number; paymentMethod: string }) => {
    AuthorizationService.requirePermission('suppliers.manage');
    const session = SessionService.getSession();
    const service = new SupplierService(getDatabase());
    return service.makeSupplierPayment(supplierId, amount, paymentMethod, session?.userId);
  });

  // Sales & POS Terminal
  ipcMain.handle('sales:get-all', () => {
    AuthorizationService.requirePermission('sales.view');
    const repo = new SaleRepository(getDatabase());
    return repo.getAllSales();
  });

  ipcMain.handle('sales:get-details', (_, saleId: number) => {
    AuthorizationService.requirePermission('sales.view');
    const service = new InvoiceService(getDatabase());
    return service.getInvoiceData(saleId);
  });

  ipcMain.handle('sales:create', (_, input: CreateSaleInput) => {
    AuthorizationService.requirePermission('billing.create');
    const session = SessionService.getSession();
    const service = new SalesService(getDatabase());
    return service.createSale({ ...input, created_by: session?.userId });
  });

  ipcMain.handle('sales:cancel', (_, saleId: number) => {
    AuthorizationService.requirePermission('sales.manage');
    const session = SessionService.getSession();
    const service = new SalesService(getDatabase());
    return service.cancelSale(saleId, session?.userId);
  });

  // Purchases
  ipcMain.handle('purchases:get-all', () => {
    AuthorizationService.requirePermission('purchases.view');
    const repo = new PurchaseRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('purchases:create', (_, input: CreatePurchaseInput) => {
    AuthorizationService.requirePermission('purchases.manage');
    const session = SessionService.getSession();
    const service = new PurchaseService(getDatabase());
    return service.createPurchase({ ...input, created_by: session?.userId });
  });

  ipcMain.handle('purchases:cancel', (_, purchaseId: number) => {
    AuthorizationService.requirePermission('purchases.manage');
    const session = SessionService.getSession();
    const service = new PurchaseService(getDatabase());
    return service.cancelPurchase(purchaseId, session?.userId);
  });

  // Stock Ledger
  ipcMain.handle('stock:get-transactions', () => {
    AuthorizationService.requirePermission('inventory.view');
    const repo = new StockRepository(getDatabase());
    return repo.getAllTransactions();
  });

  // Returns & Exchanges
  ipcMain.handle('returns:get-all', () => {
    AuthorizationService.requirePermission('returns.view');
    const service = new ReturnService(getDatabase());
    return service.getAllReturns();
  });

  ipcMain.handle('returns:create', (_, input: ProcessReturnInput) => {
    AuthorizationService.requirePermission('returns.create');
    const session = SessionService.getSession();
    const service = new ReturnService(getDatabase());
    return service.processReturn({ ...input, created_by: session?.userId });
  });

  ipcMain.handle('exchanges:create', (_, input: ProcessExchangeInput) => {
    AuthorizationService.requirePermission('returns.create');
    const session = SessionService.getSession();
    const service = new ReturnService(getDatabase());
    return service.processExchange({ ...input, created_by: session?.userId });
  });

  // Expenses
  ipcMain.handle('expenses:get-all', () => {
    AuthorizationService.requirePermission('expenses.view');
    const service = new ExpenseService(getDatabase());
    return service.getAllExpenses();
  });

  ipcMain.handle('expenses:create', (_, input: CreateExpenseInput) => {
    AuthorizationService.requirePermission('expenses.create');
    const session = SessionService.getSession();
    const service = new ExpenseService(getDatabase());
    return service.createExpense({ ...input, created_by: session?.userId });
  });

  ipcMain.handle('expenses:cancel', (_, expenseId: number) => {
    AuthorizationService.requirePermission('expenses.cancel');
    const session = SessionService.getSession();
    const service = new ExpenseService(getDatabase());
    return service.cancelExpense(expenseId, session?.userId);
  });

  // Dashboard API
  ipcMain.handle('dashboard:get-kpis', (_, startDate?: string, endDate?: string) => {
    AuthorizationService.requirePermission('dashboard.view');
    const service = new DashboardService(getDatabase());
    return service.getKPIs(startDate, endDate);
  });

  ipcMain.handle('dashboard:get-sales-trend', (_, days?: number) => {
    AuthorizationService.requirePermission('dashboard.view');
    const service = new DashboardService(getDatabase());
    return service.getSalesTrend(days);
  });

  ipcMain.handle('dashboard:get-bestsellers', (_, limit?: number) => {
    AuthorizationService.requirePermission('dashboard.view');
    const service = new DashboardService(getDatabase());
    return service.getBestSellers(limit);
  });

  ipcMain.handle('dashboard:get-low-stock-alerts', (_, limit?: number) => {
    AuthorizationService.requirePermission('dashboard.view');
    const service = new DashboardService(getDatabase());
    return service.getLowStockAlerts(limit);
  });

  ipcMain.handle('dashboard:get-recent-transactions', (_, limit?: number) => {
    AuthorizationService.requirePermission('dashboard.view');
    const service = new DashboardService(getDatabase());
    return service.getRecentTransactions(limit);
  });

  // Reports API
  ipcMain.handle('reports:get-sales', (_, filter: any) => {
    AuthorizationService.requirePermission('sales.view');
    const service = new ReportService(getDatabase());
    return service.getSalesReport(filter || {});
  });

  ipcMain.handle('reports:get-inventory', () => {
    AuthorizationService.requirePermission('inventory.view');
    const service = new ReportService(getDatabase());
    return service.getInventoryReport();
  });

  ipcMain.handle('reports:get-financial', (_, filter: any) => {
    AuthorizationService.requirePermission('dashboard.view');
    const service = new ReportService(getDatabase());
    return service.getFinancialReport(filter || {});
  });

  ipcMain.handle('reports:get-customers', () => {
    AuthorizationService.requirePermission('customers.view');
    const service = new ReportService(getDatabase());
    return service.getCustomerReport();
  });

  ipcMain.handle('reports:get-suppliers', () => {
    AuthorizationService.requirePermission('suppliers.view');
    const service = new ReportService(getDatabase());
    return service.getSupplierReport();
  });

  ipcMain.handle('reports:export-csv', (_, { data, headers }: { data: any[]; headers: { key: string; label: string }[] }) => {
    const service = new ReportService(getDatabase());
    return service.exportToCSV(data, headers);
  });

  // Backup & Restore API
  ipcMain.handle('backup:create', async (_, customName?: string) => {
    AuthorizationService.requirePermission('backup.create');
    return await BackupService.createBackup(customName);
  });

  ipcMain.handle('backup:list', () => {
    AuthorizationService.requirePermission('backup.create');
    return BackupService.getBackupsList();
  });

  ipcMain.handle('backup:verify', (_, filename: string) => {
    AuthorizationService.requirePermission('backup.create');
    const backupDir = getBackupDirectoryPath();
    const targetPath = path.join(backupDir, filename);
    return BackupService.verifyBackupFile(targetPath);
  });

  ipcMain.handle('backup:export', (_, { filename, targetDir }: { filename: string; targetDir: string }) => {
    AuthorizationService.requirePermission('backup.create');
    return BackupService.exportBackup(filename, targetDir);
  });

  ipcMain.handle('backup:delete', (_, filename: string) => {
    AuthorizationService.requirePermission('backup.create');
    return BackupService.deleteBackup(filename);
  });

  ipcMain.handle('backup:restore', async (_, filename: string) => {
    AuthorizationService.requirePermission('backup.restore');
    const session = SessionService.getSession();
    return await RestoreService.restoreBackup(filename, session?.userId);
  });

  // System Health API
  ipcMain.handle('system:get-health', () => {
    AuthorizationService.requirePermission('settings.view');
    return BackupService.getHealthCheck();
  });

  ipcMain.handle('system:check-integrity', () => {
    AuthorizationService.requirePermission('settings.view');
    return BackupService.checkIntegrity();
  });

  // Settings
  ipcMain.handle('settings:get-all', () => {
    try {
      const repo = new SettingsRepository(getDatabase());
      return { success: true, data: repo.getAll() };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle('settings:update', (_, { key, value }: { key: string; value: string }) => {
    AuthorizationService.requirePermission('settings.update');
    try {
      const repo = new SettingsRepository(getDatabase());
      repo.set(key, value);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Backup & Restore
  ipcMain.handle('backup:create', (_, customName?: string) => {
    AuthorizationService.requirePermission('backup.create');
    return BackupService.createBackup(customName);
  });

  // Renderer Log
  ipcMain.handle('app:log', (_, { level, message, details }: { level: string; message: string; details?: any }) => {
    if (level === 'error') log.error(`[Renderer] ${message}`, details || '');
    else if (level === 'warn') log.warn(`[Renderer] ${message}`, details || '');
    else log.info(`[Renderer] ${message}`, details || '');
    return true;
  });
}
