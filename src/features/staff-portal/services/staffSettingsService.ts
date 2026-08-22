export interface StaffPreferencesData {
  staffId: number;
  defaultPaymentMethod: string;
  autoPrintReceipt: boolean;
  scanSoundEnabled: boolean;
  autoFocusSearch: boolean;
  receiptPrinter: string;
  invoicePrinter: string;
  theme: string;
  language: string;
  updatedAt: string;
}

export interface PrinterConfigItem {
  id: number;
  printerName: string;
  printerType: 'RECEIPT' | 'INVOICE' | 'BARCODE' | 'REPORT';
  isDefault: boolean;
  paperWidth: string;
  connectionType: string;
  status: string;
}

export interface AppVersionInfo {
  appName: string;
  version: string;
  buildDate: string;
  electronVersion: string;
  nodeVersion: string;
  platform: string;
  databaseEngine: string;
  databaseStatus: 'CONNECTED' | 'DISCONNECTED';
  licenseStatus: string;
}

export class StaffSettingsService {
  async getPreferences(): Promise<StaffPreferencesData> {
    if (window.api?.staffSettings?.getPreferences) {
      const res = await window.api.staffSettings.getPreferences();
      if (!res.success) throw new Error(res.error || 'Failed to load preferences.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async updatePreferences(preferences: Partial<StaffPreferencesData>): Promise<StaffPreferencesData> {
    if (window.api?.staffSettings?.updatePreferences) {
      const res = await window.api.staffSettings.updatePreferences(1, preferences);
      if (!res.success) throw new Error(res.error || 'Failed to update preferences.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getPrinters(): Promise<PrinterConfigItem[]> {
    if (window.api?.staffSettings?.getPrinters) {
      const res = await window.api.staffSettings.getPrinters();
      if (!res.success) throw new Error(res.error || 'Failed to load printers.');
      return res.data || [];
    }
    return [];
  }

  async testPrint(printerName: string, printerType: string): Promise<{ success: boolean; message: string; timestamp: string }> {
    if (window.api?.staffSettings?.testPrint) {
      const res = await window.api.staffSettings.testPrint(printerName, printerType);
      if (!res.success) throw new Error(res.error || 'Test print failed.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async updatePassword(oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffSettings?.updatePassword) {
      const res = await window.api.staffSettings.updatePassword(0, oldPass, newPass);
      if (!res.success) throw new Error(res.error || 'Failed to update password.');
      return { success: true, message: res.message || 'Password updated successfully.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getVersionInfo(): Promise<AppVersionInfo> {
    if (window.api?.staffSettings?.getVersion) {
      const res = await window.api.staffSettings.getVersion();
      if (!res.success) throw new Error(res.error || 'Failed to get version info.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }
}

export const staffSettingsService = new StaffSettingsService();
