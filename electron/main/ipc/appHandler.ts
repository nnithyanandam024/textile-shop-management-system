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

  // Products & Variants
  ipcMain.handle('products:get-all', () => {
    const repo = new ProductRepository(getDatabase());
    return repo.getAllProducts();
  });

  ipcMain.handle('variants:get-all', () => {
    const repo = new ProductRepository(getDatabase());
    return repo.getAllVariants();
  });

  ipcMain.handle('variants:get-by-sku', (_, sku: string) => {
    const repo = new ProductRepository(getDatabase());
    return repo.getVariantBySku(sku);
  });

  ipcMain.handle('variants:get-by-barcode', (_, barcode: string) => {
    const repo = new ProductRepository(getDatabase());
    return repo.getVariantByBarcode(barcode);
  });

  ipcMain.handle('products:create', (_, p: { name: string; category_id: number; brand_id?: number; material?: string; description?: string }) => {
    try {
      const repo = new ProductRepository(getDatabase());
      const id = repo.createProduct(p);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle('variants:create', (_, v: {
    product_id: number;
    sku: string;
    barcode?: string;
    size?: string;
    color?: string;
    pattern?: string;
    purchase_price: number;
    selling_price: number;
    tax_rate?: number;
    minimum_stock?: number;
    current_stock?: number;
  }) => {
    try {
      const repo = new ProductRepository(getDatabase());
      const id = repo.createVariant(v);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Categories & Brands
  ipcMain.handle('categories:get-all', () => {
    const repo = new CategoryRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('brands:get-all', () => {
    const repo = new BrandRepository(getDatabase());
    return repo.getAll();
  });

  // Customers & Suppliers
  ipcMain.handle('customers:get-all', () => {
    const repo = new CustomerRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('customers:create', (_, c: { customer_code: string; name: string; phone?: string; address?: string; gst_number?: string }) => {
    try {
      const repo = new CustomerRepository(getDatabase());
      const id = repo.create(c);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  ipcMain.handle('suppliers:get-all', () => {
    const repo = new SupplierRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('suppliers:create', (_, s: { supplier_code: string; company_name: string; contact_person?: string; phone?: string; gst_number?: string }) => {
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
    const repo = new SaleRepository(getDatabase());
    return repo.getAllSales();
  });

  ipcMain.handle('sales:create', (_, input: CreateSaleInput) => {
    const service = new SalesService(getDatabase());
    return service.createSale(input);
  });

  // Purchases
  ipcMain.handle('purchases:get-all', () => {
    const repo = new PurchaseRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('purchases:create', (_, input: CreatePurchaseInput) => {
    const service = new PurchaseService(getDatabase());
    return service.createPurchase(input);
  });

  // Stock Ledger
  ipcMain.handle('stock:get-transactions', () => {
    const repo = new StockRepository(getDatabase());
    return repo.getAllTransactions();
  });

  // Expenses
  ipcMain.handle('expenses:get-all', () => {
    const repo = new ExpenseRepository(getDatabase());
    return repo.getAll();
  });

  ipcMain.handle('expenses:create', (_, e: { category: string; description?: string; amount: number; payment_method?: string }) => {
    try {
      const repo = new ExpenseRepository(getDatabase());
      const id = repo.create(e);
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
    try {
      const repo = new SettingsRepository(getDatabase());
      repo.set(key, value);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  });

  // Backup
  ipcMain.handle('backup:create', (_, customName?: string) => BackupService.createBackup(customName));

  // Renderer Log
  ipcMain.handle('app:log', (_, { level, message, details }: { level: string; message: string; details?: any }) => {
    if (level === 'error') log.error(`[Renderer] ${message}`, details || '');
    else if (level === 'warn') log.warn(`[Renderer] ${message}`, details || '');
    else log.info(`[Renderer] ${message}`, details || '');
    return true;
  });
}
