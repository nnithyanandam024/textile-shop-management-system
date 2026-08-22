import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { AuthorizationService } from './auth/authorizationService';
import { AuditRepository } from '../repositories/auditRepository';
import { ShiftService } from './shiftService';
import { timeToMinutes, formatMinutesToHours, getTodayDateStr, getCurrentTimeStr } from './attendanceService';
import { eventBus } from '../realtime/eventBus';
import log from '../logger';

export interface TodayAttendanceData {
  id?: number;
  staffId: number;
  staffName: string;
  attendanceDate: string;
  status: string; // 'NOT_CHECKED_IN' | 'WORKING' | 'ON_BREAK' | 'COMPLETED' | 'PRESENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'ABSENT'
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workedMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  scheduledStart: string;
  scheduledEnd: string;
  shiftName: string;
  isLate: boolean;
  isEarlyExit: boolean;
  isOnBreak: boolean;
  canCheckIn: boolean;
  canCheckOut: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
}

export interface AttendanceHistoryItem {
  id: number;
  attendanceDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workedMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  formattedHours: string;
  shiftName?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  correctionStatus?: string | null;
}

export interface MonthlyAttendanceSummary {
  month: string; // e.g. 'August 2026'
  monthStr: string; // '2026-08'
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  halfDayCount: number;
  holidayCount: number;
  weekOffCount: number;
  totalWorkedMinutes: number;
  totalHoursFormatted: string;
  scheduledWorkingDays: number;
  attendanceRate: number; // percentage e.g. 95.5
}

