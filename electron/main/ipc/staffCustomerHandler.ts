import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { StaffCustomerService } from '../services/staffCustomerService';
import log from '../logger';

export function registerStaffCustomerHandlers(db: Database.Database) {
  const service = new StaffCustomerService(db);

  // 1. Search Customers
  ipcMain.handle('staff-customer:search', async (_, query?: string, filters?: any) => {
    try {
      const data = service.searchCustomers(query, filters);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:search error:', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Get Customer Profile Details
  ipcMain.handle('staff-customer:get-details', async (_, customerId: number) => {
    try {
      const data = service.getCustomerDetails(customerId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:get-details error:', err);
      return { success: false, error: err.message };
    }
  });

  // 3. Create Customer
  ipcMain.handle('staff-customer:create', async (_, input: any) => {
    try {
      const data = service.createCustomer(input);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:create error:', err);
      return { success: false, error: err.message };
    }
  });

  // 4. Update Customer
  ipcMain.handle('staff-customer:update', async (_, customerId: number, input: any) => {
    try {
      const data = service.updateCustomer(customerId, input);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:update error:', err);
      return { success: false, error: err.message };
    }
  });

  // 5. Customer Purchase History
  ipcMain.handle('staff-customer:purchases', async (_, customerId: number) => {
    try {
      const data = service.getCustomerPurchaseHistory(customerId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:purchases error:', err);
      return { success: false, error: err.message };
    }
  });

  // 6. Customer Returns History
  ipcMain.handle('staff-customer:returns', async (_, customerId: number) => {
    try {
      const data = service.getCustomerReturns(customerId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:returns error:', err);
      return { success: false, error: err.message };
    }
  });

  // 7. Customer Loyalty Account & Ledger
  ipcMain.handle('staff-customer:loyalty', async (_, customerId: number) => {
    try {
      const data = service.getCustomerLoyalty(customerId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:loyalty error:', err);
      return { success: false, error: err.message };
    }
  });

  // 8. Adjust / Redeem Loyalty Points
  ipcMain.handle('staff-customer:adjust-loyalty', async (_, customerId: number, points: number, type: any, description: string) => {
    try {
      const data = service.adjustLoyaltyPoints(customerId, points, type, description);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:adjust-loyalty error:', err);
      return { success: false, error: err.message };
    }
  });

  // 9. Add Customer Note
  ipcMain.handle('staff-customer:add-note', async (_, customerId: number, note: string) => {
    try {
      const data = service.addCustomerNote(customerId, note);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:add-note error:', err);
      return { success: false, error: err.message };
    }
  });

  // 10. Get Customer Notes
  ipcMain.handle('staff-customer:get-notes', async (_, customerId: number) => {
    try {
      const data = service.getCustomerNotes(customerId);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:get-notes error:', err);
      return { success: false, error: err.message };
    }
  });

  // 11. Update Preferences
  ipcMain.handle('staff-customer:update-preferences', async (_, customerId: number, preferences: any) => {
    try {
      const data = service.updateCustomerPreferences(customerId, preferences);
      return { success: true, data };
    } catch (err: any) {
      log.error('IPC staff-customer:update-preferences error:', err);
      return { success: false, error: err.message };
    }
  });
}
