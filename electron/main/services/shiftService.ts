import Database from 'better-sqlite3';
import { ShiftRepository, ShiftTemplateRow, StaffShiftAssignmentRow, StaffScheduleDayRow, StaffShiftOverrideRow } from '../repositories/shiftRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface ResolvedShift {
  template: ShiftTemplateRow;
  isWeekOff: boolean;
  source: 'OVERRIDE' | 'SCHEDULE' | 'ASSIGNMENT' | 'DEFAULT';
  overrideReason?: string;
}

export class ShiftService {
  private shiftRepo: ShiftRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.shiftRepo = new ShiftRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  // --- TEMPLATES ---
  getTemplates(includeInactive: boolean = false): ShiftTemplateRow[] {
    return this.shiftRepo.getAllTemplates(includeInactive);
  }

  getTemplateById(id: number): ShiftTemplateRow | undefined {
    return this.shiftRepo.getTemplateById(id);
  }

  createTemplate(input: {
    shift_code: string;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes?: number;
    break_minutes?: number;
    minimum_work_minutes?: number;
    is_overnight?: boolean;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.shift_code || input.shift_code.trim() === '') {
      return { success: false, error: 'Shift code is required.' };
    }
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Shift name is required.' };
    }
    if (!input.start_time || !input.end_time) {
      return { success: false, error: 'Start time and end time are required.' };
    }

    const existing = this.shiftRepo.getTemplateByCode(input.shift_code);
    if (existing) {
      return { success: false, error: `Shift code '${input.shift_code}' already exists.` };
    }