export interface AttendanceCorrectionRequestItem {
  id: number;
  attendanceId?: number;
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export class StaffAttendanceService {
  private auditRepo: AuditRepository;
  private shiftService: ShiftService;

  constructor(private db: Database.Database) {
    this.auditRepo = new AuditRepository(db);
    this.shiftService = new ShiftService(db);
    this.ensureBreakColumns();
  }

  private ensureBreakColumns(): void {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(attendance)`).all() as Array<{ name: string }>;
      const columnNames = columns.map((c) => c.name);

      if (!columnNames.includes('break_start')) {
        this.db.prepare(`ALTER TABLE attendance ADD COLUMN break_start TEXT`).run();
      }
      if (!columnNames.includes('break_end')) {
        this.db.prepare(`ALTER TABLE attendance ADD COLUMN break_end TEXT`).run();
      }
      if (!columnNames.includes('break_minutes')) {
        this.db.prepare(`ALTER TABLE attendance ADD COLUMN break_minutes INTEGER DEFAULT 0`).run();
      }
    } catch (err: any) {
      log.warn(`Attendance schema check: ${err.message}`);
    }
  }

  private getStaffIdOrThrow(): number {
    const session = SessionService.getSession();
    if (!session) {
      throw new Error('ACCESS DENIED: Authentication required.');
    }

    let staffId = session.staffId;
    if (!staffId && session.userId) {
      const row = this.db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as any;
      if (row) staffId = row.id;
    }

    if (!staffId) {
      throw new Error('ACCESS DENIED: No active employee profile bound to this account.');
    }

    return staffId;
  }

  getTodayAttendance(): TodayAttendanceData {
    const staffId = this.getStaffIdOrThrow();
    const todayStr = getTodayDateStr();

    // Get staff name
    const staff = this.db.prepare(`SELECT first_name, last_name FROM staff WHERE id = ?`).get(staffId) as any;
    const staffName = staff ? `${staff.first_name}${staff.last_name ? ' ' + staff.last_name : ''}` : 'Employee';

    // Resolve Shift
    let shiftName = 'Regular Morning Shift';
    let scheduledStart = '09:00';
    let scheduledEnd = '18:00';
    try {
      const resolved = this.shiftService.resolveStaffShiftForDate(staffId, todayStr);
      if (resolved && resolved.template) {
        shiftName = resolved.template.name;
        scheduledStart = resolved.template.start_time;
        scheduledEnd = resolved.template.end_time;
      }
    } catch {
      // default fallback
    }

    const row = this.db.prepare(`
      SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?
    `).get(staffId, todayStr) as any;

    if (!row) {
      return {
        staffId,
        staffName,
        attendanceDate: todayStr,
        status: 'NOT_CHECKED_IN',
        checkIn: null,
        checkOut: null,
        breakStart: null,
        breakEnd: null,
        totalBreakMinutes: 0,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        scheduledStart,
        scheduledEnd,
        shiftName,
        isLate: false,
        isEarlyExit: false,
        isOnBreak: false,
        canCheckIn: true,
        canCheckOut: false,
        canStartBreak: false,
        canEndBreak: false,
      };
    }

    const isCheckedIn = Boolean(row.check_in);
    const isCheckedOut = Boolean(row.check_out);
    const isOnBreak = Boolean(row.break_start && !row.break_end);
    const totalBreakMinutes = Number(row.break_minutes || 0);

    let displayStatus = row.status || 'PRESENT';
    if (isCheckedIn && !isCheckedOut) {
      displayStatus = isOnBreak ? 'ON_BREAK' : 'WORKING';
    } else if (isCheckedIn && isCheckedOut) {
      displayStatus = 'COMPLETED';
    }

    // Calculate current worked minutes if still working
    let liveWorkedMinutes = row.worked_minutes || 0;
    if (isCheckedIn && !isCheckedOut) {
      const nowMin = timeToMinutes(getCurrentTimeStr());
      const inMin = timeToMinutes(row.check_in);
      const gross = Math.max(0, nowMin - inMin);
      liveWorkedMinutes = Math.max(0, gross - totalBreakMinutes);
    }

    return {
      id: row.id,
      staffId,
      staffName,
      attendanceDate: todayStr,
      status: displayStatus,
      checkIn: row.check_in || null,
      checkOut: row.check_out || null,
      breakStart: row.break_start || null,
      breakEnd: row.break_end || null,
      totalBreakMinutes,
      workedMinutes: liveWorkedMinutes,
      lateMinutes: row.late_minutes || 0,
      earlyExitMinutes: row.early_exit_minutes || 0,
      scheduledStart,
      scheduledEnd,
      shiftName,
      isLate: (row.late_minutes || 0) > 0,
      isEarlyExit: (row.early_exit_minutes || 0) > 0,
      isOnBreak,
      canCheckIn: !isCheckedIn,
      canCheckOut: isCheckedIn && !isCheckedOut,
      canStartBreak: isCheckedIn && !isCheckedOut && !isOnBreak,
      canEndBreak: isCheckedIn && !isCheckedOut && isOnBreak,
    };
  }

  checkIn(customTime?: string): { success: boolean; data: TodayAttendanceData; message: string } {
    AuthorizationService.requirePermission('ATTENDANCE_CHECK_IN');
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();
    const todayStr = getTodayDateStr();
    const checkInTime = customTime || getCurrentTimeStr();

    const existing = this.db.prepare(`
      SELECT id, check_in FROM attendance WHERE staff_id = ? AND attendance_date = ?
    `).get(staffId, todayStr) as any;

    if (existing && existing.check_in) {
      throw new Error(`Already checked in today at ${existing.check_in}.`);
    }

    // Resolve shift & calculate late minutes
    let lateMinutes = 0;
    let status = 'PRESENT';
    let shiftName = 'Regular Morning Shift';
    let scheduledStart = '09:00';

    try {
      const resolved = this.shiftService.resolveStaffShiftForDate(staffId, todayStr);
      if (resolved && resolved.template) {
        shiftName = resolved.template.name;
        scheduledStart = resolved.template.start_time;
        const graceMin = resolved.template.grace_minutes || 15;
        const scheduledMin = timeToMinutes(scheduledStart);
        const actualMin = timeToMinutes(checkInTime);

        if (actualMin > scheduledMin + graceMin) {
          lateMinutes = actualMin - scheduledMin;
          status = 'LATE';
        }
      }
    } catch {
      // standard fallback
    }

    if (existing) {
      this.db.prepare(`
        UPDATE attendance 
        SET check_in = ?, status = ?, late_minutes = ?, source = 'SELF_CHECK_IN', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(checkInTime, status, lateMinutes, existing.id);
    } else {
      this.db.prepare(`
        INSERT INTO attendance (
          staff_id, attendance_date, status, check_in, late_minutes, source, worked_minutes, break_minutes
        ) VALUES (?, ?, ?, ?, ?, 'SELF_CHECK_IN', 0, 0)
      `).run(staffId, todayStr, status, checkInTime, lateMinutes);
    }

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_CHECK_IN',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Checked in at ${checkInTime} (${status}${lateMinutes > 0 ? `, Late by ${lateMinutes}m` : ''})`,
    });

    log.info(`Staff #${staffId} checked in at ${checkInTime} for ${todayStr}.`);
    const todayData = this.getTodayAttendance();

    try {
      eventBus.publish('ATTENDANCE_CHECKED_IN', {
        attendanceId: todayData.id || 0,
        staffId,
        staffName: todayData.staffName,
        attendanceDate: todayStr,
        checkIn: checkInTime,
        status,
      }, {
        actorUserId: session?.userId,
        actorStaffId: staffId,
        actorName: todayData.staffName,
      });
    } catch (evtErr) {
      log.warn('[StaffAttendanceService] EventBus check-in emit error:', evtErr);
    }

    return {
      success: true,
      data: todayData,
      message: lateMinutes > 0
        ? `Checked in at ${checkInTime}. (Late by ${lateMinutes} mins)`
        : `Checked in successfully at ${checkInTime}.`,
    };
  }

  checkOut(customTime?: string): { success: boolean; data: TodayAttendanceData; message: string } {
    AuthorizationService.requirePermission('ATTENDANCE_CHECK_OUT');
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();
    const todayStr = getTodayDateStr();
    const checkOutTime = customTime || getCurrentTimeStr();

    const row = this.db.prepare(`
      SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?
    `).get(staffId, todayStr) as any;

    if (!row || !row.check_in) {
      throw new Error('Cannot check out without checking in first.');
    }
    if (row.check_out) {
      throw new Error(`Already checked out today at ${row.check_out}.`);
    }

    // If currently on break, auto-close break
    let totalBreak = Number(row.break_minutes || 0);
    if (row.break_start && !row.break_end) {
      const bStartMin = timeToMinutes(row.break_start);
      const bEndMin = timeToMinutes(checkOutTime);
      const addBreak = Math.max(0, bEndMin - bStartMin);
      totalBreak += addBreak;
    }

    // Calculate worked minutes
    const inMin = timeToMinutes(row.check_in);
    const outMin = timeToMinutes(checkOutTime);
    const grossMinutes = Math.max(0, outMin - inMin);
    const workedMinutes = Math.max(0, grossMinutes - totalBreak);

    // Calculate early exit
    let earlyExitMinutes = 0;
    try {
      const resolved = this.shiftService.resolveStaffShiftForDate(staffId, todayStr);
      if (resolved && resolved.template) {
        const scheduledEndMin = timeToMinutes(resolved.template.end_time);
        if (outMin < scheduledEndMin) {
          earlyExitMinutes = scheduledEndMin - outMin;
        }
      }
    } catch {
      // standard fallback
    }

    this.db.prepare(`
      UPDATE attendance 
      SET check_out = ?, worked_minutes = ?, break_minutes = ?, early_exit_minutes = ?, break_start = NULL, break_end = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(checkOutTime, workedMinutes, totalBreak, earlyExitMinutes, row.id);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_CHECK_OUT',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Checked out at ${checkOutTime} (Total worked: ${formatMinutesToHours(workedMinutes)}, Break: ${totalBreak}m)`,
    });

    log.info(`Staff #${staffId} checked out at ${checkOutTime}. Worked: ${workedMinutes}m.`);
    const todayData = this.getTodayAttendance();

    try {
      eventBus.publish('ATTENDANCE_CHECKED_OUT', {
        attendanceId: todayData.id || 0,
        staffId,
        staffName: todayData.staffName,
        attendanceDate: todayStr,
        checkOut: checkOutTime,
        status: todayData.status,
      }, {
        actorUserId: session?.userId,
        actorStaffId: staffId,
      });
    } catch (evtErr) {
      log.warn('[StaffAttendanceService] EventBus check-out emit error:', evtErr);
    }

    return {
      success: true,
      data: todayData,
      message: `Checked out successfully at ${checkOutTime}. Total work time: ${formatMinutesToHours(workedMinutes)}.`,
    };
  }

  startBreak(customTime?: string): { success: boolean; data: TodayAttendanceData; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();
    const todayStr = getTodayDateStr();
    const breakTime = customTime || getCurrentTimeStr();

    const row = this.db.prepare(`
      SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?
    `).get(staffId, todayStr) as any;

    if (!row || !row.check_in) {
      throw new Error('Cannot start break before checking in.');
    }
    if (row.check_out) {
      throw new Error('Attendance is already completed for today.');
    }
    if (row.break_start && !row.break_end) {
      throw new Error(`Already on break since ${row.break_start}.`);
    }

    this.db.prepare(`
      UPDATE attendance 
      SET break_start = ?, break_end = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(breakTime, row.id);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_BREAK_STARTED',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Started break at ${breakTime}`,
    });

    return {
      success: true,
      data: this.getTodayAttendance(),
      message: `Break started at ${breakTime}.`,
    };
  }

  endBreak(customTime?: string): { success: boolean; data: TodayAttendanceData; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();
    const todayStr = getTodayDateStr();
    const breakEndTime = customTime || getCurrentTimeStr();

    const row = this.db.prepare(`
      SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?
    `).get(staffId, todayStr) as any;

    if (!row || !row.break_start || row.break_end) {
      throw new Error('You are not currently on an active break.');
    }

    const bStartMin = timeToMinutes(row.break_start);
    const bEndMin = timeToMinutes(breakEndTime);
    const sessionBreak = Math.max(0, bEndMin - bStartMin);
    const totalBreak = Number(row.break_minutes || 0) + sessionBreak;

    this.db.prepare(`
      UPDATE attendance 
      SET break_end = ?, break_minutes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(breakEndTime, totalBreak, row.id);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'STAFF_BREAK_ENDED',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Ended break at ${breakEndTime} (Break duration: ${sessionBreak}m, Total: ${totalBreak}m)`,
    });

    return {
      success: true,
      data: this.getTodayAttendance(),
      message: `Break ended at ${breakEndTime}. (Duration: ${sessionBreak} mins)`,
    };
  }

  getAttendanceHistory(filter?: {
    month?: string; // 'YYYY-MM'
    status?: string;
    startDate?: string;
    endDate?: string;
  }): AttendanceHistoryItem[] {
    const staffId = this.getStaffIdOrThrow();

    let query = `
      SELECT a.*, 
             st.name as shift_name, st.start_time as scheduled_start, st.end_time as scheduled_end,
             cr.status as correction_status
      FROM attendance a
      LEFT JOIN staff_shift_assignments ssa ON a.staff_id = ssa.staff_id
      LEFT JOIN shift_templates st ON ssa.shift_template_id = st.id
      LEFT JOIN attendance_correction_requests cr ON a.id = cr.attendance_id
      WHERE a.staff_id = ?
    `;
    const params: any[] = [staffId];

    if (filter?.month) {
      query += ` AND a.attendance_date LIKE ?`;
      params.push(`${filter.month}%`);
    }
    if (filter?.status && filter.status !== 'ALL') {
      query += ` AND a.status = ?`;
      params.push(filter.status);
    }
    if (filter?.startDate) {
      query += ` AND a.attendance_date >= ?`;
      params.push(filter.startDate);
    }
    if (filter?.endDate) {
      query += ` AND a.attendance_date <= ?`;
      params.push(filter.endDate);
    }

    query += ` ORDER BY a.attendance_date DESC LIMIT 100`;

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      attendanceDate: r.attendance_date,
      status: r.status,
      checkIn: r.check_in || null,
      checkOut: r.check_out || null,
      breakStart: r.break_start || null,
      breakEnd: r.break_end || null,
      totalBreakMinutes: r.break_minutes || 0,
      workedMinutes: r.worked_minutes || 0,
      lateMinutes: r.late_minutes || 0,
      earlyExitMinutes: r.early_exit_minutes || 0,
      formattedHours: formatMinutesToHours(r.worked_minutes || 0),
      shiftName: r.shift_name || 'Morning Shift',
      scheduledStart: r.scheduled_start || '09:00',
      scheduledEnd: r.scheduled_end || '18:00',
      correctionStatus: r.correction_status || null,
    }));
  }

  getMonthlySummary(monthStr?: string): MonthlyAttendanceSummary {
    const staffId = this.getStaffIdOrThrow();
    const targetMonth = monthStr || getTodayDateStr().slice(0, 7); // 'YYYY-MM'

    const rows = this.db.prepare(`
      SELECT status, late_minutes, worked_minutes
      FROM attendance
      WHERE staff_id = ? AND attendance_date LIKE ?
    `).all(staffId, `${targetMonth}%`) as any[];

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let halfDayCount = 0;
    let holidayCount = 0;
    let weekOffCount = 0;
    let totalWorkedMinutes = 0;

    for (const r of rows) {
      const st = r.status?.toUpperCase() || 'PRESENT';
      if (['PRESENT', 'WORKING', 'COMPLETED'].includes(st)) {
        presentCount++;
      } else if (st === 'LATE') {
        presentCount++;
        lateCount++;
      } else if (st === 'ABSENT') {
        absentCount++;
      } else if (st === 'LEAVE') {
        leaveCount++;
      } else if (st === 'HALF_DAY') {
        halfDayCount++;
        presentCount += 0.5;
      } else if (st === 'HOLIDAY') {
        holidayCount++;
      } else if (st === 'WEEK_OFF') {
        weekOffCount++;
      }

      if (r.late_minutes > 0 && st !== 'LATE') {
        lateCount++;
      }
      totalWorkedMinutes += Number(r.worked_minutes || 0);
    }

    // Scheduled working days in month (estimate approx 26 days or total present + absent + late)
    const scheduledWorkingDays = Math.max(1, Math.round(presentCount + absentCount + halfDayCount));
    const attendanceRate = Math.min(100, Math.round((presentCount / scheduledWorkingDays) * 1000) / 10);

    // Format Month display
    const [yr, mo] = targetMonth.split('-');
    const dateObj = new Date(Number(yr), Number(mo) - 1, 1);
    const monthFormatted = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return {
      month: monthFormatted,
      monthStr: targetMonth,
      presentCount: Math.floor(presentCount),
      lateCount,
      absentCount,
      leaveCount,
      halfDayCount,
      holidayCount,
      weekOffCount,
      totalWorkedMinutes,
      totalHoursFormatted: formatMinutesToHours(totalWorkedMinutes),
      scheduledWorkingDays,
      attendanceRate: isNaN(attendanceRate) ? 100 : attendanceRate,
    };
  }

  getAttendanceByDate(dateStr: string): AttendanceHistoryItem | null {
    const staffId = this.getStaffIdOrThrow();

    const r = this.db.prepare(`
      SELECT a.*, 
             st.name as shift_name, st.start_time as scheduled_start, st.end_time as scheduled_end,
             cr.status as correction_status
      FROM attendance a
      LEFT JOIN staff_shift_assignments ssa ON a.staff_id = ssa.staff_id
      LEFT JOIN shift_templates st ON ssa.shift_template_id = st.id
      LEFT JOIN attendance_correction_requests cr ON a.id = cr.attendance_id
      WHERE a.staff_id = ? AND a.attendance_date = ?
    `).get(staffId, dateStr) as any;

    if (!r) return null;

    return {
      id: r.id,
      attendanceDate: r.attendance_date,
      status: r.status,
      checkIn: r.check_in || null,
      checkOut: r.check_out || null,
      breakStart: r.break_start || null,
      breakEnd: r.break_end || null,
      totalBreakMinutes: r.break_minutes || 0,
      workedMinutes: r.worked_minutes || 0,
      lateMinutes: r.late_minutes || 0,
      earlyExitMinutes: r.early_exit_minutes || 0,
      formattedHours: formatMinutesToHours(r.worked_minutes || 0),
      shiftName: r.shift_name || 'Morning Shift',
      scheduledStart: r.scheduled_start || '09:00',
      scheduledEnd: r.scheduled_end || '18:00',
      correctionStatus: r.correction_status || null,
    };
  }

  requestCorrection(input: {
    date: string;
    attendanceId?: number;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }): { success: boolean; id: number; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (!input.date) {
      throw new Error('Date is required for correction request.');
    }
    if (!input.reason || input.reason.trim() === '') {
      throw new Error('Please provide a reason / justification.');
    }

    const info = this.db.prepare(`
      INSERT INTO attendance_correction_requests (
        staff_id, attendance_id, date, requested_check_in, requested_check_out, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      staffId,
      input.attendanceId || null,
      input.date,
      input.requestedCheckIn?.trim() || null,
      input.requestedCheckOut?.trim() || null,
      input.reason.trim()
    );

    const id = Number(info.lastInsertRowid);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'ATTENDANCE_CORRECTION_REQUESTED',
      entity_type: 'ATTENDANCE',
      entity_id: staffId,
      new_value: `Requested correction for ${input.date}: Check-in=${input.requestedCheckIn || 'N/A'}, Check-out=${input.requestedCheckOut || 'N/A'}. Reason: ${input.reason}`,
    });

    return {
      success: true,
      id,
      message: 'Attendance correction request submitted for administrative review.',
    };
  }

  getCorrectionRequests(): AttendanceCorrectionRequestItem[] {
    const staffId = this.getStaffIdOrThrow();

    const rows = this.db.prepare(`
      SELECT cr.*, u.display_name as reviewer_name
      FROM attendance_correction_requests cr
      LEFT JOIN users u ON cr.reviewed_by = u.id
      WHERE cr.staff_id = ?
      ORDER BY cr.id DESC
    `).all(staffId) as any[];

    return rows.map((r) => ({
      id: r.id,
      attendanceId: r.attendance_id || undefined,
      date: r.date,
      requestedCheckIn: r.requested_check_in || undefined,
      requestedCheckOut: r.requested_check_out || undefined,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewer_name || undefined,
      reviewedAt: r.reviewed_at || undefined,
      createdAt: r.created_at,
    }));
  }
}
