import Database from 'better-sqlite3';
import { CustomerRepository } from '../repositories/customerRepository';
import { SaleRepository, SaleRow } from '../repositories/saleRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  credit_limit?: number;
}

export class CustomerService {
  private customerRepo: CustomerRepository;
  private saleRepo: SaleRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.customerRepo = new CustomerRepository(db);
    this.saleRepo = new SaleRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  generateCustomerCode(): string {
    const countRow: any = this.db.prepare('SELECT COUNT(*) as count FROM customers').get();
    const seq = String((countRow?.count || 0) + 1).padStart(6, '0');
    return `CUS-${seq}`;
  }

  createCustomer(input: CreateCustomerInput, actorUserId?: number): { success: boolean; id?: number; code?: string; error?: string } {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: 'Customer Name is required.' };
    }

    try {
      const code = this.generateCustomerCode();
      const id = this.customerRepo.create({
        customer_code: code,
        name: input.name.trim(),
        phone: input.phone?.trim() || undefined,
        email: input.email?.trim() || undefined,
        address: input.address?.trim() || undefined,
        city: input.city?.trim() || undefined,
        state: input.state?.trim() || undefined,
        pincode: input.pincode?.trim() || undefined,
        gst_number: input.gst_number?.trim() || undefined,
        credit_limit: input.credit_limit ?? 0,
      });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'CREATE_CUSTOMER',
        entity_type: 'CUSTOMER',
        entity_id: id,
        new_value: `Created Customer ${input.name} (${code})`,
      });

      return { success: true, id, code };
    } catch (error: any) {
      log.error('Failed to create customer:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  updateCustomer(id: number, input: Partial<CreateCustomerInput>, actorUserId?: number): { success: boolean; error?: string } {
    try {
      this.customerRepo.update(id, input);
      this.auditRepo.log({
        user_id: actorUserId,
        action: 'UPDATE_CUSTOMER',
        entity_type: 'CUSTOMER',
        entity_id: id,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }

  getCustomerProfile(id: number): { success: boolean; customer?: any; purchases?: SaleRow[]; error?: string } {
    try {
      const customer = this.customerRepo.getById(id);
      if (!customer) return { success: false, error: 'Customer not found.' };

      const purchases = this.db.prepare(`
        SELECT * FROM sales WHERE customer_id = ? ORDER BY id DESC
      `).all(id) as SaleRow[];

      return { success: true, customer, purchases };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }

  receiveCustomerPayment(customerId: number, amount: number, paymentMethod: string, actorUserId?: number): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than 0.' };

    try {
      const transaction = this.db.transaction(() => {
        // Record Customer Payment log
        this.db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
          VALUES (?, 'CUSTOMER_PAYMENT', 'CUSTOMER', ?, NULL, ?)
        `).run(actorUserId || null, customerId, `Received Payment ₹${amount} via ${paymentMethod}`);

        return true;
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }
}
