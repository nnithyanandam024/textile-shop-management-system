import Database from 'better-sqlite3';
import { StaffBankRepository, StaffBankDetailsRow } from '../repositories/staffBankRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface SaveBankDetailsInput {
  staff_id: number;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc: string;
  payment_method?: string;
}

export class StaffBankService {
  private repo: StaffBankRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.repo = new StaffBankRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getBankDetails(staffId: number, revealFull: boolean = false): (StaffBankDetailsRow & { masked_account_number: string }) | undefined {
    const raw = this.repo.getByStaffId(staffId);
    if (!raw) return undefined;

    const masked = StaffBankRepository.maskAccountNumber(raw.account_number_encrypted);
    return {
      ...raw,
      masked_account_number: masked,
      // If revealFull is false, hide full account number
      account_number_encrypted: revealFull ? raw.account_number_encrypted : masked,
    };
  }

  saveBankDetails(input: SaveBankDetailsInput, actorUserId?: number): { success: boolean; error?: string } {
    if (!input.bank_name || input.bank_name.trim() === '') {
      return { success: false, error: 'Bank name is required.' };
    }
    if (!input.account_holder_name || input.account_holder_name.trim() === '') {
      return { success: false, error: 'Account holder name is required.' };
    }
    if (!input.account_number || input.account_number.trim() === '') {
      return { success: false, error: 'Account number is required.' };
    }
    if (!/^\d{8,20}$/.test(input.account_number.trim())) {
      return { success: false, error: 'Account number must contain 8 to 20 digits.' };
    }
    if (!input.ifsc || input.ifsc.trim() === '') {
      return { success: false, error: 'IFSC code is required.' };
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifsc.trim().toUpperCase())) {
      return { success: false, error: 'Invalid IFSC code format (e.g. SBIN0001234).' };
    }

    this.repo.save({
      staff_id: input.staff_id,
      bank_name: input.bank_name,
      account_holder_name: input.account_holder_name,
      account_number: input.account_number,
      ifsc: input.ifsc,
      payment_method: input.payment_method,
    });

    const masked = StaffBankRepository.maskAccountNumber(input.account_number);
    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_BANK_DETAILS_UPDATED',
      entity_type: 'STAFF',
      entity_id: input.staff_id,
      new_value: `Updated Bank Setup: ${input.bank_name.trim()} (Account ${masked})`,
    });

    return { success: true };
  }
}
