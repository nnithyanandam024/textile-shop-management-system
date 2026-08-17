import Database from 'better-sqlite3';
import { StaffHistoryRepository, StaffEmploymentHistoryRow } from '../repositories/staffHistoryRepository';
import { StaffRepository } from '../repositories/staffRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface RecordEmploymentChangeInput {
  staff_id: number;
  department_id: number;
  designation_id: number;
  manager_id?: number;
  employment_type: string;
  effective_from: string;
  reason?: string;
}

export class EmploymentHistoryService {
  private historyRepo: StaffHistoryRepository;
  private staffRepo: StaffRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.historyRepo = new StaffHistoryRepository(db);
    this.staffRepo = new StaffRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getHistory(staffId: number): StaffEmploymentHistoryRow[] {
    return this.historyRepo.getByStaffId(staffId);
  }

  recordChange(input: RecordEmploymentChangeInput, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    const staff = this.staffRepo.getById(input.staff_id);
    if (!staff) return { success: false, error: 'Staff member not found.' };

    // Close previous history record
    this.historyRepo.closePreviousHistory(input.staff_id, input.effective_from);

    // Create new history record
    const historyId = this.historyRepo.create({
      staff_id: input.staff_id,
      department_id: input.department_id,
      designation_id: input.designation_id,
      manager_id: input.manager_id,
      employment_type: input.employment_type,
      effective_from: input.effective_from,
      reason: input.reason || 'Role / Department Update',
      created_by: actorUserId,
    });

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_EMPLOYMENT_CHANGED',
      entity_type: 'STAFF',
      entity_id: input.staff_id,
      new_value: `Employment change recorded: Effective ${input.effective_from} (${input.reason || 'Update'})`,
    });

    return { success: true, id: historyId };
  }
}
