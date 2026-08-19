import Database from 'better-sqlite3';
import { PerformanceRepository, AppraisalCycleRow, PerformanceGoalRow, PerformanceKPIRow, StaffPerformanceKPIRow, PerformanceReviewRow, AppraisalRow } from '../repositories/performanceRepository';
import { SalaryRepository } from '../repositories/salaryRepository';
import { AuditRepository } from '../repositories/auditRepository';

export class PerformanceService {
  private perfRepo: PerformanceRepository;
  private salaryRepo: SalaryRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.perfRepo = new PerformanceRepository(db);
    this.salaryRepo = new SalaryRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  // --- CYCLES ---
  getCycles(): AppraisalCycleRow[] {
    return this.perfRepo.getCycles();
  }

  createCycle(input: { name: string; type?: string; start_date: string; end_date: string }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.name || input.name.trim() === '') return { success: false, error: 'Appraisal cycle name is required.' };
    if (!input.start_date || !input.end_date) return { success: false, error: 'Start date and end date are required.' };

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.perfRepo.createCycle({
      name: input.name,
      type: input.type,
      start_date: input.start_date,
      end_date: input.end_date,
      created_by: validActor,
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'PERFORMANCE_CYCLE_CREATED',
      entity_type: 'APPRAISAL_CYCLE',
      entity_id: id,
      new_value: `Created appraisal cycle '${input.name}'`,
    });

