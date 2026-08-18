import Database from 'better-sqlite3';
import { LeaveRepository, HolidayRow } from '../repositories/leaveRepository';
import { AuditRepository } from '../repositories/auditRepository';

export class HolidayService {
  private leaveRepo: LeaveRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.leaveRepo = new LeaveRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  getHolidays(includeInactive: boolean = false): HolidayRow[] {
    return this.leaveRepo.getAllHolidays(includeInactive);
  }

  createHoliday(input: {
    name: string;
    holiday_date: string;
    type?: 'PUBLIC' | 'SHOP' | 'OPTIONAL' | 'SPECIAL';
    description?: string;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Holiday name is required.' };
    }
    if (!input.holiday_date) {
      return { success: false, error: 'Holiday date is required.' };
    }

    const existing = this.leaveRepo.getHolidayByDate(input.holiday_date);
    if (existing) {
      return { success: false, error: `A holiday (${existing.name}) is already scheduled on ${input.holiday_date}.` };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.leaveRepo.createHoliday({
      name: input.name,
      holiday_date: input.holiday_date,
      type: input.type,
      description: input.description,
      created_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'HOLIDAY_CREATED',
      entity_type: 'HOLIDAY',
      entity_id: id,
      new_value: `Created holiday '${input.name}' on ${input.holiday_date}`,
    });

    return { success: true, id };
  }

  deleteHoliday(id: number, actorUserId?: number): { success: boolean; error?: string } {
    this.leaveRepo.deleteHoliday(id);

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'HOLIDAY_DELETED',
      entity_type: 'HOLIDAY',
      entity_id: id,
      new_value: `Removed holiday #${id}`,
    });

    return { success: true };
  }
}
