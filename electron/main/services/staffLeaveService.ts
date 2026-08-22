import Database from 'better-sqlite3';
import { SessionService } from './auth/sessionService';
import { AuthorizationService } from './auth/authorizationService';
import { AuditRepository } from '../repositories/auditRepository';
import { LeaveRepository, LeaveTypeRow, LeaveBalanceRow, LeaveRequestRow } from '../repositories/leaveRepository';
import { eventBus } from '../realtime/eventBus';
import log from '../logger';

export interface StaffLeaveBalanceItem {
  leaveTypeId: number;
  leaveCode: string;
  leaveName: string;
  isPaid: boolean;
  allocatedDays: number;
  carryForwardDays: number;
  usedDays: number;
  adjustmentDays: number;
  availableDays: number;
  pendingDays: number;
  remainingAfterPending: number;
}

export interface StaffLeaveTypeOption {
  id: number;
  code: string;
  name: string;
  description?: string;
  isPaid: boolean;
  requiresApproval: boolean;
  requiresDocument: boolean;
  annualAllocation: number;
  maxConsecutiveDays: number;
}

export interface StaffLeaveRequestItem {
  id: number;
  staffId: number;
  leaveTypeId: number;
  leaveCode: string;
  leaveName: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationType: 'FULL_DAY' | 'HALF_DAY';
  session?: 'MORNING' | 'AFTERNOON';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  attachmentPath?: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface StaffPermissionRequestItem {
  id: number;
  staffId: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  durationFormatted: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface LeaveCalendarDayItem {
  date: string;
  dayNum: number;
  dayName: string;
  shortDayName: string;
  status: 'APPROVED_LEAVE' | 'PENDING_LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'WORKING';
  symbol: 'L' | 'P' | 'H' | 'O' | 'W';
  label: string;
  leaveTypeName?: string;
  isHalfDay?: boolean;
  session?: 'MORNING' | 'AFTERNOON';
  holidayName?: string;
}

export class StaffLeaveService {
  private auditRepo: AuditRepository;
  private leaveRepo: LeaveRepository;

  constructor(private db: Database.Database) {
    this.auditRepo = new AuditRepository(db);
    this.leaveRepo = new LeaveRepository(db);
  }

  private getStaffIdOrThrow(): number {
    const session = SessionService.getSession();
    if (!session || !session.staffId) {
      throw new Error('Unauthorized: Staff session required.');
    }
    return session.staffId;
  }

  // --- 1. LEAVE BALANCES ---
  getLeaveBalances(year?: number): StaffLeaveBalanceItem[] {
    const staffId = this.getStaffIdOrThrow();
    const yr = year || new Date().getFullYear();

    // Ensure staff balances are initialized
    const leaveTypes = this.leaveRepo.getAllLeaveTypes(false);
    for (const lt of leaveTypes) {
      const existing = this.leaveRepo.getBalance(staffId, lt.id, yr);
      if (!existing) {
        this.leaveRepo.createOrUpdateBalance({
          staff_id: staffId,
          leave_type_id: lt.id,
          year: yr,
          allocated_days: lt.annual_allocation || 0,
          carry_forward_days: 0,
          used_days: 0,
          adjustment_days: 0,
        });
      }
    }

    const balances = this.leaveRepo.getStaffBalances(staffId, yr);

    // Calculate pending days for each leave type in the given year
    const pendingRows = this.db.prepare(`
      SELECT leave_type_id, COALESCE(SUM(duration_days), 0) as pending_days
      FROM leave_requests
      WHERE staff_id = ?
        AND status = 'PENDING'
        AND (strftime('%Y', start_date) = ? OR strftime('%Y', end_date) = ?)
      GROUP BY leave_type_id
    `).all(staffId, String(yr), String(yr)) as Array<{ leave_type_id: number; pending_days: number }>;

    const pendingMap = new Map<number, number>();
    pendingRows.forEach((r) => pendingMap.set(r.leave_type_id, r.pending_days));

    return balances.map((b) => {
      const availableDays = (b.allocated_days || 0) + (b.carry_forward_days || 0) + (b.adjustment_days || 0) - (b.used_days || 0);
      const pendingDays = pendingMap.get(b.leave_type_id) || 0;
      const remainingAfterPending = Math.max(0, availableDays - pendingDays);

      return {
        leaveTypeId: b.leave_type_id,
        leaveCode: b.leave_code || 'LEAVE',
        leaveName: b.leave_name || 'Leave',
        isPaid: true,
        allocatedDays: b.allocated_days || 0,
        carryForwardDays: b.carry_forward_days || 0,
        usedDays: b.used_days || 0,
        adjustmentDays: b.adjustment_days || 0,
        availableDays,
        pendingDays,
        remainingAfterPending,
      };
    });
  }

  // --- 2. LEAVE TYPES ---
  getLeaveTypes(): StaffLeaveTypeOption[] {
    const rows = this.leaveRepo.getAllLeaveTypes(false);
    return rows.map((r) => ({
      id: r.id,
      code: r.leave_code,
      name: r.name,
      description: r.description,
      isPaid: Boolean(r.paid),
      requiresApproval: Boolean(r.requires_approval),
      requiresDocument: Boolean(r.requires_document),
      annualAllocation: r.annual_allocation,
      maxConsecutiveDays: r.max_consecutive_days,
    }));
  }

  // --- 3. APPLY LEAVE ---
  applyLeave(input: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    duration_type?: 'FULL_DAY' | 'HALF_DAY';
    session?: 'MORNING' | 'AFTERNOON';
    reason: string;
    attachment_path?: string;
  }): { success: boolean; id: number; message: string } {
    AuthorizationService.requirePermission('LEAVE_CREATE');
    const staffId = this.getStaffIdOrThrow();

    if (!input.start_date || !input.end_date) {
      throw new Error('Start date and end date are required.');
    }
    if (input.start_date > input.end_date) {
      throw new Error('End date cannot be earlier than start date.');
    }
    if (!input.reason || input.reason.trim() === '') {
      throw new Error('Please provide a reason for the leave application.');
    }

    const leaveType = this.leaveRepo.getLeaveTypeById(input.leave_type_id);
    if (!leaveType || leaveType.status !== 'ACTIVE') {
      throw new Error('Selected leave type is invalid or inactive.');
    }

    // Overlap validation
    const overlapRow = this.db.prepare(`
      SELECT id, start_date, end_date, status
      FROM leave_requests
      WHERE staff_id = ?
        AND status IN ('PENDING', 'APPROVED')
        AND (
          (start_date BETWEEN ? AND ?) OR
          (end_date BETWEEN ? AND ?) OR
          (? BETWEEN start_date AND end_date)
        )
      LIMIT 1
    `).get(staffId, input.start_date, input.end_date, input.start_date, input.end_date, input.start_date) as any;

    if (overlapRow) {
      throw new Error(`A leave request already exists for part of this period (${overlapRow.start_date} to ${overlapRow.end_date}).`);
    }

    // Calculate duration
    let durationDays = 1.0;
    const isHalfDay = input.duration_type === 'HALF_DAY';

    if (isHalfDay) {
      durationDays = 0.5;
    } else {
      const [y1, m1, d1] = input.start_date.split('-').map(Number);
      const [y2, m2, d2] = input.end_date.split('-').map(Number);
      const date1 = new Date(y1, m1 - 1, d1);
      const date2 = new Date(y2, m2 - 1, d2);
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      durationDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check balance for paid leaves
    const year = parseInt(input.start_date.split('-')[0], 10);
    this.getLeaveBalances(year); // ensure initialized
    const balance = this.leaveRepo.getBalance(staffId, input.leave_type_id, year);

    if (leaveType.paid && balance && balance.available_days !== undefined) {
      if (balance.available_days < durationDays) {
        throw new Error(
          `You do not have enough leave balance. Available: ${balance.available_days} days, Requested: ${durationDays} days.`
        );
      }
    }

    // Insert leave request
    const stmt = this.db.prepare(`
      INSERT INTO leave_requests (
        staff_id, leave_type_id, start_date, end_date, duration_days,
        duration_type, session, reason, attachment_path, status, requested_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      staffId,
      input.leave_type_id,
      input.start_date,
      input.end_date,
      durationDays,
      input.duration_type || 'FULL_DAY',
      input.session || null,
      input.reason.trim(),
      input.attachment_path || null
    );

    const requestId = Number(result.lastInsertRowid);

    // Audit log
    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'LEAVE_APPLIED',
      entity_type: 'LEAVE_REQUEST',
      entity_id: requestId,
      new_value: `Applied ${leaveType.name} (${durationDays} days) from ${input.start_date} to ${input.end_date}`,
    });

    try {
      eventBus.publish('LEAVE_CREATED', {
        leaveRequestId: requestId,
        staffId,
        staffName: SessionService.getSession()?.displayName || 'Staff Member',
        startDate: input.start_date,
        endDate: input.end_date,
        leaveType: leaveType.name,
        status: 'PENDING',
      }, {
        actorUserId: SessionService.getSession()?.userId,
        actorStaffId: staffId,
      });
    } catch (evtErr) {
      log.warn('[StaffLeaveService] EventBus emit error:', evtErr);
    }

    return {
      success: true,
      id: requestId,
      message: 'Leave request submitted successfully for management approval.',
    };
  }

  // --- 4. GET LEAVE REQUESTS ---
  getLeaveRequests(filters?: {
    leave_type_id?: number;
    status?: string;
    year?: number;
  }): StaffLeaveRequestItem[] {
    const staffId = this.getStaffIdOrThrow();

    let query = `
      SELECT lr.*, lt.leave_code, lt.name as leave_name, lt.paid,
             u.display_name as reviewer_name
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.staff_id = ?
    `;
    const params: any[] = [staffId];

    if (filters?.leave_type_id) {
      query += ` AND lr.leave_type_id = ?`;
      params.push(filters.leave_type_id);
    }
    if (filters?.status && filters.status !== 'ALL') {
      query += ` AND lr.status = ?`;
      params.push(filters.status);
    }
    if (filters?.year) {
      query += ` AND (strftime('%Y', lr.start_date) = ? OR strftime('%Y', lr.end_date) = ?)`;
      params.push(String(filters.year), String(filters.year));
    }

    query += ` ORDER BY lr.id DESC`;

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staff_id,
      leaveTypeId: r.leave_type_id,
      leaveCode: r.leave_code,
      leaveName: r.leave_name,
      isPaid: Boolean(r.paid),
      startDate: r.start_date,
      endDate: r.end_date,
      durationDays: r.duration_days,
      durationType: r.duration_type || 'FULL_DAY',
      session: r.session,
      reason: r.reason,
      status: r.status,
      attachmentPath: r.attachment_path,
      requestedAt: r.requested_at || r.created_at,
      reviewedBy: r.reviewer_name,
      reviewedAt: r.approved_at,
      reviewComment: r.rejection_reason,
    }));
  }

  // --- 5. GET LEAVE DETAILS ---
  getLeaveDetails(requestId: number): StaffLeaveRequestItem {
    const staffId = this.getStaffIdOrThrow();

    const row = this.db.prepare(`
      SELECT lr.*, lt.leave_code, lt.name as leave_name, lt.paid,
             u.display_name as reviewer_name
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.id = ? AND lr.staff_id = ?
    `).get(requestId, staffId) as any;

    if (!row) {
      throw new Error('Leave request not found or unauthorized.');
    }

    return {
      id: row.id,
      staffId: row.staff_id,
      leaveTypeId: row.leave_type_id,
      leaveCode: row.leave_code,
      leaveName: row.leave_name,
      isPaid: Boolean(row.paid),
      startDate: row.start_date,
      endDate: row.end_date,
      durationDays: row.duration_days,
      durationType: row.duration_type || 'FULL_DAY',
      session: row.session,
      reason: row.reason,
      status: row.status,
      attachmentPath: row.attachment_path,
      requestedAt: row.requested_at || row.created_at,
      reviewedBy: row.reviewer_name,
      reviewedAt: row.approved_at,
      reviewComment: row.rejection_reason,
    };
  }

  // --- 6. CANCEL LEAVE ---
  cancelLeave(requestId: number): { success: boolean; message: string } {
    const staffId = this.getStaffIdOrThrow();

    const row = this.db.prepare(`
      SELECT * FROM leave_requests WHERE id = ? AND staff_id = ?
    `).get(requestId, staffId) as any;

    if (!row) {
      throw new Error('Leave request not found or unauthorized.');
    }

    if (row.status === 'CANCELLED') {
      throw new Error('Leave request is already cancelled.');
    }

    if (row.status === 'REJECTED') {
      throw new Error('Cannot cancel a rejected leave request.');
    }

    if (row.status === 'PENDING') {
      this.db.prepare(`
        UPDATE leave_requests
        SET status = 'CANCELLED', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(SessionService.getSession()?.userId || null, requestId);

      this.auditRepo.log({
        user_id: SessionService.getSession()?.userId,
        action: 'LEAVE_CANCELLED',
        entity_type: 'LEAVE_REQUEST',
        entity_id: requestId,
        new_value: `Cancelled pending leave request #${requestId}`,
      });

      return { success: true, message: 'Pending leave request has been cancelled.' };
    }

    // If APPROVED, create cancellation note / update
    this.db.prepare(`
      UPDATE leave_requests
      SET status = 'CANCELLED', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(SessionService.getSession()?.userId || null, requestId);

    // Revert used days in balance if paid
    const year = parseInt(row.start_date.split('-')[0], 10);
    this.db.prepare(`
      UPDATE leave_balances
      SET used_days = MAX(0, used_days - ?), updated_at = CURRENT_TIMESTAMP
      WHERE staff_id = ? AND leave_type_id = ? AND year = ?
    `).run(row.duration_days, staffId, row.leave_type_id, year);

    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'LEAVE_CANCELLED',
      entity_type: 'LEAVE_REQUEST',
      entity_id: requestId,
      new_value: `Cancelled approved leave #${requestId} and restored ${row.duration_days} balance days`,
    });

    return { success: true, message: 'Approved leave has been cancelled and balance restored.' };
  }

  // --- 7. LEAVE CALENDAR ---
  getLeaveCalendar(monthStr?: string): { month: string; monthStr: string; totalDays: number; days: LeaveCalendarDayItem[] } {
    const staffId = this.getStaffIdOrThrow();
    let year: number;
    let month: number;

    if (monthStr) {
      const [y, m] = monthStr.split('-').map(Number);
      year = y;
      month = m;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const totalDays = new Date(year, month, 0).getDate();
    const formattedMonth = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get leaves for this month
    const startOfMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

    const leaveRows = this.db.prepare(`
      SELECT lr.*, lt.name as leave_name
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.staff_id = ?
        AND lr.status IN ('PENDING', 'APPROVED')
        AND (
          (lr.start_date <= ? AND lr.end_date >= ?)
        )
    `).all(staffId, endOfMonthStr, startOfMonthStr) as any[];

    // Get holidays for this month
    const holidayRows = this.db.prepare(`
      SELECT * FROM holidays
      WHERE holiday_date BETWEEN ? AND ?
    `).all(startOfMonthStr, endOfMonthStr) as any[];
    const holidayMap = new Map<string, string>();
    holidayRows.forEach((h) => holidayMap.set(h.holiday_date, h.name));

    const days: LeaveCalendarDayItem[] = [];

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();

      const holiday = holidayMap.get(dStr);
      if (holiday) {
        days.push({
          date: dStr,
          dayNum: d,
          dayName: dayNames[dayOfWeek],
          shortDayName: shortDayNames[dayOfWeek],
          status: 'HOLIDAY',
          symbol: 'H',
          label: holiday,
          holidayName: holiday,
        });
        continue;
      }

      // Check leave
      const activeLeave = leaveRows.find((lr) => dStr >= lr.start_date && dStr <= lr.end_date);
      if (activeLeave) {
        const isApproved = activeLeave.status === 'APPROVED';
        days.push({
          date: dStr,
          dayNum: d,
          dayName: dayNames[dayOfWeek],
          shortDayName: shortDayNames[dayOfWeek],
          status: isApproved ? 'APPROVED_LEAVE' : 'PENDING_LEAVE',
          symbol: isApproved ? 'L' : 'P',
          label: `${activeLeave.leave_name} (${isApproved ? 'Approved' : 'Pending'})`,
          leaveTypeName: activeLeave.leave_name,
          isHalfDay: activeLeave.duration_type === 'HALF_DAY',
          session: activeLeave.session,
        });
        continue;
      }

      // Sunday or Week off
      if (dayOfWeek === 0) {
        days.push({
          date: dStr,
          dayNum: d,
          dayName: dayNames[dayOfWeek],
          shortDayName: shortDayNames[dayOfWeek],
          status: 'WEEK_OFF',
          symbol: 'O',
          label: 'Weekly Off',
        });
        continue;
      }

      days.push({
        date: dStr,
        dayNum: d,
        dayName: dayNames[dayOfWeek],
        shortDayName: shortDayNames[dayOfWeek],
        status: 'WORKING',
        symbol: 'W',
        label: 'Working Day',
      });
    }

    return {
      month: monthName,
      monthStr: formattedMonth,
      totalDays,
      days,
    };
  }

  // --- 8. LEAVE HISTORY ---
  getLeaveHistory(year?: number): { year: number; requests: StaffLeaveRequestItem[]; summaryByMonth: Record<string, number> } {
    const yr = year || new Date().getFullYear();
    const requests = this.getLeaveRequests({ year: yr });

    const summaryByMonth: Record<string, number> = {};
    requests.forEach((r) => {
      if (r.status === 'APPROVED') {
        const month = r.startDate.slice(0, 7);
        summaryByMonth[month] = (summaryByMonth[month] || 0) + r.durationDays;
      }
    });

    return {
      year: yr,
      requests,
      summaryByMonth,
    };
  }

  // --- 9. REQUEST PERMISSION ---
  requestPermission(input: {
    request_date: string;
    start_time: string;
    end_time: string;
    reason: string;
  }): { success: boolean; id: number; message: string } {
    const staffId = this.getStaffIdOrThrow();

    if (!input.request_date) {
      throw new Error('Permission date is required.');
    }
    if (!input.start_time || !input.end_time) {
      throw new Error('Start time and end time are required.');
    }
    if (!input.reason || input.reason.trim() === '') {
      throw new Error('Please provide a reason for the permission request.');
    }

    const [startH, startM] = input.start_time.split(':').map(Number);
    const [endH, endM] = input.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      throw new Error('End time must be later than start time.');
    }

    const durationMinutes = endMinutes - startMinutes;

    const stmt = this.db.prepare(`
      INSERT INTO permission_requests (
        staff_id, request_date, start_time, end_time, duration_minutes, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run(
      staffId,
      input.request_date,
      input.start_time,
      input.end_time,
      durationMinutes,
      input.reason.trim()
    );

    const permissionId = Number(result.lastInsertRowid);

    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'PERMISSION_REQUESTED',
      entity_type: 'PERMISSION_REQUEST',
      entity_id: permissionId,
      new_value: `Requested permission on ${input.request_date} for ${durationMinutes} mins (${input.reason.trim()})`,
    });

    return {
      success: true,
      id: permissionId,
      message: 'Permission request submitted successfully for manager approval.',
    };
  }

  // --- 10. GET PERMISSION REQUESTS ---
  getPermissionRequests(): StaffPermissionRequestItem[] {
    const staffId = this.getStaffIdOrThrow();

    const rows = this.db.prepare(`
      SELECT pr.*, u.display_name as reviewer_name
      FROM permission_requests pr
      LEFT JOIN users u ON pr.reviewed_by = u.id
      WHERE pr.staff_id = ?
      ORDER BY pr.id DESC
    `).all(staffId) as any[];

    return rows.map((r) => {
      const h = Math.floor(r.duration_minutes / 60);
      const m = r.duration_minutes % 60;
      const durationFormatted = h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;

      return {
        id: r.id,
        staffId: r.staff_id,
        requestDate: r.request_date,
        startTime: r.start_time,
        endTime: r.end_time,
        durationMinutes: r.duration_minutes,
        durationFormatted,
        reason: r.reason,
        status: r.status,
        reviewedBy: r.reviewer_name,
        reviewedAt: r.reviewed_at,
        reviewComment: r.review_comment,
        createdAt: r.created_at,
      };
    });
  }

  // --- 11. CANCEL PERMISSION REQUEST ---
  cancelPermission(id: number): { success: boolean; message: string } {
    const staffId = this.getStaffIdOrThrow();

    const row = this.db.prepare(`
      SELECT * FROM permission_requests WHERE id = ? AND staff_id = ?
    `).get(id, staffId) as any;

    if (!row) {
      throw new Error('Permission request not found or unauthorized.');
    }

    if (row.status !== 'PENDING') {
      throw new Error(`Cannot cancel a permission request that is already ${row.status.toLowerCase()}.`);
    }

    this.db.prepare(`
      UPDATE permission_requests
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    this.auditRepo.log({
      user_id: SessionService.getSession()?.userId,
      action: 'PERMISSION_CANCELLED',
      entity_type: 'PERMISSION_REQUEST',
      entity_id: id,
      new_value: `Cancelled permission request #${id}`,
    });

    return { success: true, message: 'Permission request has been cancelled.' };
  }
}
