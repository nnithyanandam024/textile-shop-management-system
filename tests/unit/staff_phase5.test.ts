import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { ShiftService } from '../../electron/main/services/shiftService';
import { AttendanceService } from '../../electron/main/services/attendanceService';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';

describe('Staff Management System — Phase 5 Test Suite (Shift & Work Schedule Management)', () => {
  let db: Database.Database;
  let dbPath: string;
  let shiftService: ShiftService;
  let attendanceService: AttendanceService;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let testStaffId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../../test_staff_phase5_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    shiftService = new ShiftService(db);
    attendanceService = new AttendanceService(db);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);

    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    testStaffId = staffService.createStaff({
      first_name: 'Anand',
      last_name: 'Kumar',
      phone: '9123456789',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;
  });

  afterEach(() => {
    closeDatabase();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore cleanup lock
      }
    }
  });

  it('1. should verify Migration v7 initialization and default shift templates', () => {
    const templates = shiftService.getTemplates(true);
    expect(templates.length).toBeGreaterThanOrEqual(3);

    const morning = templates.find((t) => t.shift_code === 'SFT-001');
    const general = templates.find((t) => t.shift_code === 'SFT-002');
    const evening = templates.find((t) => t.shift_code === 'SFT-003');

    expect(morning?.name).toBe('Morning Shift');
    expect(morning?.start_time).toBe('08:00');
    expect(general?.start_time).toBe('09:00');
    expect(evening?.start_time).toBe('13:00');
  });

  it('2. should support creating custom shift template and editing timings', () => {
    const createRes = shiftService.createTemplate({
      shift_code: 'NIGHT',
      name: 'Night Shift',
      start_time: '22:00',
      end_time: '06:00',
      grace_minutes: 15,
      break_minutes: 60,
      minimum_work_minutes: 420,
      is_overnight: true,
    });

    expect(createRes.success).toBe(true);
    expect(createRes.id).toBeDefined();

    const created = shiftService.getTemplateById(createRes.id!);
    expect(created?.shift_code).toBe('NIGHT');
    expect(created?.is_overnight).toBe(1);

    const updateRes = shiftService.updateTemplate(createRes.id!, {
      name: 'Late Night Shift',
      grace_minutes: 20,
    });
    expect(updateRes.success).toBe(true);

    const updated = shiftService.getTemplateById(createRes.id!);
    expect(updated?.name).toBe('Late Night Shift');
    expect(updated?.grace_minutes).toBe(20);
  });

  it('3. should enforce 4-tier shift resolution priority hierarchy', () => {
    const templates = shiftService.getTemplates();
    const morning = templates.find((t) => t.shift_code === 'SFT-001')!;
    const evening = templates.find((t) => t.shift_code === 'SFT-003')!;

    // Level 4: Fallback Default Shift for unassigned staff (e.g. 2026-08-17 Monday)
    let res = shiftService.resolveStaffShiftForDate(testStaffId, '2026-08-17');
    expect(res.source).toBe('DEFAULT');
    expect(res.template.shift_code).toBe('SFT-002');

    // Level 3: Long-term Shift Assignment (Assign Morning Shift effective from 2026-08-01)
    shiftService.assignShift({
      staff_id: testStaffId,
      shift_template_id: morning.id,
      effective_from: '2026-08-01',
    });

    res = shiftService.resolveStaffShiftForDate(testStaffId, '2026-08-17'); // Monday
    expect(res.source).toBe('ASSIGNMENT');
    expect(res.template.shift_code).toBe('SFT-001');

    // Level 1: Temporary Override for 2026-08-17 to Evening Shift
    shiftService.createOverride({
      staff_id: testStaffId,
      override_date: '2026-08-17',
      shift_template_id: evening.id,
      reason: 'Special store event',
    });

    res = shiftService.resolveStaffShiftForDate(testStaffId, '2026-08-17');
    expect(res.source).toBe('OVERRIDE');
    expect(res.template.shift_code).toBe('SFT-003');
    expect(res.overrideReason).toBe('Special store event');

    // Next day (2026-08-18 Tuesday) should revert back to Level 3 Morning Assignment
    const nextDayRes = shiftService.resolveStaffShiftForDate(testStaffId, '2026-08-18');
    expect(nextDayRes.source).toBe('ASSIGNMENT');
    expect(nextDayRes.template.shift_code).toBe('SFT-001');
  });

  it('4. should calculate late arrival dynamically based on staff assigned shift', () => {
    const templates = shiftService.getTemplates();
    const morning = templates.find((t) => t.shift_code === 'SFT-001')!;

    // Assign Morning Shift (08:00 AM start, Grace 10m)
    shiftService.assignShift({
      staff_id: testStaffId,
      shift_template_id: morning.id,
      effective_from: '2026-01-01',
    });

    // Check in at 08:20 AM => Late by 20 minutes against Morning 08:00 start
    attendanceService.checkIn(testStaffId, '08:20');

    const todayStr = new Date().toISOString().split('T')[0];
    const daily = attendanceService.getDailyAttendanceList(todayStr);
    const record = daily.list.find((r) => r.staff_id === testStaffId)!;

    expect(record.check_in).toBe('08:20');
    expect(record.late_minutes).toBe(20);
  });

  it('5. should calculate overtime minutes when worked hours exceed assigned shift scheduled minutes', () => {
    const templates = shiftService.getTemplates();
    const general = templates.find((t) => t.shift_code === 'SFT-002')!; // 09:00 -> 18:00 (480 mins scheduled)

    shiftService.assignShift({
      staff_id: testStaffId,
      shift_template_id: general.id,
      effective_from: '2026-01-01',
    });

    const todayStr = new Date().toISOString().split('T')[0];
    attendanceService.checkIn(testStaffId, '09:00');

    // Check out at 20:00 PM (11 hours = 660 mins gross => Worked 660 mins, Scheduled 480 mins => 180 mins OT)
    attendanceService.checkOut(testStaffId, '20:00');

    const attRow: any = db.prepare('SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?').get(testStaffId, todayStr);
    expect(attRow.worked_minutes).toBe(660);
    expect(attRow.overtime_minutes).toBe(180);
    expect(attRow.overtime_status).toBe('PENDING');
  });

  it('6. should preserve staff shift assignment history when updating assignments', () => {
    const templates = shiftService.getTemplates();
    const morning = templates.find((t) => t.shift_code === 'SFT-001')!;
    const evening = templates.find((t) => t.shift_code === 'SFT-003')!;

    // Initial assignment
    shiftService.assignShift({
      staff_id: testStaffId,
      shift_template_id: morning.id,
      effective_from: '2026-01-01',
    });

    // New assignment effective from 2026-09-01
    shiftService.assignShift({
      staff_id: testStaffId,
      shift_template_id: evening.id,
      effective_from: '2026-09-01',
      reason: 'Roster rotation',
    });

    const history = shiftService.getStaffShiftHistory(testStaffId);
    expect(history.length).toBe(2);
    expect(history[0].shift_code).toBe('SFT-003');
    expect(history[1].shift_code).toBe('SFT-001');
    expect(history[1].effective_to).toBe('2026-08-31');
  });
});
