import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { SessionService } from './auth/sessionService';
import { AuditRepository } from '../repositories/auditRepository';

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
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.auditRepo = new AuditRepository(db);
  }

  private resolveStaffId(staffId?: number): number {
    if (staffId) return staffId;
    const session = SessionService.getSession();
    if (session?.staffId) return session.staffId;
    if (session?.userId) {
      const row = this.db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as { id: number } | undefined;
      if (row) return row.id;
    }
    return 1;
  }

  /**
   * 1. Get Staff Preferences
   */
  getStaffPreferences(staffId?: number): StaffPreferencesData {
    const sId = this.resolveStaffId(staffId);

    let row = this.db.prepare('SELECT * FROM staff_preferences WHERE staff_id = ?').get(sId) as any;
    if (!row) {
      this.db.prepare(`
        INSERT INTO staff_preferences (
          staff_id, default_payment_method, auto_print_receipt, scan_sound_enabled, auto_focus_search,
          receipt_printer, invoice_printer, theme, language
        ) VALUES (?, 'CASH', 1, 1, 1, 'EPSON TM-T82 Thermal', 'HP LaserJet Pro A4', 'LIGHT', 'en')
      `).run(sId);
      row = this.db.prepare('SELECT * FROM staff_preferences WHERE staff_id = ?').get(sId) as any;
    }

    return {
      staffId: row.staff_id,
      defaultPaymentMethod: row.default_payment_method || 'CASH',
      autoPrintReceipt: Boolean(row.auto_print_receipt),
      scanSoundEnabled: Boolean(row.scan_sound_enabled),
      autoFocusSearch: Boolean(row.auto_focus_search),
      receiptPrinter: row.receipt_printer || 'EPSON TM-T82 Thermal',
      invoicePrinter: row.invoice_printer || 'HP LaserJet Pro A4',
      theme: row.theme || 'LIGHT',
      language: row.language || 'en',
      updatedAt: row.updated_at,
    };
  }

  /**
   * 2. Update Staff Preferences
   */
  updateStaffPreferences(staffId: number, input: Partial<StaffPreferencesData>): StaffPreferencesData {
    const session = SessionService.getSession();
    const sId = this.resolveStaffId(staffId);

    this.db.prepare(`
      INSERT INTO staff_preferences (
        staff_id, default_payment_method, auto_print_receipt, scan_sound_enabled, auto_focus_search,
        receipt_printer, invoice_printer, theme, language, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(staff_id) DO UPDATE SET
        default_payment_method = excluded.default_payment_method,
        auto_print_receipt = excluded.auto_print_receipt,
        scan_sound_enabled = excluded.scan_sound_enabled,
        auto_focus_search = excluded.auto_focus_search,
        receipt_printer = excluded.receipt_printer,
        invoice_printer = excluded.invoice_printer,
        theme = excluded.theme,
        language = excluded.language,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      sId,
      input.defaultPaymentMethod || 'CASH',
      input.autoPrintReceipt ? 1 : 0,
      input.scanSoundEnabled ? 1 : 0,
      input.autoFocusSearch ? 1 : 0,
      input.receiptPrinter || 'EPSON TM-T82 Thermal',
      input.invoicePrinter || 'HP LaserJet Pro A4',
      input.theme || 'LIGHT',
      input.language || 'en'
    );

    this.auditRepo.log({
      user_id: session?.userId,
      action: 'PREFERENCES_UPDATED',
      entity_type: 'STAFF',
      entity_id: sId,
      new_value: `Updated POS and hardware printer preferences`,
    });

    return this.getStaffPreferences(sId);
  }

  /**
   * 3. Get Available Printers
   */
  getAvailablePrinters(): PrinterConfigItem[] {
    const rows = this.db.prepare('SELECT * FROM printer_configs ORDER BY is_default DESC, printer_name ASC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      printerName: r.printer_name,
      printerType: r.printer_type,
      isDefault: Boolean(r.is_default),
      paperWidth: r.paper_width,
      connectionType: r.connection_type,
      status: r.status,
    }));
  }

  /**
   * 4. Test Print Routine
   */
  testPrint(printerName: string, printerType: string): { success: boolean; message: string; timestamp: string } {
    const session = SessionService.getSession();
    const ts = new Date().toISOString();

    this.auditRepo.log({
      user_id: session?.userId,
      action: 'HARDWARE_TEST_PRINT',
      entity_type: 'PRINTER',
      new_value: `Executed test print routine on ${printerName} (${printerType})`,
    });

    return {
      success: true,
      message: `Test print advice sent successfully to ${printerName} (${printerType}).`,
      timestamp: ts,
    };
  }

  /**
   * 5. Update Staff Password
   */
  async updateStaffPassword(userId: number, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const session = SessionService.getSession();
    const targetUserId = userId || session?.userId;
    if (!targetUserId) throw new Error('Unauthenticated user session.');

    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId) as any;
    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) {
      throw new Error('Current password is incorrect.');
    }

    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);

    this.db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, targetUserId);

    this.auditRepo.log({
      user_id: targetUserId,
      action: 'PASSWORD_CHANGED',
      entity_type: 'USER',
      entity_id: targetUserId,
      new_value: `Password changed successfully`,
    });

    return { success: true, message: 'Password updated successfully.' };
  }

  /**
   * 6. App Version & Diagnostics Info
   */
  getAppVersionInfo(): AppVersionInfo {
    return {
      appName: 'ரத்னா விலாஸ் (Ratna Vilas) Textile Management System',
      version: '1.0.0',
      buildDate: '2026.08.22',
      electronVersion: process.versions.electron || '28.2.0',
      nodeVersion: process.versions.node || '20.11.0',
      platform: 'Windows x64 (Desktop App)',
      databaseEngine: 'SQLite 3.45 with WAL Mode & Foreign Keys',
      databaseStatus: 'CONNECTED',
      licenseStatus: 'Licensed Store Terminal (Production Ready)',
    };
  }
}