    const id = this.shiftRepo.createTemplate(input);

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'SHIFT_CREATED',
      entity_type: 'SHIFT_TEMPLATE',
      entity_id: id,
      new_value: `Created shift ${input.shift_code} - ${input.name} (${input.start_time} - ${input.end_time})`,
    });

    return { success: true, id };
  }

  updateTemplate(id: number, input: {
    name?: string;
    start_time?: string;
    end_time?: string;
    grace_minutes?: number;
    break_minutes?: number;
    minimum_work_minutes?: number;
    is_overnight?: boolean;
  }, actorUserId?: number): { success: boolean; error?: string } {
    const existing = this.shiftRepo.getTemplateById(id);
    if (!existing) {
      return { success: false, error: 'Shift template not found.' };
    }

    this.shiftRepo.updateTemplate(id, input);

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'SHIFT_UPDATED',
      entity_type: 'SHIFT_TEMPLATE',
      entity_id: id,
      old_value: `${existing.name} (${existing.start_time} - ${existing.end_time})`,
      new_value: `Updated shift template #${id}`,
    });

    return { success: true };
  }

  deactivateTemplate(id: number, actorUserId?: number): { success: boolean; error?: string } {
    const existing = this.shiftRepo.getTemplateById(id);
    if (!existing) {
      return { success: false, error: 'Shift template not found.' };
    }

    this.shiftRepo.updateTemplateStatus(id, 'INACTIVE');

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'SHIFT_DEACTIVATED',
      entity_type: 'SHIFT_TEMPLATE',
      entity_id: id,
      new_value: `Deactivated shift template ${existing.shift_code}`,
    });

    return { success: true };
  }

  // --- STAFF ASSIGNMENTS ---
  assignShift(input: {
    staff_id: number;
    shift_template_id: number;
    effective_from: string;
    reason?: string;
  }, actorUserId?: number): { success: boolean; error?: string } {
    const template = this.shiftRepo.getTemplateById(input.shift_template_id);
    if (!template || template.status !== 'ACTIVE') {
      return { success: false, error: 'Target shift template is inactive or does not exist.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);

    // Close previous assignment
    this.shiftRepo.closePreviousAssignments(input.staff_id, input.effective_from);

    const id = this.shiftRepo.createAssignment({
      staff_id: input.staff_id,
      shift_template_id: input.shift_template_id,
      effective_from: input.effective_from,
      reason: input.reason,
      assigned_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'SHIFT_ASSIGNED',
      entity_type: 'STAFF_SHIFT',
      entity_id: id,
      new_value: `Assigned shift ${template.name} to staff #${input.staff_id} effective from ${input.effective_from}`,
    });

    return { success: true };
  }

  getStaffShiftHistory(staffId: number): StaffShiftAssignmentRow[] {
    return this.shiftRepo.getAssignmentHistory(staffId);
  }

  // --- WEEKLY SCHEDULE ---
  getWeeklySchedule(staffId: number, dateStr?: string): StaffScheduleDayRow[] {
    const d = dateStr || new Date().toISOString().split('T')[0];
    return this.shiftRepo.getWeeklySchedule(staffId, d);
  }

  setWeeklySchedule(staffId: number, scheduleDays: {
    day_of_week: number;
    shift_template_id?: number;
    is_week_off: boolean;
    effective_from: string;
  }[], actorUserId?: number): { success: boolean; error?: string } {
    const validActor = this.sanitizeActorUserId(actorUserId);
    this.shiftRepo.setWeeklySchedule(staffId, scheduleDays, validActor);

    this.auditRepo.log({
      user_id: validActor,
      action: 'SHIFT_SCHEDULE_UPDATED',
      entity_type: 'STAFF_SCHEDULE',
      entity_id: staffId,
      new_value: `Updated weekly work schedule for staff #${staffId}`,
    });

    return { success: true };
  }

  // --- OVERRIDES ---
  createOverride(input: {
    staff_id: number;
    override_date: string;
    shift_template_id?: number;
    is_week_off?: boolean;
    reason: string;
  }, actorUserId?: number): { success: boolean; error?: string } {
    if (!input.reason || input.reason.trim() === '') {
      return { success: false, error: 'Reason for temporary shift override is required.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.shiftRepo.createOverride({
      staff_id: input.staff_id,
      override_date: input.override_date,
      shift_template_id: input.shift_template_id,
      is_week_off: input.is_week_off,
      reason: input.reason,
      created_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'SHIFT_OVERRIDE_CREATED',
      entity_type: 'SHIFT_OVERRIDE',
      entity_id: id,
      new_value: `Created shift override for staff #${input.staff_id} on ${input.override_date}: ${input.reason}`,
    });

    return { success: true };
  }

  deleteOverride(id: number, actorUserId?: number): { success: boolean; error?: string } {
    this.shiftRepo.deleteOverride(id);

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'SHIFT_OVERRIDE_REMOVED',
      entity_type: 'SHIFT_OVERRIDE',
      entity_id: id,
      new_value: `Removed temporary shift override #${id}`,
    });

    return { success: true };
  }

  getOverridesForPeriod(startDate: string, endDate: string): StaffShiftOverrideRow[] {
    return this.shiftRepo.getOverridesForPeriod(startDate, endDate);
  }

  // --- SHIFT RESOLUTION HIERARCHY ---
  resolveStaffShiftForDate(staffId: number, dateStr: string): ResolvedShift {
    // 1. Temporary Single-Day Override
    const override = this.shiftRepo.getOverrideForDate(staffId, dateStr);
    if (override) {
      if (override.is_week_off) {
        return {
          template: this.getDefaultShift(),
          isWeekOff: true,
          source: 'OVERRIDE',
          overrideReason: override.reason,
        };
      } else if (override.shift_template_id) {
        const t = this.shiftRepo.getTemplateById(override.shift_template_id);
        if (t) {
          return {
            template: t,
            isWeekOff: false,
            source: 'OVERRIDE',
            overrideReason: override.reason,
          };
        }
      }
    }

    // 2. Daily Weekly Schedule
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay(); // 0=Sunday, 6=Saturday
    const weeklySched = this.shiftRepo.getWeeklySchedule(staffId, dateStr);
    const daySched = weeklySched.find((s) => s.day_of_week === dayOfWeek);

    if (daySched) {
      if (daySched.is_week_off) {
        return {
          template: this.getDefaultShift(),
          isWeekOff: true,
          source: 'SCHEDULE',
        };
      } else if (daySched.shift_template_id) {
        const t = this.shiftRepo.getTemplateById(daySched.shift_template_id);
        if (t) {
          return {
            template: t,
            isWeekOff: false,
            source: 'SCHEDULE',
          };
        }
      }
    }

    // 3. Regular Staff Shift Assignment
    const assignment = this.shiftRepo.getCurrentAssignment(staffId, dateStr);
    if (assignment) {
      const t = this.shiftRepo.getTemplateById(assignment.shift_template_id);
      if (t) {
        // Sunday default week-off if dayOfWeek === 0
        const isSun = dayOfWeek === 0;
        return {
          template: t,
          isWeekOff: isSun,
          source: 'ASSIGNMENT',
        };
      }
    }

    // 4. Default Shift (SFT-002 General Shift)
    const isSun = dayOfWeek === 0;
    return {
      template: this.getDefaultShift(),
      isWeekOff: isSun,
      source: 'DEFAULT',
    };
  }

  private getDefaultShift(): ShiftTemplateRow {
    const templates = this.shiftRepo.getAllTemplates(true);
    const general = templates.find((t) => t.shift_code === 'SFT-002' || t.name.toLowerCase().includes('general'));
    if (general) return general;
    if (templates.length > 0) return templates[0];
    return {
      id: 1,
      shift_code: 'SFT-002',
      name: 'General Shift',
      start_time: '09:00',
      end_time: '18:00',
      grace_minutes: 10,
      break_minutes: 60,
      minimum_work_minutes: 480,
      is_overnight: 0,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
