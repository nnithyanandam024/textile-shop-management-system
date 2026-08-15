import { ipcMain, app } from 'electron';
import os from 'os';
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
import { ExpenseRepository } from '../repositories/expenseRepository';
import { SettingsRepository } from '../repositories/settingsRepository';
import { SalesService, CreateSaleInput } from '../services/salesService';
import { PurchaseService, CreatePurchaseInput } from '../services/purchaseService';
import { BackupService } from '../services/backupService';
import { AuthService } from '../services/auth/authService';
import { UserService, CreateUserInput, UpdateUserInput } from '../services/auth/userService';
import { ProductService, CreateProductInput } from '../services/productService';
import { InventoryService } from '../services/inventoryService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';
import log from '../logger';

export function registerIpcHandlers() {
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
    if (!session) return { success: false, error: 'Unauthorized.' };
    const service = new UserService(getDatabase());
    return service.resetPassword(session.userId, targetUserId, newPassword);
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

  ipcMain.handle('customers:create', (_, c: any) => {
    AuthorizationService.requirePermission('customers.manage');
    try {
      const repo = new CustomerRepository(getDatabase());
      const id = repo.create(c);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle('suppliers:get-all', () => {
    AuthorizationService.requirePermission('suppliers.view');
    const repo = new SupplierRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('suppliers:create', (_, s: any) => {
    AuthorizationService.requirePermission('suppliers.manage');
    try {
      const repo = new SupplierRepository(getDatabase());
      const id = repo.create(s);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Sales & POS Terminal
  ipcMain.handle('sales:get-all', () => {
    AuthorizationService.requirePermission('sales.view');
    const repo = new SaleRepository(getDatabase());
    return repo.getAllSales();
  });

  ipcMain.handle('sales:create', (_, input: CreateSaleInput) => {
    AuthorizationService.requirePermission('billing.create');
    const session = SessionService.getSession();
    const service = new SalesService(getDatabase());
    return service.createSale({ ...input, created_by: session?.userId });
  });

  // Purchases
  ipcMain.handle('purchases:get-all', () => {
    AuthorizationService.requirePermission('purchases.view');
    const repo = new PurchaseRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('purchases:create', (_, input: CreatePurchaseInput) => {
    AuthorizationService.requirePermission('purchases.manage');
    const service = new PurchaseService(getDatabase());
    return service.createPurchase(input);
  });

  // Stock Ledger
  ipcMain.handle('stock:get-transactions', () => {
    AuthorizationService.requirePermission('inventory.view');
    const repo = new StockRepository(getDatabase());
    return repo.getAllTransactions();
  });

  // Expenses
  ipcMain.handle('expenses:get-all', () => {
    const repo = new ExpenseRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('expenses:create', (_, e: any) => {
    try {
      const session = SessionService.getSession();
      const repo = new ExpenseRepository(getDatabase());
      const id = repo.create({ ...e, created_by: session?.userId });
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
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
