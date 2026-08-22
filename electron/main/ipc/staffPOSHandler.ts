import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffPOSService } from '../services/staffPOSService';
import log from '../logger';

export function registerStaffPOSHandlers(db: Database.Database) {
  const service = new StaffPOSService(db);

  // 1. Search Products
  ipcMain.handle('staff-pos:search-products', async (_, query?: string, categoryId?: number) => {
    try {
      const data = service.searchProducts(query, categoryId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:search-products error:', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Barcode Lookup
  ipcMain.handle('staff-pos:get-by-barcode', async (_, barcode: string) => {
    try {
      const data = service.getProductByBarcode(barcode);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:get-by-barcode error:', err);
      return { success: false, error: err.message };
    }
  });

  // 3. Get Customers
  ipcMain.handle('staff-pos:get-customers', async (_, query?: string) => {
    try {
      const data = service.getCustomers(query);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:get-customers error:', err);
      return { success: false, error: err.message };
    }
  });

  // 4. Quick Customer Registration
  ipcMain.handle('staff-pos:quick-customer', async (_, input: any) => {
    try {
      const result = service.quickCreateCustomer(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-pos:quick-customer error:', err);
      return { success: false, error: err.message };
    }
  });

  // 5. Customer History
  ipcMain.handle('staff-pos:customer-history', async (_, customerId: number) => {
    try {
      const data = service.getCustomerHistory(customerId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:customer-history error:', err);
      return { success: false, error: err.message };
    }
  });

  // 6. Calculate Cart Totals
  ipcMain.handle('staff-pos:calculate-totals', async (_, input: any) => {
    try {
      const data = service.calculateCartTotals(input);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:calculate-totals error:', err);
      return { success: false, error: err.message };
    }
  });

  // 7. Complete Sale (Atomic checkout)
  ipcMain.handle('staff-pos:complete-sale', async (_, input: any) => {
    try {
      const data = service.completeSale(input);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:complete-sale error:', err);
      return { success: false, error: err.message };
    }
  });

  // 8. Hold Sale
  ipcMain.handle('staff-pos:hold-sale', async (_, input: any) => {
    try {
      const result = service.holdSale(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-pos:hold-sale error:', err);
      return { success: false, error: err.message };
    }
  });

  // 9. Get Held Sales
  ipcMain.handle('staff-pos:get-held-sales', async () => {
    try {
      const data = service.getHeldSales();
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:get-held-sales error:', err);
      return { success: false, error: err.message };
    }
  });

  // 10. Resume Sale
  ipcMain.handle('staff-pos:resume-sale', async (_, heldId: number) => {
    try {
      const data = service.resumeSale(heldId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:resume-sale error:', err);
      return { success: false, error: err.message };
    }
  });

  // 11. Cancel Held Sale
  ipcMain.handle('staff-pos:cancel-held-sale', async (_, heldId: number) => {
    try {
      const result = service.cancelHeldSale(heldId);
      return result;
    } catch (err: any) {
      log.error('IPC staff-pos:cancel-held-sale error:', err);
      return { success: false, error: err.message };
    }
  });

  // 12. Get My Sales Summary
  ipcMain.handle('staff-pos:get-my-sales', async (_, filters?: any) => {
    try {
      const data = service.getMySales(filters);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:get-my-sales error:', err);
      return { success: false, error: err.message };
    }
  });

  // 13. Get Sale Invoice / Receipt
  ipcMain.handle('staff-pos:get-invoice', async (_, saleId: number) => {
    try {
      const data = service.getSaleInvoice(saleId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-pos:get-invoice error:', err);
      return { success: false, error: err.message };
    }
  });

  // 14. Create Return Request
  ipcMain.handle('staff-pos:create-return', async (_, input: any) => {
    try {
      const result = service.createReturnRequest(input);
      return result;
    } catch (err: any) {
      log.error('IPC staff-pos:create-return error:', err);
      return { success: false, error: err.message };
    }
  });
}
