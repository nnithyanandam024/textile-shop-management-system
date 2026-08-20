import Database from 'better-sqlite3';
import { ShiftService, ResolvedShift } from './shiftService';
import { SessionService } from './auth/sessionService';
import { AuditRepository } from '../repositories/auditRepository';
import { getTodayDateStr } from './attendanceService';
import log from 'electron-log';

export interface StaffShiftItem {
  id?: number;
  date: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  dayName: string;
  shortDayName: string;
  shiftName: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  breakMinutes: number;
  graceMinutes: number;
  workLocation: string;
  departmentName: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'WEEK_OFF' | 'HOLIDAY' | 'LEAVE' | 'CHANGED' | 'NO_SHIFT';
  symbol: string; // 'M', 'E', 'G', 'OFF', 'H', 'L', '—'
  isWeekOff: boolean;
  isHoliday: boolean;
  isLeave: boolean;
  isOverride: boolean;
  holidayName?: string;
  leaveTypeName?: string;
  overrideReason?: string;
}

export interface ShiftChangeRequestInput {
  target_date: string;
  requested_shift_template_id?: number;
  is_requested_week_off?: boolean;
  reason: string;
}

export interface ShiftSwapRequestInput {
  target_staff_id: number;
  shift_date: string;
  reason: string;
}

export interface ShiftRequestItem {
  id: number;
  type: 'CHANGE' | 'SWAP';
  date: string;
  currentShiftName?: string;
  requestedShiftName?: string;
  isRequestedWeekOff?: boolean;
  targetStaffId?: number;
  targetStaffName?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
}

