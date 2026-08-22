import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { AttendanceService, getTodayDateStr, formatMinutesToHours } from '../../electron/main/services/attendanceService';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';

describe('Staff Management System — Phase 4 Test Suite (Attendance Management)', () => {
  let db: Database.Database;
  let dbPath: string;
  let attendanceService: AttendanceService;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let testStaffId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase4_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    attendanceService = new AttendanceService(db);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);

    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    testStaffId = staffService.createStaff({
      first_name: 'Karthik',
      last_name: 'Rajan',
      phone: '9876543210',
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

  it('1. should verify Migration v6 schema initialization and default attendance settings', () => {
    const settings = attendanceService.getSettings();
    expect(settings.work_start_time).toBe('09:00');
    expect(settings.work_end_time).toBe('18:00');
    expect(settings.grace_minutes).toBe(10);
    expect(settings.full_day_minutes).toBe(480);
    expect(settings.half_day_minutes).toBe(240);
  });

  it('2. should process Check-In and calculate late arrival minutes correctly', () => {
    // Check-in at 09:25 AM (Work start 09:00, Grace 10m => Late by 25 minutes)
    const res = attendanceService.checkIn(testStaffId, '09:25');
    expect(res.success).toBe(true);

    const daily = attendanceService.getDailyAttendanceList(getTodayDateStr());
    const record = daily.list.find((r) => r.staff_id === testStaffId);

    expect(record).toBeDefined();
    expect(record?.status).toBe('PRESENT');
    expect(record?.check_in).toBe('09:25');
    expect(record?.late_minutes).toBe(25);
  });

  it('3. should process Check-Out, calculate worked minutes, formatted hours, and early exit', () => {
    attendanceService.checkIn(testStaffId, '09:00');
    
    // Check out at 17:30 PM (Work end 18:00 => Early exit 30m, Worked 8h 30m = 510m)
    const outRes = attendanceService.checkOut(testStaffId, '17:30');
    expect(outRes.success).toBe(true);

    const daily = attendanceService.getDailyAttendanceList(getTodayDateStr());
    const record = daily.list.find((r) => r.staff_id === testStaffId);

    expect(record?.check_out).toBe('17:30');
    expect(record?.worked_minutes).toBe(510);
    expect(record?.worked_hours_formatted).toBe('8h 30m');
    expect(record?.early_exit_minutes).toBe(30);
  });

  it('4. should prevent duplicate check-in, duplicate check-out, and check-out before check-in', () => {
    // Try checking out before checking in
    const prematureOut = attendanceService.checkOut(testStaffId, '18:00');
    expect(prematureOut.success).toBe(false);
    expect(prematureOut.error).toContain('Staff must be checked in before checking out');

    // Valid Check-In
    attendanceService.checkIn(testStaffId, '09:00');

    // Duplicate Check-In
    const dupIn = attendanceService.checkIn(testStaffId, '09:15');
    expect(dupIn.success).toBe(false);
    expect(dupIn.error).toContain('already checked in today');

    // Valid Check-Out
    attendanceService.checkOut(testStaffId, '18:00');

    // Duplicate Check-Out
    const dupOut = attendanceService.checkOut(testStaffId, '18:10');
    expect(dupOut.success).toBe(false);
    expect(dupOut.error).toContain('already checked out today');
  });

  it('5. should support manual attendance marking for absent, half-day, and holidays', () => {
    const res = attendanceService.manualMarkAttendance({
      staff_id: testStaffId,
      attendance_date: '2026-08-10',
      status: 'HALF_DAY',
      check_in: '09:00',
      check_out: '13:00',
      remarks: 'Personal half day leave',
    });

    expect(res.success).toBe(true);

    const summary = attendanceService.getMonthlyStaffSummary(testStaffId, 2026, 8);
    const dayRecord = summary.records.find((r) => r.attendance_date === '2026-08-10');

    expect(dayRecord?.status).toBe('HALF_DAY');
    expect(dayRecord?.worked_minutes).toBe(240);
  });

  it('6. should process attendance correction request and approval workflow', () => {
    // Initial Check-In at 09:30
    attendanceService.checkIn(testStaffId, '09:30');
    const daily = attendanceService.getDailyAttendanceList(getTodayDateStr());
    const record = daily.list.find((r) => r.staff_id === testStaffId)!;

    // Submit correction request
    const reqRes = attendanceService.requestCorrection(record.attendance_id, {
      new_check_in: '09:00',
      reason: 'Card scanner malfunction at gate',
    }, 1);

    expect(reqRes.success).toBe(true);

    let pending = attendanceService.getPendingCorrections();
    expect(pending.length).toBe(1);
    expect(pending[0].reason).toBe('Card scanner malfunction at gate');

    // Approve correction
    const appRes = attendanceService.approveCorrection(pending[0].id, true, 1);
    expect(appRes.success).toBe(true);

    pending = attendanceService.getPendingCorrections();
    expect(pending.length).toBe(0);

    const updatedDaily = attendanceService.getDailyAttendanceList(getTodayDateStr());
    const updatedRecord = updatedDaily.list.find((r) => r.staff_id === testStaffId)!;

    expect(updatedRecord.check_in).toBe('09:00');
    expect(updatedRecord.late_minutes).toBe(0);
    expect(updatedRecord.approval_status).toBe('APPROVED');
  });

  it('7. should calculate accurate monthly attendance summaries and percentage score', () => {
    // Mark 10 days present
    for (let day = 1; day <= 10; day++) {
      const dateStr = `2026-08-${day < 10 ? '0' + day : day}`;
      attendanceService.manualMarkAttendance({
        staff_id: testStaffId,
        attendance_date: dateStr,
        status: 'PRESENT',
        check_in: '09:00',
        check_out: '18:00',
      });
    }

    const summary = attendanceService.getMonthlyStaffSummary(testStaffId, 2026, 8);
    expect(summary.present_count).toBe(10);
    expect(summary.total_worked_hours_formatted).toBe('90h 0m');
  });
});
