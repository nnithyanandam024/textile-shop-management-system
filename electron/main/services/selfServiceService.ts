import Database from 'better-sqlite3';
import { SelfServiceRepository } from '../repositories/selfServiceRepository';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { LeaveRepository } from '../repositories/leaveRepository';
import { LeaveService } from './leaveService';
import { PayrollRepository } from '../repositories/payrollRepository';
import { DocumentRepository } from '../repositories/documentRepository';
import { PerformanceRepository } from '../repositories/performanceRepository';
import { AuditRepository } from '../repositories/auditRepository';

export class SelfServiceService {
  private selfRepo: SelfServiceRepository;
  private attRepo: AttendanceRepository;
  private leaveRepo: LeaveRepository;
  private leaveService: LeaveService;
  private payrollRepo: PayrollRepository;
  private docRepo: DocumentRepository;
  private perfRepo: PerformanceRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.selfRepo = new SelfServiceRepository(db);
    this.attRepo = new AttendanceRepository(db);
    this.leaveRepo = new LeaveRepository(db);
    this.leaveService = new LeaveService(db);
    this.payrollRepo = new PayrollRepository(db);
    this.docRepo = new DocumentRepository(db);
    this.perfRepo = new PerformanceRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private getStaffIdOrThrow(userId: number): number {
    const staff = this.selfRepo.getStaffByUserId(userId);
    if (!staff) {
      throw new Error('ACCESS DENIED: No active employee profile bound to this account.');
    }
    return staff.id;
  }

  // --- DASHBOARD & PROFILE ---
  getDashboard(userId: number): any {
    return this.selfRepo.getDashboardSummary(userId);
  }

  getMyProfile(userId: number): any {
    return this.selfRepo.getStaffByUserId(userId);
  }

  updateMyProfile(userId: number, fields: any): { success: boolean; error?: string } {
    const staffId = this.getStaffIdOrThrow(userId);
    this.selfRepo.updateAllowedProfileFields(staffId, fields);
    this.auditRepo.log({
      user_id: userId,
      action: 'SELF_PROFILE_UPDATED',
      entity_type: 'STAFF',
      entity_id: staffId,
      new_value: JSON.stringify(fields),
    });
    return { success: true };
  }

  requestProfileChange(userId: number, input: {
    field_name: string;
    old_value?: string;
    new_value: string;
    reason: string;
  }): { success: boolean; id?: number; error?: string } {
    const staffId = this.getStaffIdOrThrow(userId);
    if (!input.field_name || !input.new_value || !input.reason) {
      return { success: false, error: 'Field name, new value, and reason are required.' };
    }
    const id = this.selfRepo.createProfileChangeRequest({
      staff_id: staffId,
      field_name: input.field_name,
      old_value: input.old_value,
      new_value: input.new_value,
      reason: input.reason,
    });
    return { success: true, id };
  }

  getProfileChangeRequests(userId: number): any[] {
    const staffId = this.getStaffIdOrThrow(userId);
    return this.selfRepo.getProfileChangeRequests(staffId);
  }

  // --- ATTENDANCE ---
  getMyAttendance(userId: number, month?: string, year?: number): any[] {
    const staffId = this.getStaffIdOrThrow(userId);
    if (year && month) {
      return this.attRepo.findByMonth(year, Number(month), staffId);
    }
    return this.attRepo.findByStaff(staffId, 60);
  }

  requestAttendanceCorrection(userId: number, input: {
    attendance_id?: number;
    date: string;
    requested_check_in?: string;
    requested_check_out?: string;
    reason: string;
  }): { success: boolean; id?: number; error?: string } {
    const staffId = this.getStaffIdOrThrow(userId);
    if (!input.date || !input.reason) {
      return { success: false, error: 'Date and justification reason are required.' };
    }
    const id = this.selfRepo.createAttendanceCorrectionRequest({
      staff_id: staffId,
      attendance_id: input.attendance_id,
      date: input.date,
      requested_check_in: input.requested_check_in,
      requested_check_out: input.requested_check_out,
      reason: input.reason,
    });
    return { success: true, id };
  }

  // --- LEAVE ---
  getMyLeave(userId: number): { balances: any[]; requests: any[] } {
    const staffId = this.getStaffIdOrThrow(userId);
    const requests = this.leaveRepo.getRequests({ staffId });
    const currentYear = new Date().getFullYear();
    const balances = this.leaveRepo.getStaffBalances(staffId, currentYear);
    return { balances, requests };
  }

  applyLeave(userId: number, input: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
    half_day?: boolean;
  }): { success: boolean; id?: number; error?: string } {
    const staffId = this.getStaffIdOrThrow(userId);
    return this.leaveService.applyLeave({
      staff_id: staffId,
      leave_type_id: input.leave_type_id,
      start_date: input.start_date,
      end_date: input.end_date,
      reason: input.reason,
      duration_type: input.half_day ? 'HALF_DAY' : 'FULL_DAY',
    });
  }

  cancelLeave(userId: number, leaveRequestId: number): { success: boolean; error?: string } {
    const staffId = this.getStaffIdOrThrow(userId);
    const req = this.leaveRepo.getRequestById(leaveRequestId);
    if (!req || req.staff_id !== staffId) {
      return { success: false, error: 'Leave request not found or access denied.' };
    }
    if (req.status !== 'PENDING') {
      return { success: false, error: 'Only PENDING leave requests can be cancelled.' };
    }
    this.leaveRepo.updateRequestStatus(leaveRequestId, 'CANCELLED');
    return { success: true };
  }

  // --- PAYROLL ---
  getMyPayroll(userId: number): any[] {
    const staffId = this.getStaffIdOrThrow(userId);
    return this.payrollRepo.getStaffPayrollHistory(staffId);
  }

  // --- DOCUMENTS ---
  getMyDocuments(userId: number): { documents: any[]; compliance: any } {
    const staffId = this.getStaffIdOrThrow(userId);
    const documents = this.docRepo.getDocuments({ staffId });
    const verifiedCount = documents.filter((d) => d.verification_status === 'VERIFIED').length;
    const totalRequired = Math.max(5, documents.length);
    const compliance = {
      completedCount: verifiedCount,
      totalRequired,
      complianceScore: Math.round((verifiedCount / totalRequired) * 100),
    };
    return { documents, compliance };
  }

  // --- PERFORMANCE ---
  getMyPerformance(userId: number): { scorecards: any[]; goals: any[] } {
    const staffId = this.getStaffIdOrThrow(userId);
    const scorecards = this.perfRepo.getReviews({ staffId });
    const goals = this.perfRepo.getGoals({ staffId });
    return { scorecards, goals };
  }
}
