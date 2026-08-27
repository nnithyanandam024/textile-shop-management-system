import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getBackupDirectoryPath } from '../database';
import { SaleRepository } from '../repositories/saleRepository';
import { SettingsRepository } from '../repositories/settingsRepository';
import { BillingCalculationEngine } from './billing/billingCalculationEngine';
import log from '../logger';

export class InvoiceService {
  private saleRepo: SaleRepository;
  private settingsRepo: SettingsRepository;

  constructor(private db: Database.Database) {
    this.saleRepo = new SaleRepository(db);
    this.settingsRepo = new SettingsRepository(db);
  }

  getInvoiceDirectory(): string {
    const appData = path.dirname(getBackupDirectoryPath());
    const invoiceDir = path.join(appData, 'invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
    return invoiceDir;
  }

  getInvoiceData(saleId: number): { success: boolean; data?: any; error?: string } {
    try {
      const sale = this.saleRepo.getSaleById(saleId);
      if (!sale) return { success: false, error: 'Sale not found.' };

      const items = this.saleRepo.getSaleItems(saleId);
      const payments = this.saleRepo.getPayments(saleId);
      const settings = this.settingsRepo.getAll();

      return {
        success: true,
        data: {
          shopName: settings.shop_name || 'ரத்னா விலாஸ் (Ratna Vilas)',
          shopAddress: settings.shop_address || '123 Cross Cut Road, Gandhipuram, Coimbatore, TN - 641012',
          shopPhone: settings.shop_phone || '+91 98765 43210',
          shopEmail: settings.shop_email || 'contact@ratnavilas.com',
          shopGst: settings.shop_gst || '33AAAAA0000A1Z5',
          currencySymbol: settings.currency_symbol || '₹',
          amountInWords: BillingCalculationEngine.amountToWords(sale.total),
          sale,
          items,
          payments,
        },
      };
    } catch (error: any) {
      log.error('Invoice data error:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}
