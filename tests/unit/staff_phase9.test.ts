import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { DocumentService } from '../../electron/main/services/documentService';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';

describe('Staff Management System — Phase 9 Test Suite (Documents, Verification & Compliance)', () => {
  let db: Database.Database;
  let dbPath: string;
  let docService: DocumentService;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let testStaffId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../../test_staff_phase9_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    docService = new DocumentService(db);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);

    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    testStaffId = staffService.createStaff({
      first_name: 'Priya',
      last_name: 'Sundaram',
      phone: '9775544332',
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

  it('1. should verify Migration v11 initialization, default categories, and required document rules', () => {
    const categories = docService.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(6);
    expect(categories.some((c) => c.code === 'GOVT_ID')).toBe(true);

    const reqs = db.prepare('SELECT * FROM required_staff_documents WHERE is_required = 1').all();
    expect(reqs.length).toBeGreaterThanOrEqual(4);
  });

  it('2. should upload staff compliance document with file validation and initial PENDING verification status', () => {
    const dummyBuffer = Buffer.from('PDF_DUMMY_CONTENT_TEST');
    const uploadRes = docService.uploadDocument({
      staff_id: testStaffId,
      category_id: 1, // GOVT_ID
      document_name: 'Aadhaar Card Copy',
      document_number: '5432-8765-1092',
      file_name: 'aadhaar_priya.pdf',
      buffer: dummyBuffer,
    });

    expect(uploadRes.success).toBe(true);
    expect(uploadRes.id).toBeDefined();

    const doc = docService.getDocumentById(uploadRes.id!);
    expect(doc).toBeDefined();
    expect(doc?.document_name).toBe('Aadhaar Card Copy');
    expect(doc?.verification_status?.toUpperCase()).toBe('PENDING');
    expect(doc?.masked_document_number).toBe('XXXX-XXXX-1092');
  });

  it('3. should process manager verification and rejection workflow with rejection reason', () => {
    const dummyBuffer = Buffer.from('PDF_TEST');
    const uploadRes = docService.uploadDocument({
      staff_id: testStaffId,
      category_id: 2, // ADDRESS_PROOF
      document_name: 'Electricity Bill',
      file_name: 'utility_bill.pdf',
      buffer: dummyBuffer,
    });

    // 1. Process Rejection
    const rejectRes = docService.rejectDocument(uploadRes.id!, 'Document copy is blurry');
    expect(rejectRes.success).toBe(true);

    let doc = docService.getDocumentById(uploadRes.id!);
    expect(doc?.verification_status?.toUpperCase()).toBe('REJECTED');
    expect(doc?.rejection_reason).toBe('Document copy is blurry');

    // 2. Process Verification
    const verifyRes = docService.verifyDocument(uploadRes.id!, 1);
    expect(verifyRes.success).toBe(true);

    doc = docService.getDocumentById(uploadRes.id!);
    expect(doc?.verification_status?.toUpperCase()).toBe('VERIFIED');
  });

  it('4. should replace document file and maintain version history (v1 -> v2)', () => {
    const dummyBuffer1 = Buffer.from('VERSION_1_CONTENT');
    const uploadRes = docService.uploadDocument({
      staff_id: testStaffId,
      category_id: 3, // CONTRACT
      document_name: 'Employment Agreement',
      file_name: 'contract_v1.pdf',
      buffer: dummyBuffer1,
    });

    const docId = uploadRes.id!;
    let doc = docService.getDocumentById(docId);
    expect(doc?.version).toBe(1);

    // Replace with v2
    const dummyBuffer2 = Buffer.from('VERSION_2_REVISED_CONTENT');
    const replaceRes = docService.replaceDocument(docId, {
      file_name: 'contract_v2_signed.pdf',
      buffer: dummyBuffer2,
      reason: 'Updated signed contract',
    });

    expect(replaceRes.success).toBe(true);

    doc = docService.getDocumentById(docId);
    expect(doc?.version).toBe(2);
    expect(doc?.file_name).toBe('contract_v2_signed.pdf');
    expect(doc?.versions?.length).toBe(1);
    expect(doc?.versions?.[0].version).toBe(1);
  });

  it('5. should identify expiring and expired documents within threshold date', () => {
    const dummyBuffer = Buffer.from('TEST');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() + 15);
    const nearDateStr = nearDate.toISOString().split('T')[0];

    // Expired doc
    docService.uploadDocument({
      staff_id: testStaffId,
      category_id: 1,
      document_name: 'Expired Passport',
      expiry_date: pastDateStr,
      file_name: 'expired_passport.pdf',
      buffer: dummyBuffer,
    });

    // Expiring soon doc
    docService.uploadDocument({
      staff_id: testStaffId,
      category_id: 3,
      document_name: 'Expiring Contract',
      expiry_date: nearDateStr,
      file_name: 'expiring_contract.pdf',
      buffer: dummyBuffer,
    });

    const expiringList = docService.getExpiringDocuments(30);
    expect(expiringList.length).toBe(2);
    expect(expiringList.some((d) => d.expiry_status === 'EXPIRED')).toBe(true);
    expect(expiringList.some((d) => d.expiry_status === 'EXPIRING_SOON')).toBe(true);
  });

  it('6. should calculate staff onboarding document compliance score percentage', () => {
    const dummyBuffer = Buffer.from('TEST');

    // Upload & Verify 2 of 4 required categories
    const d1 = docService.uploadDocument({ staff_id: testStaffId, category_id: 1, document_name: 'Aadhaar', file_name: 'a.pdf', buffer: dummyBuffer });
    const d2 = docService.uploadDocument({ staff_id: testStaffId, category_id: 2, document_name: 'Utility Bill', file_name: 'b.pdf', buffer: dummyBuffer });

    docService.verifyDocument(d1.id!);
    docService.verifyDocument(d2.id!);

    const comp = docService.getStaffCompliance(testStaffId);
    expect(comp.totalRequired).toBe(4);
    expect(comp.completedCount).toBe(2);
    expect(comp.complianceScore).toBe(50); // 2/4 = 50%
    expect(comp.missingCategories.length).toBe(2);
  });
});
