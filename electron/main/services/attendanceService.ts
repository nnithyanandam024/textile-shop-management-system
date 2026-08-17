import Database from 'better-sqlite3';
import { AttendanceRepository, AttendanceRow, AttendanceSettingsRow } from '../repositories/attendanceRepository';
import { AttendanceCorrectionRepository, AttendanceCorrectionRow } from '../repositories/attendanceCorrectionRepository';
import { StaffRepository } from '../repositories/staffRepository';
import { AuditRepository } from '../repositories/auditRepository';
import log from '../logger';

// Helper to convert HH:MM to total minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// Helper to format minutes as 8h 45m or 0h 30m
export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes <= 0) return '0h 0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

// Helper to format date to YYYY-MM-DD
export function getTodayDateStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to get current HH:MM
export function getCurrentTimeStr(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export class AttendanceService {
  private attRepo: AttendanceRepository;
  private corrRepo: AttendanceCorrectionRepository;
  private staffRepo: StaffRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.attRepo = new AttendanceRepository(db);
    this.corrRepo = new AttendanceCorrectionRepository(db);
    this.staffRepo = new StaffRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  getSettings(): AttendanceSettingsRow {
    return this.attRepo.getSettings();
  }

  updateSettings(input: Partial<AttendanceSettingsRow>, actorUserId?: number): { success: boolean; error?: string } {
    try {
      this.attRepo.updateSettings(input, actorUserId);
      this.auditRepo.log({
        user_id: actorUserId,
        action: 'ATTENDANCE_SETTINGS_UPDATED',
        entity_type: 'SETTINGS',
        entity_id: 1,
        new_value: JSON.stringify(input),
      });
      return { success: true };
    } catch (error: any) {
      log.error('Failed to update attendance settings:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  checkIn(staffId: number, customTime?: string, actorUserId?: number): { success: boolean; error?: string } {
    const staff = this.staffRepo.getById(staffId);
    if (!staff) {
      return { success: false, error: 'Staff member record not found.' };
    }

    const todayStr = getTodayDateStr();
    const checkInTime = customTime || getCurrentTimeStr();
    const existing = this.attRepo.findByStaffAndDate(staffId, todayStr);

    if (existing && existing.check_in) {
      return { success: false, error: 'Staff member is already checked in today.' };
    }

    const settings = this.getSettings();
    const workStartMins = timeToMinutes(settings.work_start_time);
    const checkInMins = timeToMinutes(checkInTime);
    const graceMins = settings.grace_minutes || 10;

    let lateMinutes = 0;
    if (checkInMins > workStartMins + graceMins) {
      lateMinutes = checkInMins - workStartMins;
    }

    if (existing) {
      this.attRepo.update(existing.id, {
        check_in: checkInTime,
        status: existing.status === 'ABSENT' ? 'PRESENT' : existing.status,
        late_minutes: lateMinutes,
      });
    } else {
      this.attRepo.create({
        staff_id: staffId,
        attendance_date: todayStr,
        status: 'PRESENT',
        check_in: checkInTime,
        late_minutes: lateMinutes,
        source: actorUserId ? 'ADMIN_ENTRY' : 'SELF_CHECK_IN',
        created_by: actorUserId,
      });
    }

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'CHECK_IN',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Check in at ${checkInTime} (Late: ${lateMinutes}m)`,
    });

    return { success: true };
  }

  checkOut(staffId: number, customTime?: string, actorUserId?: number): { success: boolean; error?: string } {
    const staff = this.staffRepo.getById(staffId);
    if (!staff) {
      return { success: false, error: 'Staff member record not found.' };
    }

    const todayStr = getTodayDateStr();
    const checkOutTime = customTime || getCurrentTimeStr();
    const existing = this.attRepo.findByStaffAndDate(staffId, todayStr);

    if (!existing || !existing.check_in) {
      return { success: false, error: 'Staff must be checked in before checking out.' };
    }

    if (existing.check_out) {
      return { success: false, error: 'Staff member is already checked out today.' };
    }

    const checkInMins = timeToMinutes(existing.check_in);
    const checkOutMins = timeToMinutes(checkOutTime);

    if (checkOutMins < checkInMins) {
      return { success: false, error: 'Check-out time cannot be earlier than check-in time.' };
    }

    const settings = this.getSettings();
    const workEndMins = timeToMinutes(settings.work_end_time);

    let earlyExitMins = 0;
    if (checkOutMins < workEndMins) {
      earlyExitMins = workEndMins - checkOutMins;
    }

    const grossWorked = checkOutMins - checkInMins;
    const workedMinutes = Math.max(0, grossWorked - (existing.permission_minutes || 0));

    // Determine status (HALF_DAY if worked < half_day_minutes)
    let status = existing.status;
    if (workedMinutes < settings.half_day_minutes && status === 'PRESENT') {
      status = 'HALF_DAY';
    }

    this.attRepo.update(existing.id, {
      check_out: checkOutTime,
      worked_minutes: workedMinutes,
      early_exit_minutes: earlyExitMins,
      status,
    });

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'CHECK_OUT',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Check out at ${checkOutTime} (Worked: ${formatMinutesToHours(workedMinutes)})`,
    });

    return { success: true };
  }

  manualMarkAttendance(
    input: {
      staff_id: number;
      attendance_date: string;
      status: string;
      check_in?: string;
      check_out?: string;
      permission_minutes?: number;
      remarks?: string;
    },
    actorUserId?: number
  ): { success: boolean; error?: string } {
    if (!input.staff_id || !input.attendance_date || !input.status) {
      return { success: false, error: 'Staff, date, and status are required.' };
    }

    const settings = this.getSettings();
    let lateMins = 0;
    let earlyExitMins = 0;
    let workedMins = 0;

    if (input.check_in && input.check_out) {
      const inMins = timeToMinutes(input.check_in);
      const outMins = timeToMinutes(input.check_out);
      if (outMins < inMins) {
        return { success: false, error: 'Check-out time cannot be earlier than check-in time.' };
      }

      const workStartMins = timeToMinutes(settings.work_start_time);
      const workEndMins = timeToMinutes(settings.work_end_time);

      if (inMins > workStartMins + settings.grace_minutes) {
        lateMins = inMins - workStartMins;
      }
      if (outMins < workEndMins) {
        earlyExitMins = workEndMins - outMins;
      }
      workedMins = Math.max(0, outMins - inMins - (input.permission_minutes || 0));
    }

    const existing = this.attRepo.findByStaffAndDate(input.staff_id, input.attendance_date);
    if (existing) {
      this.attRepo.update(existing.id, {
        status: input.status,
        check_in: input.check_in || undefined,
        check_out: input.check_out || undefined,
        worked_minutes: workedMins,
        late_minutes: lateMins,
        early_exit_minutes: earlyExitMins,
        permission_minutes: input.permission_minutes || 0,
        remarks: input.remarks || undefined,
        source: 'MANUAL',
      });
    } else {
      this.attRepo.create({
        staff_id: input.staff_id,
        attendance_date: input.attendance_date,
        status: input.status,
        check_in: input.check_in || undefined,
        check_out: input.check_out || undefined,
        worked_minutes: workedMins,
        late_minutes: lateMins,
        early_exit_minutes: earlyExitMins,
        permission_minutes: input.permission_minutes || 0,
        remarks: input.remarks || undefined,
        source: 'MANUAL',
        created_by: actorUserId,
      });
    }

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'ATTENDANCE_MANUAL_MARKED',
      entity_type: 'ATTENDANCE',
      entity_id: input.staff_id,
      new_value: `Marked ${input.status} for ${input.attendance_date}`,
    });

    return { success: true };
  }

  requestCorrection(
    attendanceId: number,
    input: {
      new_check_in?: string;
      new_check_out?: string;
      new_status?: string;
      reason: string;
    },
    actorUserId: number
  ): { success: boolean; error?: string } {
    if (!input.reason || input.reason.trim() === '') {
      return { success: false, error: 'Reason for attendance correction is required.' };
    }

    const existing = this.attRepo.findByDate(getTodayDateStr()).find((a) => a.id === attendanceId) ||
      this.db.prepare('SELECT * FROM attendance WHERE id = ?').get(attendanceId) as AttendanceRow | undefined;

    if (!existing) {
      return { success: false, error: 'Attendance record not found.' };
    }

    const validActorId = this.sanitizeActorUserId(actorUserId);

    this.corrRepo.create({
      attendance_id: attendanceId,
      original_check_in: existing.check_in,
      original_check_out: existing.check_out,
      original_status: existing.status,
      new_check_in: input.new_check_in,
      new_check_out: input.new_check_out,
      new_status: input.new_status,
      reason: input.reason.trim(),
      requested_by: validActorId || 1,
    });

    this.attRepo.update(attendanceId, { approval_status: 'PENDING' });

    this.auditRepo.log({
      user_id: validActorId,
      action: 'ATTENDANCE_CORRECTION_REQUESTED',
      entity_type: 'ATTENDANCE',
      entity_id: attendanceId,
      new_value: `Requested correction: ${input.reason}`,
    });

    return { success: true };
  }

  approveCorrection(correctionId: number, approve: boolean, actorUserId: number): { success: boolean; error?: string } {
    const corr = this.corrRepo.getById(correctionId);
    if (!corr || corr.status !== 'PENDING') {
      return { success: false, error: 'Pending correction request not found.' };
    }

    const validActorId = this.sanitizeActorUserId(actorUserId);

    if (!approve) {
      this.corrRepo.updateStatus(correctionId, 'REJECTED', validActorId || 1);
      this.attRepo.update(corr.attendance_id, { approval_status: 'REJECTED' });
      return { success: true };
    }

    const att = this.db.prepare('SELECT * FROM attendance WHERE id = ?').get(corr.attendance_id) as AttendanceRow;
    if (!att) {
      return { success: false, error: 'Target attendance record not found.' };
    }

    const settings = this.getSettings();
    const checkIn = corr.new_check_in || att.check_in;
    const checkOut = corr.new_check_out || att.check_out;
    const status = corr.new_status || att.status;

    let lateMins = 0;
    let earlyExitMins = 0;
    let workedMins = 0;

    if (checkIn && checkOut) {
      const inMins = timeToMinutes(checkIn);
      const outMins = timeToMinutes(checkOut);
      const workStartMins = timeToMinutes(settings.work_start_time);
      const workEndMins = timeToMinutes(settings.work_end_time);

      if (inMins > workStartMins + settings.grace_minutes) {
        lateMins = inMins - workStartMins;
      }
      if (outMins < workEndMins) {
        earlyExitMins = workEndMins - outMins;
      }
      workedMins = Math.max(0, outMins - inMins - (att.permission_minutes || 0));
    }

    this.attRepo.update(corr.attendance_id, {
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      status,
      worked_minutes: workedMins,
      late_minutes: lateMins,
      early_exit_minutes: earlyExitMins,
      approval_status: 'APPROVED',
      approved_by: validActorId || undefined,
      approved_at: new Date().toISOString(),
    });

    this.corrRepo.updateStatus(correctionId, 'APPROVED', validActorId || 1);

    this.auditRepo.log({
      user_id: validActorId,
      action: 'ATTENDANCE_CORRECTION_APPROVED',
      entity_type: 'ATTENDANCE',
      entity_id: corr.attendance_id,
      new_value: `Approved correction for attendance #${corr.attendance_id}`,
    });

    return { success: true };
  }

  getDailyAttendanceList(dateStr: string, filters?: { departmentId?: number; status?: string; search?: string }) {
    const allActiveStaff = this.staffRepo.getAll({ status: 'ACTIVE', limit: 500 }).staff;
    const records = this.attRepo.findByDate(dateStr, filters);

    const recordMap = new Map<number, AttendanceRow>();
    records.forEach((r) => recordMap.set(r.staff_id, r));

    // Combine staff with today's attendance record
    const list = allActiveStaff.map((s) => {
      const att = recordMap.get(s.id);
      return {
        staff_id: s.id,
        staff_code: s.staff_code,
        first_name: s.first_name,
        last_name: s.last_name,
        department_name: s.department_name,
        designation_name: s.designation_name,
        attendance_id: att?.id || null,
        attendance_date: dateStr,
        status: att?.status || 'NOT_MARKED',
        check_in: att?.check_in || null,
        check_out: att?.check_out || null,
        worked_minutes: att?.worked_minutes || 0,
        worked_hours_formatted: formatMinutesToHours(att?.worked_minutes || 0),
        late_minutes: att?.late_minutes || 0,
        early_exit_minutes: att?.early_exit_minutes || 0,
        permission_minutes: att?.permission_minutes || 0,
        remarks: att?.remarks || null,
        source: att?.source || null,
        approval_status: att?.approval_status || null,
      };
    });

    // KPI Counters
    const kpis = {
      total_staff: allActiveStaff.length,
      present: list.filter((l) => l.status === 'PRESENT').length,
      absent: list.filter((l) => l.status === 'ABSENT').length,
      half_day: list.filter((l) => l.status === 'HALF_DAY').length,
      late: list.filter((l) => l.late_minutes > 0).length,
      permission: list.filter((l) => l.permission_minutes > 0).length,
      holiday: list.filter((l) => l.status === 'HOLIDAY').length,
      week_off: list.filter((l) => l.status === 'WEEK_OFF').length,
      not_marked: list.filter((l) => l.status === 'NOT_MARKED').length,
    };

    return { kpis, list };
  }

  getMonthlyStaffSummary(staffId: number, year: number, month: number) {
    const records = this.attRepo.findByMonth(year, month, staffId);
    const staff = this.staffRepo.getById(staffId);

    const daysInMonth = new Date(year, month, 0).getDate();
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length;
    const holidayCount = records.filter((r) => r.status === 'HOLIDAY').length;
    const weekOffCount = records.filter((r) => r.status === 'WEEK_OFF').length;

    const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.worked_minutes || 0), 0);
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
    const totalPermissionMinutes = records.reduce((sum, r) => sum + (r.permission_minutes || 0), 0);
    const lateCount = records.filter((r) => r.late_minutes > 0).length;

    const workingDays = Math.max(1, daysInMonth - holidayCount - weekOffCount);
    const equivalentPresent = presentCount + halfDayCount * 0.5;
    const attendancePercentage = Math.min(100, Math.round((equivalentPresent / workingDays) * 100));

    return {
      staff,
      year,
      month,
      days_in_month: daysInMonth,
      working_days: workingDays,
      present_count: presentCount,
      absent_count: absentCount,
      half_day_count: halfDayCount,
      holiday_count: holidayCount,
      week_off_count: weekOffCount,
      late_count: lateCount,
      total_worked_minutes: totalWorkedMinutes,
      total_worked_hours_formatted: formatMinutesToHours(totalWorkedMinutes),
      total_late_minutes: totalLateMinutes,
      total_permission_minutes: totalPermissionMinutes,
      attendance_percentage: attendancePercentage,
      records,
    };
  }

  getPendingCorrections(): AttendanceCorrectionRow[] {
    return this.corrRepo.getPending();
  }
}
