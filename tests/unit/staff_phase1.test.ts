import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DepartmentService } from '../../electron/main/services/departmentService';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';
import { StaffRepository } from '../../electron/main/repositories/staffRepository';
import { StaffService } from '../../electron/main/services/staffService';

describe('Staff Management System — Phase 1 Test Suite', () => {
  let db: Database.Database;
  let dbPath: string;
  let deptRepo: DepartmentRepository;
  let deptService: DepartmentService;
  let desRepo: DesignationRepository;
  let staffRepo: StaffRepository;
  let staffService: StaffService;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../.test_db/test_staff_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    deptRepo = new DepartmentRepository(db);
    deptService = new DepartmentService(db);
    desRepo = new DesignationRepository(db);
    staffRepo = new StaffRepository(db);
    staffService = new StaffService(db);
  });

  afterEach(() => {
    closeDatabase();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore cleanup error if file locked
      }
    }
  });

  it('1. should execute Migration v3 and seed default departments and designations', () => {
    const depts = deptRepo.getAll(true);
    expect(depts.length).toBeGreaterThan(0);
    expect(depts.some((d) => d.name === 'Sales')).toBe(true);
    expect(depts.some((d) => d.name === 'Inventory')).toBe(true);

    const designations = desRepo.getAll(undefined, true);
    expect(designations.length).toBeGreaterThan(0);
    expect(designations.some((d) => d.name === 'Sales Executive')).toBe(true);
  });

  it('2. should generate sequential staff codes (STF-0001, STF-0002)', () => {
    const code1 = staffRepo.generateStaffCode();
    expect(code1).toBe('STF-0001');

    const salesDept = deptRepo.getByName('Sales')!;
    const salesExecutive = desRepo.getAll(salesDept.id).find((d) => d.name === 'Sales Executive')!;

    staffRepo.create({
      staff_code: code1,
      first_name: 'Arun',
      last_name: 'Kumar',
      phone: '9876543210',
      joining_date: '2026-08-01',
      department_id: salesDept.id,
      designation_id: salesExecutive.id,
    });

    const code2 = staffRepo.generateStaffCode();
    expect(code2).toBe('STF-0002');
  });

  it('3. should validate staff mandatory fields, phone, email, and department/designation mismatch', () => {
    const salesDept = deptRepo.getByName('Sales')!;
    const salesExecutive = desRepo.getAll(salesDept.id).find((d) => d.name === 'Sales Executive')!;
    const inventoryDept = deptRepo.getByName('Inventory')!;

    // Missing First Name
    const res1 = staffService.createStaff({
      first_name: '',
      phone: '9876543210',
      joining_date: '2026-08-01',
      department_id: salesDept.id,
      designation_id: salesExecutive.id,
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('First name');

    // Invalid Phone
    const res2 = staffService.createStaff({
      first_name: 'Arun',
      phone: '123',
      joining_date: '2026-08-01',
      department_id: salesDept.id,
      designation_id: salesExecutive.id,
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('phone');

    // Invalid Email
    const res3 = staffService.createStaff({
      first_name: 'Arun',
      phone: '9876543210',
      email: 'arun@',
      joining_date: '2026-08-01',
      department_id: salesDept.id,
      designation_id: salesExecutive.id,
    });
    expect(res3.success).toBe(false);
    expect(res3.error).toContain('email');

    // Designation belonging to wrong department
    const res4 = staffService.createStaff({
      first_name: 'Arun',
      phone: '9876543210',
      joining_date: '2026-08-01',
      department_id: inventoryDept.id, // Inventory Department
      designation_id: salesExecutive.id, // Sales Executive Designation
    });
    expect(res4.success).toBe(false);
    expect(res4.error).toContain('does not belong to Department');
  });

  it('4. should process Staff CRUD, search by name/code/phone, filter by department, and paginate', () => {
    const salesDept = deptRepo.getByName('Sales')!;
    const salesDes = desRepo.getAll(salesDept.id)[0];

    const invDept = deptRepo.getByName('Inventory')!;
    const invDes = desRepo.getAll(invDept.id)[0];

    const s1 = staffService.createStaff({
      first_name: 'Arun',
      last_name: 'Kumar',
      phone: '9876500001',
      email: 'arun@example.com',
      joining_date: '2026-08-01',
      department_id: salesDept.id,
      designation_id: salesDes.id,
      employment_type: 'FULL_TIME',
    });
    expect(s1.success).toBe(true);

    const s2 = staffService.createStaff({
      first_name: 'Priya',
      last_name: 'Sharma',
      phone: '9876500002',
      email: 'priya@example.com',
      joining_date: '2026-08-05',
      department_id: invDept.id,
      designation_id: invDes.id,
      employment_type: 'PART_TIME',
    });
    expect(s2.success).toBe(true);

    // Search by Name
    const searchRes = staffService.getStaffList({ search: 'Arun' });
    expect(searchRes.total).toBe(1);
    expect(searchRes.staff[0].first_name).toBe('Arun');

    // Filter by Department
    const deptRes = staffService.getStaffList({ department_id: invDept.id });
    expect(deptRes.total).toBe(1);
    expect(deptRes.staff[0].first_name).toBe('Priya');

    // Update Staff
    const updateRes = staffService.updateStaff(s1.id!, { last_name: 'Verma' });
    expect(updateRes.success).toBe(true);
    expect(staffService.getStaffById(s1.id!)?.last_name).toBe('Verma');
  });

  it('5. should perform soft deactivation and prevent deleting departments with active staff', () => {
    const salesDept = deptRepo.getByName('Sales')!;
    const salesDes = desRepo.getAll(salesDept.id)[0];

    const s1 = staffService.createStaff({
      first_name: 'Suresh',
      phone: '9123456789',
      joining_date: '2026-08-10',
      department_id: salesDept.id,
      designation_id: salesDes.id,
    });
    expect(s1.success).toBe(true);

    // Try deactivating department with active staff -> must fail with activeStaffCount > 0
    const deactDeptRes = deptService.deactivateDepartment(salesDept.id);
    expect(deactDeptRes.success).toBe(false);
    expect(deactDeptRes.activeStaffCount).toBe(1);

    // Soft deactivate staff
    const deactStaffRes = staffService.deactivateStaff(s1.id!);
    expect(deactStaffRes.success).toBe(true);

    // Verify staff is INACTIVE but historical record exists
    const staff = staffService.getStaffById(s1.id!);
    expect(staff?.status).toBe('INACTIVE');

    // Now department deactivation succeeds
    const deactDeptRes2 = deptService.deactivateDepartment(salesDept.id);
    expect(deactDeptRes2.success).toBe(true);
  });
});
