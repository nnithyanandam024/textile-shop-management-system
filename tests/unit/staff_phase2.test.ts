import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { StaffRepository } from '../../electron/main/repositories/staffRepository';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';
import { EmergencyContactService } from '../../electron/main/services/emergencyContactService';
import { StaffBankService } from '../../electron/main/services/staffBankService';
import { StaffDocumentService } from '../../electron/main/services/staffDocumentService';
import { EmploymentHistoryService } from '../../electron/main/services/employmentHistoryService';
import { StaffNotesService } from '../../electron/main/services/staffNotesService';

describe('Staff Management System — Phase 2 Test Suite', () => {
  let db: Database.Database;
  let dbPath: string;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let emergencyService: EmergencyContactService;
  let bankService: StaffBankService;
  let historyService: EmploymentHistoryService;
  let notesService: StaffNotesService;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase2_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);
    emergencyService = new EmergencyContactService(db);
    bankService = new StaffBankService(db);
    historyService = new EmploymentHistoryService(db);
    notesService = new StaffNotesService(db);
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

  it('1. should verify Migration v4 schema & tables existence', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const names = tables.map((t) => t.name);

    expect(names).toContain('staff_emergency_contacts');
    expect(names).toContain('staff_bank_details');
    expect(names).toContain('staff_documents');
    expect(names).toContain('staff_notes');
    expect(names).toContain('staff_employment_history');
  });

  it('2. should calculate weighted profile completion percentage accurately', () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];

    const createRes = staffService.createStaff({
      first_name: 'John',
      last_name: 'Doe',
      phone: '9876543210',
      email: 'john@example.com',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    });
    const staffId = createRes.id!;

    let completion = staffService.calculateProfileCompletion(staffId);
    // Personal (first, last = 8), Contact (phone, email = 6), Employment (code, date, dept, des = 20) = 34%
    expect(completion).toBeGreaterThanOrEqual(30);

    // Add Emergency contact (+15%)
    emergencyService.saveContact({
      staff_id: staffId,
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '9998887770',
      is_primary: true,
    });

    const completionWithEmergency = staffService.calculateProfileCompletion(staffId);
    expect(completionWithEmergency).toBe(completion + 15);

    // Add Bank Setup (+15%)
    bankService.saveBankDetails({
      staff_id: staffId,
      bank_name: 'HDFC Bank',
      account_holder_name: 'John Doe',
      account_number: '123456789012',
      ifsc: 'HDFC0001234',
    });

    const completionWithBank = staffService.calculateProfileCompletion(staffId);
    expect(completionWithBank).toBe(completionWithEmergency + 15);
  });

  it('3. should handle Emergency Contacts CRUD and primary contact assignment', () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    const staffId = staffService.createStaff({
      first_name: 'Ramesh',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;

    const saveRes = emergencyService.saveContact({
      staff_id: staffId,
      name: 'Suresh',
      relationship: 'Brother',
      phone: '9123456789',
      is_primary: true,
    });

    expect(saveRes.success).toBe(true);
    const contacts = emergencyService.getContacts(staffId);
    expect(contacts.length).toBe(1);
    expect(contacts[0].is_primary).toBe(1);

    // Delete contact
    const delRes = emergencyService.deleteContact(contacts[0].id);
    expect(delRes.success).toBe(true);
    expect(emergencyService.getContacts(staffId).length).toBe(0);
  });

  it('4. should mask sensitive bank account number by default and reveal full when requested', () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    const staffId = staffService.createStaff({
      first_name: 'Priya',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;

    bankService.saveBankDetails({
      staff_id: staffId,
      bank_name: 'State Bank of India',
      account_holder_name: 'Priya S',
      account_number: '9876543210987',
      ifsc: 'SBIN0004321',
    });

    const maskedBank = bankService.getBankDetails(staffId, false);
    expect(maskedBank).toBeDefined();
    expect(maskedBank?.account_number_encrypted).toBe('••••••••0987');
    expect(maskedBank?.masked_account_number).toBe('••••••••0987');

    const revealedBank = bankService.getBankDetails(staffId, true);
    expect(revealedBank?.account_number_encrypted).toBe('9876543210987');
  });

  it('5. should prevent reporting manager self-loop validation', () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    const staffId = staffService.createStaff({
      first_name: 'Anand',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;

    const updateRes = staffService.updateStaff(staffId, {
      manager_id: staffId,
    });

    expect(updateRes.success).toBe(false);
    expect(updateRes.error).toBe('A staff member cannot report to themselves.');
  });

  it('6. should track employment history and record promotions & department transfers', () => {
    const salesDept = deptRepo.getByName('Sales')!;
    const invDept = deptRepo.getByName('Inventory')!;
    const salesExecutive = desRepo.getAll(salesDept.id)[0];
    const storeManager = desRepo.getAll(invDept.id)[0];

    const staffId = staffService.createStaff({
      first_name: 'Karthik',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: salesDept.id,
      designation_id: salesExecutive.id,
      employment_type: 'FULL_TIME',
    }).id!;

    let hList = historyService.getHistory(staffId);
    expect(hList.length).toBe(1);
    expect(hList[0].reason).toBe('Initial Joining');

    // Transfer staff member to Inventory Department
    staffService.updateStaff(staffId, {
      department_id: invDept.id,
      designation_id: storeManager.id,
    });

    hList = historyService.getHistory(staffId);
    expect(hList.length).toBe(2);
    expect(hList[0].department_name).toBe('Inventory');
  });

  it('7. should handle internal staff notes creation and deletion', () => {
    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    const staffId = staffService.createStaff({
      first_name: 'Meena',
      phone: '9876543210',
      joining_date: '2026-01-01',
      department_id: dept.id,
      designation_id: des.id,
    }).id!;

    const addRes = notesService.addNote({
      staff_id: staffId,
      note: 'Promoted to Senior Sales Lead for festival season.',
    });

    expect(addRes.success).toBe(true);
    let notes = notesService.getNotes(staffId);
    expect(notes.length).toBe(1);
    expect(notes[0].note).toContain('Promoted to Senior Sales Lead');

    notesService.deleteNote(notes[0].id);
    notes = notesService.getNotes(staffId);
    expect(notes.length).toBe(0);
  });
});
