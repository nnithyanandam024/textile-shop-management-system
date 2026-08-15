import Database from 'better-sqlite3';
import { ExpenseRepository, ExpenseRow } from '../repositories/expenseRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

export interface CreateExpenseInput {
  category_id?: number;
  category_name?: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  description?: string;
  expense_date?: string;
  created_by?: number;
}

export class ExpenseService {
  private expenseRepo: ExpenseRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.expenseRepo = new ExpenseRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  createExpense(input: CreateExpenseInput): { success: boolean; id?: number; expenseNumber?: string; error?: string } {
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: 'Expense amount must be greater than 0.' };
    }

    try {
      const transaction = this.db.transaction(() => {
        const category = input.category_name || 'Rent';
        const id = this.expenseRepo.create({
          category,
          description: input.description || undefined,
          amount: input.amount,
          payment_method: input.payment_method || 'CASH',
          created_by: input.created_by,
        });

        const expenseNumber = `EXP-${id}`;

        // Audit Log
        this.auditRepo.log({
          user_id: input.created_by,
          action: 'CREATE_EXPENSE',
          entity_type: 'EXPENSE',
          entity_id: id,
          new_value: `Recorded Expense ${category} ₹${input.amount} (${input.payment_method})`,
        });

        return { id, expenseNumber };
      });

      const res = transaction();
      return { success: true, id: res.id, expenseNumber: res.expenseNumber };
    } catch (error: any) {
      log.error('Failed to create expense:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  getAllExpenses(): ExpenseRow[] {
    return this.expenseRepo.getAll();
  }

  cancelExpense(expenseId: number, actorUserId?: number): { success: boolean; error?: string } {
    try {
      const transaction = this.db.transaction(() => {
        this.auditRepo.log({
          user_id: actorUserId,
          action: 'EXPENSE_CANCELLED',
          entity_type: 'EXPENSE',
          entity_id: expenseId,
          new_value: 'Cancelled expense entry',
        });

        return true;
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      log.error('Failed to cancel expense:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
}
