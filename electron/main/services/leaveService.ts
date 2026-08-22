import Database from 'better-sqlite3';
import { LeaveRepository, LeaveTypeRow, LeaveBalanceRow, LeaveRequestRow } from '../repositories/leaveRepository';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { eventBus } from '../realtime/eventBus';

export class LeaveService {
  private leaveRepo: LeaveRepository;
  private attRepo: AttendanceRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.leaveRepo = new LeaveRepository(db);
    this.attRepo = new AttendanceRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  // --- LEAVE TYPES ---
  getLeaveTypes(includeInactive: boolean = false): LeaveTypeRow[] {
    return this.leaveRepo.getAllLeaveTypes(includeInactive);
  }

  getLeaveTypeById(id: number): LeaveTypeRow | undefined {
    return this.leaveRepo.getLeaveTypeById(id);
  }

  createLeaveType(input: {
    leave_code: string;
    name: string;
    description?: string;
    paid?: boolean;
    requires_approval?: boolean;
    requires_document?: boolean;
    annual_allocation?: number;
    carry_forward_allowed?: boolean;
    max_carry_forward?: number;
    max_consecutive_days?: number;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.leave_code || input.leave_code.trim() === '') {
      return { success: false, error: 'Leave code is required.' };
    }
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Leave type name is required.' };
    }

    const existing = this.leaveRepo.getLeaveTypeByCode(input.leave_code);
    if (existing) {
      return { success: false, error: `Leave code '${input.leave_code}' already exists.` };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.leaveRepo.createLeaveType(input);

    this.auditRepo.log({
      user_id: validActor,
      action: 'LEAVE_TYPE_CREATED',
      entity_type: 'LEAVE_TYPE',
      entity_id: id,
      new_value: `Created leave type ${input.leave_code} - ${input.name}`,
    });

    return { success: true, id };
  }

