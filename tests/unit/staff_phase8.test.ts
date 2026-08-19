import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { PerformanceService } from '../../electron/main/services/performanceService';
import { StaffService } from '../../electron/main/services/staffService';
import { DepartmentRepository } from '../../electron/main/repositories/departmentRepository';
import { DesignationRepository } from '../../electron/main/repositories/designationRepository';

describe('Staff Management System — Phase 8 Test Suite (Performance & Appraisal)', () => {
  let db: Database.Database;
  let dbPath: string;
  let perfService: PerformanceService;
  let staffService: StaffService;
  let deptRepo: DepartmentRepository;
  let desRepo: DesignationRepository;
  let testStaffId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../../test_staff_phase8_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    perfService = new PerformanceService(db);
    staffService = new StaffService(db);
    deptRepo = new DepartmentRepository(db);
    desRepo = new DesignationRepository(db);

    const dept = deptRepo.getByName('Sales')!;
    const des = desRepo.getAll(dept.id)[0];
    testStaffId = staffService.createStaff({
      first_name: 'Arun',
      last_name: 'Kumar',
      phone: '9884433221',
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

  it('1. should verify Migration v10 initialization, default KPIs, and rating scales', () => {
    const cycles = perfService.getCycles();
    expect(cycles).toBeDefined();

    const kpis = perfService.getKPIs();
    expect(kpis.length).toBeGreaterThanOrEqual(4);
    expect(kpis.some((k) => k.code === 'SALES_VOL')).toBe(true);

    const scales = db.prepare('SELECT * FROM performance_rating_scales').all() as any[];
    expect(scales.length).toBeGreaterThanOrEqual(5);
    expect(scales.some((s) => s.label === 'Excellent')).toBe(true);
  });

  it('2. should create appraisal cycle and track staff goal percentage progress', () => {
    const cycleRes = perfService.createCycle({
      name: 'Q3 2026 Appraisal',
      type: 'QUARTERLY',
      start_date: '2026-07-01',
      end_date: '2026-09-30',
    });

    expect(cycleRes.success).toBe(true);
    expect(cycleRes.id).toBeDefined();

    const goalRes = perfService.createGoal({
      staff_id: testStaffId,
      cycle_id: cycleRes.id,
      title: 'Increase Monthly Sales',
      target_value: 500000,
      unit: '₹',
      weight: 40,
    });

    expect(goalRes.success).toBe(true);

    // Update progress to 425,000 (85%)
    perfService.updateGoalProgress(goalRes.id!, 425000);

    const goals = perfService.getGoals({ staffId: testStaffId });
    expect(goals.length).toBe(1);
    expect(goals[0].current_value).toBe(425000);
    expect(goals[0].progress_percentage).toBe(85);
  });

  it('3. should assign weighted KPIs and record actual metrics', () => {
    const cycleRes = perfService.createCycle({
      name: 'August 2026 Monthly Review',
      type: 'MONTHLY',
      start_date: '2026-08-01',
      end_date: '2026-08-31',
    });

    const assignRes = perfService.assignStaffKPIs(testStaffId, cycleRes.id!, [
      { kpi_id: 1, target: 500000, weight: 40 }, // Sales Target
      { kpi_id: 2, target: 95, weight: 20 }, // Attendance %
      { kpi_id: 3, target: 90, weight: 15 }, // Punctuality
      { kpi_id: 4, target: 90, weight: 25 }, // Customer Satisfaction
    ]);

    expect(assignRes.success).toBe(true);
  });

  it('4. should process employee self-review submission', () => {
    const cycleRes = perfService.createCycle({
      name: 'Q3 2026 Appraisal',
      type: 'QUARTERLY',
      start_date: '2026-07-01',
      end_date: '2026-09-30',
    });

    const selfRes = perfService.submitSelfReview({
      staff_id: testStaffId,
      cycle_id: cycleRes.id!,
      achievements: 'Completed sales target of ₹4,75,000 and improved customer follow-up.',
      challenges: 'Inventory stockouts on popular silk sarees.',
      training_needs: 'Advanced sales conversion training.',
    });

    expect(selfRes.success).toBe(true);
    expect(selfRes.id).toBeDefined();

    const reviews = perfService.getReviews({ staffId: testStaffId });
    expect(reviews.length).toBe(1);
    expect(reviews[0].self_review).toBeDefined();
    expect(reviews[0].self_review?.achievements).toContain('Completed sales target');
  });

  it('5. should execute manager review evaluation, compute weighted overall score, and map rating band (Excellent)', () => {
    const cycleRes = perfService.createCycle({
      name: 'Q3 2026 Appraisal',
      type: 'QUARTERLY',
      start_date: '2026-07-01',
      end_date: '2026-09-30',
    });

    // Assign KPIs: 40% Sales, 20% Attendance, 15% Punctuality, 25% Cust Service
    perfService.assignStaffKPIs(testStaffId, cycleRes.id!, [
      { kpi_id: 1, target: 500000, weight: 40 },
      { kpi_id: 2, target: 95, weight: 20 },
      { kpi_id: 3, target: 90, weight: 15 },
      { kpi_id: 4, target: 90, weight: 25 },
    ]);

    const staffKpis = db.prepare('SELECT id FROM staff_performance_kpis WHERE staff_id = ?').all(testStaffId) as any[];

    // Record results: Sales (95%), Attendance (96%), Punctuality (91%), Cust Service (90%)
    const managerRes = perfService.submitManagerReview({
      staff_id: testStaffId,
      cycle_id: cycleRes.id!,
      strengths: 'Strong customer handling and consistent sales performance.',
      areas_for_improvement: 'Product knowledge on silk blends.',
      comments: 'Exceeds target metrics consistently.',
      kpi_results: [
        { staff_kpi_id: staffKpis[0].id, actual_result: 475000 }, // 95% achievement
        { staff_kpi_id: staffKpis[1].id, actual_result: 96 }, // 96% achievement
        { staff_kpi_id: staffKpis[2].id, actual_result: 91 }, // 91% achievement
        { staff_kpi_id: staffKpis[3].id, actual_result: 90 }, // 90% achievement
      ],
    });

    expect(managerRes.success).toBe(true);
    expect(managerRes.overall_score).toBeGreaterThanOrEqual(90);
    expect(managerRes.rating).toBe('Excellent');
  });

  it('6. should process appraisal recommendation (8% salary increment & ₹5,000 incentive) and manager approval', () => {
    const cycleRes = perfService.createCycle({
      name: 'Q3 2026 Appraisal',
      type: 'QUARTERLY',
      start_date: '2026-07-01',
      end_date: '2026-09-30',
    });

    const managerRes = perfService.submitManagerReview({
      staff_id: testStaffId,
      cycle_id: cycleRes.id!,
      comments: 'Outstanding performance',
    });

    const apprRes = perfService.submitAppraisalRecommendation({
      staff_id: testStaffId,
      cycle_id: cycleRes.id!,
      review_id: managerRes.id!,
      recommended_increment_type: 'PERCENTAGE',
      recommended_increment_value: 8,
      recommended_incentive: 5000,
      reason: 'Consistently exceeds performance targets (Score: 91%)',
    });

    expect(apprRes.success).toBe(true);
    expect(apprRes.id).toBeDefined();

    let appraisals = perfService.getAppraisals({ staffId: testStaffId });
    expect(appraisals[0].status).toBe('PENDING_APPROVAL');

    const approveRes = perfService.approveAppraisal(apprRes.id!, 1);
    expect(approveRes.success).toBe(true);

    appraisals = perfService.getAppraisals({ staffId: testStaffId });
    expect(appraisals[0].status).toBe('APPROVED');

    // Verify performance incentive record registered
    const inc: any = db.prepare('SELECT * FROM performance_incentives WHERE staff_id = ?').get(testStaffId);
    expect(inc).toBeDefined();
    expect(inc.amount).toBe(5000);
  });
});
