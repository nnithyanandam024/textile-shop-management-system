import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffInventoryService } from '../services/staffInventoryService';
import log from '../logger';

export function registerStaffInventoryHandlers(db: Database.Database) {
  const service = new StaffInventoryService(db);

  // 1. Search Products
  ipcMain.handle('staff-inventory:search-products', async (_, query?: string, filters?: any) => {
    try {
      const data = service.searchProducts(query, filters);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:search-products error:', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Get Product Details
  ipcMain.handle('staff-inventory:get-product', async (_, variantId: number) => {
    try {
      const data = service.getProductDetails(variantId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-product error:', err);
      return { success: false, error: err.message };
    }
  });

  // 3. Get Low Stock Items
  ipcMain.handle('staff-inventory:get-low-stock', async () => {
    try {
      const data = service.getLowStockItems();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-low-stock error:', err);
      return { success: false, error: err.message };
    }
  });

  // 4. Get Inventory Tasks
  ipcMain.handle('staff-inventory:get-tasks', async () => {
    try {
      const data = service.getInventoryTasks();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-tasks error:', err);
      return { success: false, error: err.message };
    }
  });

  // 5. Submit Stock Count
  ipcMain.handle('staff-inventory:submit-count', async (_, input: any) => {
    try {
      const result = service.submitStockCount(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-inventory:submit-count error:', err);
      return { success: false, error: err.message };
    }
  });

  // 6. Create Transfer Request
  ipcMain.handle('staff-inventory:create-transfer', async (_, input: any) => {
    try {
      const result = service.createTransferRequest(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-inventory:create-transfer error:', err);
      return { success: false, error: err.message };
    }
  });

  // 7. Get Transfer Requests
  ipcMain.handle('staff-inventory:get-transfers', async () => {
    try {
      const data = service.getTransferRequests();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-transfers error:', err);
      return { success: false, error: err.message };
    }
  });

  // 8. Get POs for Receiving
  ipcMain.handle('staff-inventory:get-po-receiving', async () => {
    try {
      const data = service.getPurchaseOrdersForReceiving();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-po-receiving error:', err);
      return { success: false, error: err.message };
    }
  });

  // 9. Submit Receiving Report
  ipcMain.handle('staff-inventory:submit-receiving', async (_, input: any) => {
    try {
      const result = service.submitReceivingReport(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-inventory:submit-receiving error:', err);
      return { success: false, error: err.message };
    }
  });

  // 10. Get Inventory History
  ipcMain.handle('staff-inventory:get-history', async () => {
    try {
      const data = service.getInventoryHistory();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-history error:', err);
      return { success: false, error: err.message };
    }
  });

  // 11. Get Metrics
  ipcMain.handle('staff-inventory:get-metrics', async () => {
    try {
      const data = service.getMetricsSummary();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-inventory:get-metrics error:', err);
      return { success: false, error: err.message };
    }
  });
}