    return { success: true, id };
  }

  // --- GOALS ---
  getGoals(filters?: { staffId?: number; cycleId?: number }): PerformanceGoalRow[] {
    return this.perfRepo.getGoals(filters);
  }

  createGoal(input: {
    staff_id: number;
    cycle_id?: number;
    title: string;
    description?: string;
    category?: string;
    target_value: number;
    unit?: string;
    weight?: number;
    priority?: string;
    start_date?: string;
    due_date?: string;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.title || input.title.trim() === '') return { success: false, error: 'Goal title is required.' };
    if (!input.target_value || input.target_value <= 0) return { success: false, error: 'Target value must be greater than 0.' };

    const validActor = this.sanitizeActorUserId(actorUserId);
    const id = this.perfRepo.createGoal({ ...input, created_by: validActor });

    this.auditRepo.log({
      user_id: validActor,
      action: 'GOAL_CREATED',
      entity_type: 'PERFORMANCE_GOAL',
      entity_id: id,
      new_value: `Created goal '${input.title}' for staff #${input.staff_id}`,
    });

    return { success: true, id };
  }

  updateGoalProgress(goalId: number, currentValue: number, status?: string, actorUserId?: number): { success: boolean; error?: string } {
    this.perfRepo.updateGoalProgress(goalId, currentValue, status);
    this.auditRepo.log({
      user_id: this.sanitizeActorUserId(actorUserId),
      action: 'GOAL_UPDATED',
      entity_type: 'PERFORMANCE_GOAL',
      entity_id: goalId,
      new_value: `Updated goal #${goalId} current progress to ${currentValue}`,
    });
    return { success: true };
  }

  // --- KPIS & STAFF KPI ASSIGNMENT ---
  getKPIs(): PerformanceKPIRow[] {
    return this.perfRepo.getKPIs();
  }

  createKPI(input: { code: string; name: string; description?: string; category: string; measurement_type?: string; default_target?: number; unit?: string; weight?: number }): { success: boolean; id?: number; error?: string } {
    if (!input.code || !input.name) return { success: false, error: 'KPI code and name are required.' };
    const id = this.perfRepo.createKPI(input);
    return { success: true, id };
  }

  assignStaffKPIs(staffId: number, cycleId: number, kpis: Array<{ kpi_id: number; target: number; weight: number }>): { success: boolean; error?: string } {
    for (const k of kpis) {
      this.perfRepo.assignStaffKPI({
        staff_id: staffId,
        kpi_id: k.kpi_id,
        cycle_id: cycleId,
        target: k.target,
        weight: k.weight,
      });
    }
    return { success: true };
  }

  recordKPIResult(staffKpiId: number, actualResult: number): { success: boolean; error?: string } {
    const kpiRow = this.db.prepare(`
      SELECT spk.*, pk.direction
      FROM staff_performance_kpis spk
      JOIN performance_kpis pk ON spk.kpi_id = pk.id
      WHERE spk.id = ?
    `).get(staffKpiId) as any;

    if (!kpiRow) return { success: false, error: 'Staff KPI assignment not found.' };

    let achievement = 0;
    if (kpiRow.target > 0) {
      if (kpiRow.direction === 'LOWER_IS_BETTER') {
        achievement = Math.max(0, Math.min(100, Math.round(((2 * kpiRow.target - actualResult) / kpiRow.target) * 100)));
      } else {
        achievement = Math.min(100, Math.round((actualResult / kpiRow.target) * 100));
      }
    }

    this.perfRepo.recordKPIResult(staffKpiId, actualResult, achievement);
    return { success: true };
  }

  // --- REVIEWS & SCORE ENGINE ---
  getReviews(filters?: { staffId?: number; cycleId?: number }): PerformanceReviewRow[] {
    return this.perfRepo.getReviews(filters);
  }

  getReviewById(id: number): PerformanceReviewRow | undefined {
    return this.perfRepo.getReviewById(id);
  }

  submitSelfReview(input: {
    review_id?: number;
    staff_id: number;
    cycle_id: number;
    achievements?: string;
    challenges?: string;
    training_needs?: string;
    employee_comments?: string;
  }): { success: boolean; id?: number; error?: string } {
    let reviewId = input.review_id;
    if (!reviewId) {
      reviewId = this.perfRepo.saveReview({
        staff_id: input.staff_id,
        cycle_id: input.cycle_id,
        review_type: 'SELF_REVIEW',
        overall_score: 0,
        overall_rating: 'Pending',
        status: 'SUBMITTED',
      });
    }

    this.perfRepo.saveSelfReview({
      review_id: reviewId,
      staff_id: input.staff_id,
      achievements: input.achievements,
      challenges: input.challenges,
      training_needs: input.training_needs,
      employee_comments: input.employee_comments,
    });

    return { success: true, id: reviewId };
  }

  submitManagerReview(input: {
    staff_id: number;
    cycle_id: number;
    strengths?: string;
    areas_for_improvement?: string;
    comments?: string;
    kpi_results?: Array<{ staff_kpi_id: number; actual_result: number }>;
  }, actorUserId?: number): { success: boolean; id?: number; overall_score?: number; rating?: string; error?: string } {
    const validActor = this.sanitizeActorUserId(actorUserId);

    // 1. Process KPI actual results if supplied
    if (input.kpi_results && input.kpi_results.length > 0) {
      for (const kr of input.kpi_results) {
        this.recordKPIResult(kr.staff_kpi_id, kr.actual_result);
      }
    }

    // 2. Compute weighted overall score
    const kpis = this.perfRepo.getStaffKPIs(input.staff_id, input.cycle_id);
    let totalScore = 0;
    let totalWeight = 0;

    if (kpis && kpis.length > 0) {
      for (const k of kpis) {
        totalScore += (k.score_achievement * k.weight) / 100;
        totalWeight += k.weight;
      }
      if (totalWeight > 0 && totalWeight !== 100) {
        totalScore = Math.round((totalScore / totalWeight) * 100);
      } else {
        totalScore = Math.round(totalScore * 100) / 100;
      }
    } else {
      totalScore = 80; // Default baseline rating if no custom KPIs assigned
    }

    // 3. Map overall score to rating scale label
    const scales = this.perfRepo.getRatingScales();
    let ratingLabel = 'Good';
    for (const scale of scales) {
      if (totalScore >= scale.min_score && totalScore <= scale.max_score) {
        ratingLabel = scale.label;
        break;
      }
    }

    const reviewId = this.perfRepo.saveReview({
      staff_id: input.staff_id,
      cycle_id: input.cycle_id,
      reviewer_id: validActor,
      review_type: 'MANAGER_REVIEW',
      overall_score: totalScore,
      overall_rating: ratingLabel,
      strengths: input.strengths,
      areas_for_improvement: input.areas_for_improvement,
      comments: input.comments,
      status: 'APPROVED',
    });

    this.auditRepo.log({
      user_id: validActor,
      action: 'REVIEW_SUBMITTED',
      entity_type: 'PERFORMANCE_REVIEW',
      entity_id: reviewId,
      new_value: `Completed manager review for staff #${input.staff_id}: Score=${totalScore}%, Rating=${ratingLabel}`,
    });

    return { success: true, id: reviewId, overall_score: totalScore, rating: ratingLabel };
  }

  // --- APPRAISALS & INCENTIVES ---
  getAppraisals(filters?: { staffId?: number; cycleId?: number }): AppraisalRow[] {
    return this.perfRepo.getAppraisals(filters);
  }

  submitAppraisalRecommendation(input: {
    staff_id: number;
    cycle_id: number;
    review_id?: number;
    recommended_increment_type?: string;
    recommended_increment_value?: number;
    recommended_incentive?: number;
    reason?: string;
  }): { success: boolean; id?: number; error?: string } {
    const currentStruct = this.salaryRepo.getCurrentStructure(input.staff_id);
    const currentSalary = currentStruct ? currentStruct.basic_salary : 0;

    const id = this.perfRepo.createAppraisal({
      staff_id: input.staff_id,
      cycle_id: input.cycle_id,
      review_id: input.review_id,
      current_salary: currentSalary,
      recommended_increment_type: input.recommended_increment_type || 'PERCENTAGE',
      recommended_increment_value: input.recommended_increment_value || 0,
      recommended_incentive: input.recommended_incentive || 0,
      reason: input.reason,
    });

    return { success: true, id };
  }

  approveAppraisal(appraisalId: number, actorUserId?: number): { success: boolean; error?: string } {
    const appr = this.db.prepare('SELECT * FROM appraisals WHERE id = ?').get(appraisalId) as AppraisalRow | undefined;
    if (!appr) return { success: false, error: 'Appraisal record not found.' };

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.perfRepo.updateAppraisalStatus(appraisalId, 'APPROVED', validActor);

    // Register incentive record if recommended
    if (appr.recommended_incentive && appr.recommended_incentive > 0) {
      this.perfRepo.createIncentive({
        staff_id: appr.staff_id,
        cycle_id: appr.cycle_id,
        appraisal_id: appraisalId,
        amount: appr.recommended_incentive,
        reason: `Performance Incentive for Appraisal #${appraisalId}`,
        approved_by: validActor,
      });
    }

    // Process salary increment revision if recommended
    if (appr.recommended_increment_value && appr.recommended_increment_value > 0) {
      const currentStruct = this.salaryRepo.getCurrentStructure(appr.staff_id);
      if (currentStruct) {
        let newBasic = currentStruct.basic_salary;
        if (appr.recommended_increment_type === 'PERCENTAGE') {
          newBasic = Math.round(currentStruct.basic_salary * (1 + appr.recommended_increment_value / 100));
        } else if (appr.recommended_increment_type === 'FIXED_AMOUNT') {
          newBasic = currentStruct.basic_salary + appr.recommended_increment_value;
        }

        const nextMonth = new Date();
        nextMonth.setDate(1);
        const effectiveStr = nextMonth.toISOString().split('T')[0];

        this.salaryRepo.createStructure({
          staff_id: appr.staff_id,
          effective_from: effectiveStr,
          pay_frequency: 'MONTHLY',
          basic_salary: newBasic,
          gross_salary: Math.round(newBasic * 1.25),
          created_by: validActor,
          components: [
            { component_id: 1, calculation_method: 'FIXED', value: newBasic },
            { component_id: 2, calculation_method: 'PERCENTAGE_OF_BASIC', value: 20 },
            { component_id: 3, calculation_method: 'FIXED', value: 1000 },
          ],
        });
      }
    }

    this.auditRepo.log({
      user_id: validActor,
      action: 'APPRAISAL_APPROVED',
      entity_type: 'APPRAISAL',
      entity_id: appraisalId,
      new_value: `Approved appraisal #${appraisalId} for staff #${appr.staff_id}`,
    });

    return { success: true };
  }

  getPerformanceHistory(staffId: number): PerformanceReviewRow[] {
    return this.perfRepo.getReviews({ staffId });
  }
}