  updateLeaveType(id: number, input: Partial<LeaveTypeRow>, actorUserId?: number): { success: boolean; error?: string } {
    const existing = this.leaveRepo.getLeaveTypeById(id);
    if (!existing) {
      return { success: false, error: 'Leave type not found.' };
    }

    this.leaveRepo.updateLeaveType(id, input);

    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'LEAVE_TYPE_UPDATED',
      entity_type: 'LEAVE_TYPE',
      entity_id: id,
      new_value: `Updated leave type #${id}`,
    });

    return { success: true };
  }

  // --- LEAVE BALANCES ---
  getStaffBalances(staffId: number, year?: number): LeaveBalanceRow[] {
    const yr = year || new Date().getFullYear();
    this.initializeStaffBalances(staffId, yr);
    return this.leaveRepo.getStaffBalances(staffId, yr);
  }

  initializeStaffBalances(staffId: number, year: number): void {
    const leaveTypes = this.leaveRepo.getAllLeaveTypes(false);
    for (const lt of leaveTypes) {
      const existing = this.leaveRepo.getBalance(staffId, lt.id, year);
      if (!existing) {
        // Carry forward from previous year if allowed
        let carryForward = 0;
        if (lt.carry_forward_allowed) {
          const prevBal = this.leaveRepo.getBalance(staffId, lt.id, year - 1);
          if (prevBal && prevBal.available_days && prevBal.available_days > 0) {
            carryForward = Math.min(prevBal.available_days, lt.max_carry_forward || 99);
          }
        }

        this.leaveRepo.createOrUpdateBalance({
          staff_id: staffId,
          leave_type_id: lt.id,
          year,
          allocated_days: lt.annual_allocation,
          carry_forward_days: carryForward,
          used_days: 0,
          adjustment_days: 0,
        });
      }
    }
  }

  adjustBalance(input: {
    staff_id: number;
    leave_type_id: number;
    year: number;
    adjustment_days: number;
    reason: string;
  }, actorUserId?: number): { success: boolean; error?: string } {
    if (!input.reason || input.reason.trim() === '') {
      return { success: false, error: 'Reason for leave balance adjustment is required.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.initializeStaffBalances(input.staff_id, input.year);

    this.leaveRepo.updateAdjustmentDays(input.staff_id, input.leave_type_id, input.year, input.adjustment_days);
    const id = this.leaveRepo.createAdjustment({
      staff_id: input.staff_id,
      leave_type_id: input.leave_type_id,
      year: input.year,
      adjustment_days: input.adjustment_days,
      reason: input.reason,
      created_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'LEAVE_BALANCE_ADJUSTED',
      entity_type: 'LEAVE_BALANCE',
      entity_id: id,
      new_value: `Adjusted leave balance for staff #${input.staff_id}: ${input.adjustment_days > 0 ? '+' : ''}${input.adjustment_days} days (${input.reason})`,
    });

    return { success: true };
  }

  // --- LEAVE REQUESTS & APPLICATION ---
  applyLeave(input: {
    staff_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    duration_type?: 'FULL_DAY' | 'HALF_DAY';
    session?: 'MORNING' | 'AFTERNOON';
    reason: string;
    attachment_path?: string;
  }): { success: boolean; id?: number; error?: string } {
    if (!input.start_date || !input.end_date) {
      return { success: false, error: 'Start date and end date are required.' };
    }
    if (input.start_date > input.end_date) {
      return { success: false, error: 'Start date cannot be later than end date.' };
    }
    if (!input.reason || input.reason.trim() === '') {
      return { success: false, error: 'Reason for leave is required.' };
    }

    const leaveType = this.leaveRepo.getLeaveTypeById(input.leave_type_id);
    if (!leaveType || leaveType.status !== 'ACTIVE') {
      return { success: false, error: 'Selected leave type is inactive or invalid.' };
    }

    // Overlap validation
    const hasOverlap = this.leaveRepo.checkOverlappingRequest(input.staff_id, input.start_date, input.end_date);
    if (hasOverlap) {
      return { success: false, error: 'Staff member already has a pending or approved leave on these dates.' };
    }

    // Calculate duration days
    let durationDays = 1.0;
    if (input.duration_type === 'HALF_DAY') {
      durationDays = 0.5;
    } else {
      const d1 = new Date(input.start_date);
      const d2 = new Date(input.end_date);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check balance for paid leave types
    const year = new Date(input.start_date).getFullYear();
    this.initializeStaffBalances(input.staff_id, year);
    const balance = this.leaveRepo.getBalance(input.staff_id, input.leave_type_id, year);

    if (leaveType.paid && balance && balance.available_days !== undefined) {
      if (balance.available_days < durationDays) {
        return {
          success: false,
          error: `Insufficient ${leaveType.name} balance. Available: ${balance.available_days} days, Requested: ${durationDays} days.`,
        };
      }
    }

    const id = this.leaveRepo.createRequest({
      staff_id: input.staff_id,
      leave_type_id: input.leave_type_id,
      start_date: input.start_date,
      end_date: input.end_date,
      duration_days: durationDays,
      duration_type: input.duration_type || 'FULL_DAY',
      session: input.session,
      reason: input.reason,
      attachment_path: input.attachment_path,
    });

    this.auditRepo.log({
      action: 'LEAVE_REQUEST_CREATED',
      entity_type: 'LEAVE_REQUEST',
      entity_id: id,
      new_value: `Applied for ${durationDays} days of ${leaveType.name} (${input.start_date} to ${input.end_date})`,
    });

    return { success: true, id };
  }

  getRequests(filters?: { staffId?: number; status?: string; leaveTypeId?: number; search?: string }): LeaveRequestRow[] {
    return this.leaveRepo.getRequests(filters);
  }

  // --- APPROVAL WORKFLOW ---
  approveLeave(requestId: number, actorUserId: number): { success: boolean; error?: string } {
    const req = this.leaveRepo.getRequestById(requestId);
    if (!req || req.status !== 'PENDING') {
      return { success: false, error: 'Pending leave request not found.' };
    }

    const year = new Date(req.start_date).getFullYear();
    this.leaveRepo.updateUsedDays(req.staff_id, req.leave_type_id, year, req.duration_days);

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.leaveRepo.updateRequestStatus(requestId, 'APPROVED', { approved_by: validActor });

    // Integrate with Attendance table for target date range
    const start = new Date(req.start_date);
    const end = new Date(req.end_date);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingAtt = this.attRepo.findByStaffAndDate(req.staff_id, dateStr);

      if (existingAtt) {
        this.attRepo.update(existingAtt.id, {
          status: req.duration_type === 'HALF_DAY' ? 'HALF_DAY' : 'PRESENT',
          remarks: `Approved ${req.leave_name} Leave (#${req.id})`,
        });
        this.db.prepare('UPDATE attendance SET leave_request_id = ? WHERE id = ?').run(req.id, existingAtt.id);
      } else {
        const newId = this.attRepo.create({
          staff_id: req.staff_id,
          attendance_date: dateStr,
          status: req.duration_type === 'HALF_DAY' ? 'HALF_DAY' : 'PRESENT',
          remarks: `Approved ${req.leave_name} Leave (#${req.id})`,
          source: 'ADMIN_ENTRY',
          created_by: validActor,
        });
        this.db.prepare('UPDATE attendance SET leave_request_id = ? WHERE id = ?').run(req.id, newId);
      }
    }

    this.auditRepo.log({
      user_id: validActor,
      action: 'LEAVE_APPROVED',
      entity_type: 'LEAVE_REQUEST',
      entity_id: requestId,
      new_value: `Approved leave request #${requestId} for staff #${req.staff_id}`,
    });

    try {
      const staffFullName = [req.first_name, req.last_name].filter(Boolean).join(' ') || 'Staff Member';
      eventBus.publish('LEAVE_APPROVED', {
        leaveRequestId: requestId,
        staffId: req.staff_id,
        staffName: staffFullName,
        startDate: req.start_date,
        endDate: req.end_date,
        leaveType: req.leave_name || 'Leave',
        status: 'APPROVED',
      }, {
        actorUserId: validActor,
        targetStaffId: req.staff_id,
      });
    } catch {}

    return { success: true };
  }

  rejectLeave(requestId: number, rejectionReason: string, actorUserId: number): { success: boolean; error?: string } {
    if (!rejectionReason || rejectionReason.trim() === '') {
      return { success: false, error: 'Rejection reason is required.' };
    }

    const req = this.leaveRepo.getRequestById(requestId);
    if (!req || req.status !== 'PENDING') {
      return { success: false, error: 'Pending leave request not found.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.leaveRepo.updateRequestStatus(requestId, 'REJECTED', { rejection_reason: rejectionReason.trim() });

    this.auditRepo.log({
      user_id: validActor,
      action: 'LEAVE_REJECTED',
      entity_type: 'LEAVE_REQUEST',
      entity_id: requestId,
      new_value: `Rejected leave request #${requestId}: ${rejectionReason}`,
    });

    try {
      const staffFullName = [req.first_name, req.last_name].filter(Boolean).join(' ') || 'Staff Member';
      eventBus.publish('LEAVE_REJECTED', {
        leaveRequestId: requestId,
        staffId: req.staff_id,
        staffName: staffFullName,
        startDate: req.start_date,
        endDate: req.end_date,
        leaveType: req.leave_name || 'Leave',
        status: 'REJECTED',
      }, {
        actorUserId: validActor,
        targetStaffId: req.staff_id,
      });
    } catch {}

    return { success: true };
  }

  cancelLeave(requestId: number, actorUserId?: number): { success: boolean; error?: string } {
    const req = this.leaveRepo.getRequestById(requestId);
    if (!req || (req.status !== 'PENDING' && req.status !== 'APPROVED')) {
      return { success: false, error: 'Only pending or approved leave requests can be cancelled.' };
    }

    const validActor = this.sanitizeActorUserId(actorUserId);

    // If approved, restore balance and unlink attendance
    if (req.status === 'APPROVED') {
      const year = new Date(req.start_date).getFullYear();
      this.leaveRepo.updateUsedDays(req.staff_id, req.leave_type_id, year, -req.duration_days);

      this.db.prepare('UPDATE attendance SET leave_request_id = NULL WHERE leave_request_id = ?').run(requestId);
    }

    this.leaveRepo.updateRequestStatus(requestId, 'CANCELLED', { cancelled_by: validActor });

    this.auditRepo.log({
      user_id: validActor,
      action: 'LEAVE_CANCELLED',
      entity_type: 'LEAVE_REQUEST',
      entity_id: requestId,
      new_value: `Cancelled leave request #${requestId}`,
    });

    return { success: true };
  }
}
