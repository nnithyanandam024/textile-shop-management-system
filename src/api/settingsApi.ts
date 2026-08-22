import apiClient, { ApiResponse } from './client';

export interface POSSettings {
  defaultPaymentMethod: string;
  autoPrintReceipt: boolean;
  scanSoundEnabled: boolean;
  autoFocusSearch: boolean;
  receiptPrinter: string;
  invoicePrinter: string;
  theme: string;
}

export const settingsApi = {
  /**
   * Get store and staff POS settings
   */
  async getSettings(): Promise<ApiResponse<POSSettings>> {
    if (typeof window !== 'undefined' && window.api?.staffSettings?.getPreferences) {
      try {
        const res = await window.api.staffSettings.getPreferences();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<POSSettings>('/settings');
  },

  /**
   * Update store and staff POS settings
   */
  async updateSettings(settings: Partial<POSSettings>): Promise<ApiResponse<POSSettings>> {
    if (typeof window !== 'undefined' && window.api?.staffSettings?.updatePreferences) {
      try {
        const res = await window.api.staffSettings.updatePreferences(1, settings);
        if (res.success && res.data) {
          return { success: true, data: res.data, message: 'Settings saved.' };
        }
      } catch {}
    }
    return apiClient.patch<POSSettings>('/settings', settings);
  },

  /**
   * Get configured hardware printers
   */
  async getPrinterSettings(): Promise<ApiResponse<any[]>> {
    if (typeof window !== 'undefined' && window.api?.staffSettings?.getPrinters) {
      try {
        const res = await window.api.staffSettings.getPrinters();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/settings/printers');
  },

  /**
   * Test print command
   */
  async testPrint(printerName: string, printerType: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    if (typeof window !== 'undefined' && window.api?.staffSettings?.testPrint) {
      try {
        const res = await window.api.staffSettings.testPrint(printerName, printerType);
        if (res.success && res.data) {
          return { success: true, data: res.data, message: res.data.message };
        }
      } catch {}
    }
    return apiClient.post('/settings/printers/test-print', { printerName, printerType });
  },
};

export default settingsApi;