export class StaffShiftService {
  private shiftService: ShiftService;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.shiftService = new ShiftService(db);
    this.auditRepo = new AuditRepository(db);
  }

  private getStaffIdOrThrow(): number {
    const session = SessionService.getSession();
    if (!session || !session.staffId) {
      throw new Error('Unauthorized: Active staff session required.');
    }
    return session.staffId;
  }

  // --- RESOLVE SINGLE DATE SHIFT ---
  resolveShiftForStaffDate(staffId: number, dateStr: string): StaffShiftItem {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get staff location and department
    const staffRow = this.db.prepare(`
      SELECT s.work_location, d.name as department_name
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.id = ?
    `).get(staffId) as any;

    const workLocation = staffRow?.work_location || 'Main Store';
    const departmentName = staffRow?.department_name || 'Storefront Sales';

    // 1. Check Store Holiday
    const holidayRow = this.db.prepare(`
      SELECT name FROM holidays WHERE holiday_date = ?
    `).get(dateStr) as any;

    if (holidayRow) {
      return {
        date: dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        shortDayName: shortDayNames[dayOfWeek],
        shiftName: 'Store Holiday',
        shiftCode: 'HOL',
        startTime: '—',
        endTime: '—',
        breakStart: '—',
        breakEnd: '—',
        breakMinutes: 0,
        graceMinutes: 0,
        workLocation,
        departmentName,
        status: 'HOLIDAY',
        symbol: 'H',
        isWeekOff: false,
        isHoliday: true,
        isLeave: false,
        isOverride: false,
        holidayName: holidayRow.name,
      };
    }

    // 2. Check Approved Leave
    const leaveRow = this.db.prepare(`
      SELECT lr.*, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.staff_id = ?
        AND lr.status = 'APPROVED'
        AND ? BETWEEN lr.start_date AND lr.end_date
      LIMIT 1
    `).get(staffId, dateStr) as any;

    if (leaveRow) {
      return {
        date: dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        shortDayName: shortDayNames[dayOfWeek],
        shiftName: `Leave: ${leaveRow.leave_type_name}`,
        shiftCode: 'LEAVE',
        startTime: '—',
        endTime: '—',
        breakStart: '—',
        breakEnd: '—',
        breakMinutes: 0,
        graceMinutes: 0,
        workLocation,
        departmentName,
        status: 'LEAVE',
        symbol: 'L',
        isWeekOff: false,
        isHoliday: false,
        isLeave: true,
        isOverride: false,
        leaveTypeName: leaveRow.leave_type_name,
      };
    }

    // 3. Resolve Shift Hierarchy (Override -> Daily Schedule -> Assignment -> Default)
    let resolved: ResolvedShift;
    try {
      resolved = this.shiftService.resolveStaffShiftForDate(staffId, dateStr);
    } catch {
      resolved = {
        template: {
          id: 1,
          shift_code: 'MS-01',
          name: 'Morning Shift',
          start_time: '09:00',
          end_time: '18:00',
          grace_minutes: 15,
          break_minutes: 60,
          minimum_work_minutes: 480,
          is_overnight: 0,
          status: 'ACTIVE',
          created_at: '',
          updated_at: '',
        },
        isWeekOff: false,
        source: 'DEFAULT',
      };
    }

    if (resolved.isWeekOff) {
      return {
        date: dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        shortDayName: shortDayNames[dayOfWeek],
        shiftName: 'Weekly Off',
        shiftCode: 'OFF',
        startTime: '—',
        endTime: '—',
        breakStart: '—',
        breakEnd: '—',
        breakMinutes: 0,
        graceMinutes: 0,
        workLocation,
        departmentName,
        status: 'WEEK_OFF',
        symbol: 'OFF',
        isWeekOff: true,
        isHoliday: false,
        isLeave: false,
        isOverride: resolved.source === 'OVERRIDE',
        overrideReason: resolved.overrideReason,
      };
    }

    const t = resolved.template;
    const isOverride = resolved.source === 'OVERRIDE';

    // Calculate approximate break window (mid-shift e.g. 13:00-14:00)
    let breakStart = '13:00';
    let breakEnd = '14:00';
    try {
      const [startH] = t.start_time.split(':').map(Number);
      const [endH] = t.end_time.split(':').map(Number);
      const midH = Math.floor((startH + (endH > startH ? endH : endH + 24)) / 2);
      breakStart = `${String(midH % 24).padStart(2, '0')}:00`;
      breakEnd = `${String((midH + 1) % 24).padStart(2, '0')}:00`;
    } catch {
      // fallback
    }

    // Assign symbol
    let symbol = 'G';
    const lowerName = t.name.toLowerCase();
    if (lowerName.includes('morning')) symbol = 'M';
    else if (lowerName.includes('evening') || lowerName.includes('night')) symbol = 'E';
    else if (lowerName.includes('general')) symbol = 'G';

    return {
      id: t.id,
      date: dateStr,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      shortDayName: shortDayNames[dayOfWeek],
      shiftName: t.name,
      shiftCode: t.shift_code,
      startTime: t.start_time,
      endTime: t.end_time,
      breakStart,
      breakEnd,
      breakMinutes: t.break_minutes || 60,
      graceMinutes: t.grace_minutes || 15,
      workLocation,
      departmentName,
      status: isOverride ? 'CHANGED' : 'SCHEDULED',
      symbol,
      isWeekOff: false,
      isHoliday: false,
      isLeave: false,
      isOverride,
      overrideReason: resolved.overrideReason,
    };
  }

  // --- TODAY'S SHIFT ---
  getTodayShift(): StaffShiftItem {
    const staffId = this.getStaffIdOrThrow();
    const todayStr = getTodayDateStr();
    return this.resolveShiftForStaffDate(staffId, todayStr);
  }

  // --- WEEKLY SCHEDULE ---
  getWeeklySchedule(weekStartDate?: string): { weekStart: string; weekEnd: string; days: StaffShiftItem[] } {
    const staffId = this.getStaffIdOrThrow();
    let start: Date;

    if (weekStartDate) {
      const [y, m, d] = weekStartDate.split('-').map(Number);
      start = new Date(y, m - 1, d);
    } else {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
      start = new Date(now.getFullYear(), now.getMonth(), diff);
    }

    const days: StaffShiftItem[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dStr = `${yyyy}-${mm}-${dd}`;
      days.push(this.resolveShiftForStaffDate(staffId, dStr));
    }

    const weekStart = days[0].date;
    const weekEnd = days[6].date;

    return { weekStart, weekEnd, days };
  }

  // --- MONTHLY SCHEDULE ---
  getMonthlySchedule(monthStr?: string): { month: string; monthStr: string; totalDays: number; days: StaffShiftItem[] } {
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

    const days: StaffShiftItem[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(this.resolveShiftForStaffDate(staffId, dStr));
    }

    return {
      month: monthName,
      monthStr: formattedMonth,
      totalDays,
      days,
    };
  }

  // --- UPCOMING SHIFTS ---
  getUpcomingShifts(count: number = 7): StaffShiftItem[] {
    const staffId = this.getStaffIdOrThrow();
    const today = new Date();
    const list: StaffShiftItem[] = [];

    for (let i = 1; i <= count; i++) {
      const cur = new Date(today);
      cur.setDate(today.getDate() + i);
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dStr = `${yyyy}-${mm}-${dd}`;
      list.push(this.resolveShiftForStaffDate(staffId, dStr));
    }

    return list;
  }

  // --- SHIFT DETAILS BY DATE ---
  getShiftDetails(dateStr: string): StaffShiftItem {
    const staffId = this.getStaffIdOrThrow();
    return this.resolveShiftForStaffDate(staffId, dateStr);
  }

  // --- SHIFT HISTORY ---
  getShiftHistory(filter?: { month?: string }): StaffShiftItem[] {
    const staffId = this.getStaffIdOrThrow();
    const targetMonth = filter?.month || getTodayDateStr().slice(0, 7);
    const [y, m] = targetMonth.split('-').map(Number);
    const totalDays = new Date(y, m, 0).getDate();
    const todayStr = getTodayDateStr();

    const history: StaffShiftItem[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (dStr <= todayStr) {
        history.push(this.resolveShiftForStaffDate(staffId, dStr));
      }
    }

    return history.reverse(); // Most recent first
  }

  // --- SHIFT CHANGE REQUEST ---
  requestShiftChange(input: ShiftChangeRequestInput): { success: boolean; id: number; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (!input.target_date) {
      throw new Error('Target date is required for shift change request.');
    }
    if (!input.reason || !input.reason.trim()) {
      throw new Error('Reason is required for shift change request.');
    }

    // Check for existing pending request
    const existing = this.db.prepare(`
      SELECT id FROM shift_change_requests
      WHERE staff_id = ? AND target_date = ? AND status = 'PENDING'
    `).get(staffId, input.target_date) as any;

    if (existing) {
      throw new Error('You already have a pending shift change request for this date.');
    }

    const res = this.db.prepare(`
      INSERT INTO shift_change_requests (
        staff_id, target_date, requested_shift_template_id, is_requested_week_off, reason, status
      ) VALUES (?, ?, ?, ?, ?, 'PENDING')
    `).run(
      staffId,
      input.target_date,
      input.requested_shift_template_id || null,
      input.is_requested_week_off ? 1 : 0,
      input.reason.trim()
    );

    const reqId = Number(res.lastInsertRowid);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'SHIFT_CHANGE_REQUESTED',
      entity_type: 'SHIFT_CHANGE_REQUEST',
      entity_id: reqId,
      new_value: `Requested shift change for ${input.target_date}: ${input.reason}`,
    });

    log.info(`Staff #${staffId} submitted shift change request #${reqId} for ${input.target_date}.`);

    return {
      success: true,
      id: reqId,
      message: 'Shift change request submitted successfully and queued for manager review.',
    };
  }

  // --- SHIFT SWAP REQUEST ---
  requestShiftSwap(input: ShiftSwapRequestInput): { success: boolean; id: number; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (!input.shift_date) {
      throw new Error('Shift date is required for swap request.');
    }
    if (!input.target_staff_id) {
      throw new Error('Please select a peer staff member to swap with.');
    }
    if (input.target_staff_id === staffId) {
      throw new Error('Cannot swap shifts with yourself.');
    }
    if (!input.reason || !input.reason.trim()) {
      throw new Error('Reason is required for shift swap request.');
    }

    // Verify target staff exists
    const targetStaff = this.db.prepare(`
      SELECT id, first_name, last_name FROM staff WHERE id = ? AND status = 'ACTIVE'
    `).get(input.target_staff_id) as any;

    if (!targetStaff) {
      throw new Error('Selected peer staff member not found or is inactive.');
    }

    // Check for existing pending request
    const existing = this.db.prepare(`
      SELECT id FROM shift_swap_requests
      WHERE requester_staff_id = ? AND shift_date = ? AND status = 'PENDING'
    `).get(staffId, input.shift_date) as any;

    if (existing) {
      throw new Error('You already have a pending shift swap request for this date.');
    }

    const res = this.db.prepare(`
      INSERT INTO shift_swap_requests (
        requester_staff_id, target_staff_id, shift_date, reason, status
      ) VALUES (?, ?, ?, ?, 'PENDING')
    `).run(staffId, input.target_staff_id, input.shift_date, input.reason.trim());

    const reqId = Number(res.lastInsertRowid);

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'SHIFT_SWAP_REQUESTED',
      entity_type: 'SHIFT_SWAP_REQUEST',
      entity_id: reqId,
      new_value: `Requested shift swap on ${input.shift_date} with ${targetStaff.first_name} ${targetStaff.last_name}`,
    });

    log.info(`Staff #${staffId} submitted shift swap request #${reqId} with Staff #${input.target_staff_id}.`);

    return {
      success: true,
      id: reqId,
      message: `Shift swap request with ${targetStaff.first_name} ${targetStaff.last_name} submitted successfully.`,
    };
  }

  // --- GET SHIFT REQUESTS ---
  getShiftRequests(): ShiftRequestItem[] {
    const staffId = this.getStaffIdOrThrow();

    const changeRows = this.db.prepare(`
      SELECT scr.*, st.name as requested_shift_name, u.display_name as reviewer_name
      FROM shift_change_requests scr
      LEFT JOIN shift_templates st ON scr.requested_shift_template_id = st.id
      LEFT JOIN users u ON scr.reviewed_by = u.id
      WHERE scr.staff_id = ?
      ORDER BY scr.id DESC
    `).all(staffId) as any[];

    const swapRows = this.db.prepare(`
      SELECT ssr.*, s.first_name as target_first_name, s.last_name as target_last_name,
             u.display_name as reviewer_name
      FROM shift_swap_requests ssr
      JOIN staff s ON ssr.target_staff_id = s.id
      LEFT JOIN users u ON ssr.reviewed_by = u.id
      WHERE ssr.requester_staff_id = ?
      ORDER BY ssr.id DESC
    `).all(staffId) as any[];

    const list: ShiftRequestItem[] = [];

    changeRows.forEach((r) => {
      list.push({
        id: r.id,
        type: 'CHANGE',
        date: r.target_date,
        requestedShiftName: r.requested_shift_name || (r.is_requested_week_off ? 'Weekly Off' : 'Custom'),
        isRequestedWeekOff: Boolean(r.is_requested_week_off),
        reason: r.reason,
        status: r.status,
        reviewedBy: r.reviewer_name,
        reviewComment: r.review_comment,
        createdAt: r.created_at,
      });
    });

    swapRows.forEach((r) => {
      list.push({
        id: r.id,
        type: 'SWAP',
        date: r.shift_date,
        targetStaffId: r.target_staff_id,
        targetStaffName: `${r.target_first_name} ${r.target_last_name}`,
        reason: r.reason,
        status: r.status,
        reviewedBy: r.reviewer_name,
        reviewComment: r.review_comment,
        createdAt: r.created_at,
      });
    });

    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return list;
  }

  // --- CANCEL REQUEST ---
  cancelShiftRequest(id: number, type: 'CHANGE' | 'SWAP'): { success: boolean; message: string } {
    const staffId = this.getStaffIdOrThrow();
    const session = SessionService.getSession();

    if (type === 'CHANGE') {
      const row = this.db.prepare(`
        SELECT id, status FROM shift_change_requests WHERE id = ? AND staff_id = ?
      `).get(id, staffId) as any;

      if (!row) throw new Error('Request not found.');
      if (row.status !== 'PENDING') throw new Error('Only pending requests can be cancelled.');

      this.db.prepare(`
        UPDATE shift_change_requests SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(id);
    } else {
      const row = this.db.prepare(`
        SELECT id, status FROM shift_swap_requests WHERE id = ? AND requester_staff_id = ?
      `).get(id, staffId) as any;

      if (!row) throw new Error('Request not found.');
      if (row.status !== 'PENDING') throw new Error('Only pending requests can be cancelled.');

      this.db.prepare(`
        UPDATE shift_swap_requests SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(id);
    }

    this.auditRepo.log({
      user_id: session?.userId || undefined,
      action: 'SHIFT_REQUEST_CANCELLED',
      entity_type: type === 'CHANGE' ? 'SHIFT_CHANGE_REQUEST' : 'SHIFT_SWAP_REQUEST',
      entity_id: id,
      new_value: `Cancelled ${type} request #${id}`,
    });

    return { success: true, message: 'Request cancelled successfully.' };
  }

  // --- GET SWAP CANDIDATES ---
  getSwapCandidates(dateStr: string): Array<{ id: number; name: string; staffCode: string; currentShift: string }> {
    const staffId = this.getStaffIdOrThrow();

    const peers = this.db.prepare(`
      SELECT id, staff_code, first_name, last_name
      FROM staff
      WHERE id != ? AND status = 'ACTIVE'
      ORDER BY first_name ASC
    `).all(staffId) as any[];

    return peers.map((p) => {
      const peerShift = this.resolveShiftForStaffDate(p.id, dateStr);
      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        staffCode: p.staff_code,
        currentShift: peerShift.shiftName,
      };
    });
  }

  // --- GET SHIFT TEMPLATES (FOR DROPDOWN) ---
  getAllShiftTemplates(): Array<{ id: number; name: string; startTime: string; endTime: string }> {
    const templates = this.shiftService.getTemplates();
    return templates.map((t: any) => ({
      id: t.id,
      name: t.name,
      startTime: t.start_time,
      endTime: t.end_time,
    }));
  }
}
