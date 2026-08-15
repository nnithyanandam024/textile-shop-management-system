import Database from 'better-sqlite3';
import { SupplierRepository } from '../repositories/supplierRepository';
import { PurchaseRepository, PurchaseRow } from '../repositories/purchaseRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreateSupplierInput {
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
}

export class SupplierService {
  private supplierRepo: SupplierRepository;
  private purchaseRepo: PurchaseRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.supplierRepo = new SupplierRepository(db);
    this.purchaseRepo = new PurchaseRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  generateSupplierCode(): string {
    const countRow: any = this.db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
    const seq = String((countRow?.count || 0) + 1).padStart(6, '0');
    return `SUP-${seq}`;
  }

  createSupplier(input: CreateSupplierInput, actorUserId?: number): { success: boolean; id?: number; code?: string; error?: string } {
    if (!input.company_name || !input.company_name.trim()) {
      return { success: false, error: 'Company Name is required.' };
    }

    try {
      const code = this.generateSupplierCode();
      const id = this.supplierRepo.create({
        supplier_code: code,
        company_name: input.company_name.trim(),
        contact_person: input.contact_person?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        email: input.email?.trim() || undefined,
        address: input.address?.trim() || undefined,
        city: input.city?.trim() || undefined,
        state: input.state?.trim() || undefined,
        pincode: input.pincode?.trim() || undefined,
        gst_number: input.gst_number?.trim() || undefined,
      });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'CREATE_SUPPLIER',
        entity_type: 'SUPPLIER',
        entity_id: id,
        new_value: `Created Supplier ${input.company_name} (${code})`,
      });

      return { success: true, id, code };
    } catch (error: any) {
      log.error('Failed to create supplier:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  updateSupplier(id: number, input: Partial<CreateSupplierInput>, actorUserId?: number): { success: boolean; error?: string } {
    try {
      this.supplierRepo.update(id, input);
      this.auditRepo.log({
        user_id: actorUserId,
        action: 'UPDATE_SUPPLIER',
        entity_type: 'SUPPLIER',
        entity_id: id,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }

  getSupplierProfile(id: number): { success: boolean; supplier?: any; purchases?: PurchaseRow[]; error?: string } {
    try {
      const supplier = this.supplierRepo.getById(id);
      if (!supplier) return { success: false, error: 'Supplier not found.' };

      const purchases = this.db.prepare(`
        SELECT * FROM purchases WHERE supplier_id = ? ORDER BY id DESC
      `).all(id) as PurchaseRow[];

      return { success: true, supplier, purchases };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }

  makeSupplierPayment(supplierId: number, amount: number, paymentMethod: string, actorUserId?: number): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than 0.' };

    try {
      const transaction = this.db.transaction(() => {
        this.db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
          VALUES (?, 'SUPPLIER_PAYMENT', 'SUPPLIER', ?, NULL, ?)
        `).run(actorUserId || null, supplierId, `Made Payment ₹${amount} via ${paymentMethod}`);

        return true;
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }
}
