import Database from 'better-sqlite3';

export interface StaffBankDetailsRow {
  id: number;
  staff_id: number;
  bank_name: string;
  account_holder_name: string;
  account_number_encrypted: string;
  ifsc: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export class StaffBankRepository {
  constructor(private db: Database.Database) {}

  getByStaffId(staffId: number): StaffBankDetailsRow | undefined {
    return this.db.prepare('SELECT * FROM staff_bank_details WHERE staff_id = ?').get(staffId) as StaffBankDetailsRow | undefined;
  }

  save(details: {
    staff_id: number;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc: string;
    payment_method?: string;
  }): void {
    const existing = this.getByStaffId(details.staff_id);
    if (existing) {
      this.db.prepare(`
        UPDATE staff_bank_details 
        SET bank_name = ?, account_holder_name = ?, account_number_encrypted = ?, ifsc = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP
        WHERE staff_id = ?
      `).run(
        details.bank_name.trim(),
        details.account_holder_name.trim(),
        details.account_number.trim(),
        details.ifsc.trim().toUpperCase(),
        details.payment_method || 'Bank Transfer',
        details.staff_id
      );
    } else {
      this.db.prepare(`
        INSERT INTO staff_bank_details (staff_id, bank_name, account_holder_name, account_number_encrypted, ifsc, payment_method)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        details.staff_id,
        details.bank_name.trim(),
        details.account_holder_name.trim(),
        details.account_number.trim(),
        details.ifsc.trim().toUpperCase(),
        details.payment_method || 'Bank Transfer'
      );
    }
  }

  static maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';
    const clean = accountNumber.trim();
    if (clean.length <= 4) return '••••' + clean;
    const last4 = clean.slice(-4);
    return '••••••••' + last4;
  }
}
