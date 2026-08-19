import Database from 'better-sqlite3';

export interface AppraisalCycleRow {
  id: number;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'OPEN' | 'IN_REVIEW' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CLOSED';
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceGoalRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  cycle_id?: number;
  cycle_name?: string;
  title: string;
  description?: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  weight: number;
  priority: string;
  start_date?: string;
  due_date?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  created_by?: number;
  created_at: string;
  updated_at: string;
  progress_percentage?: number;
}

export interface PerformanceKPIRow {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  measurement_type: string;
  default_target: number;
  unit: string;
  weight: number;
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StaffPerformanceKPIRow {
  id: number;
  staff_id: number;
  kpi_id: number;
  kpi_code?: string;
  kpi_name?: string;
  kpi_category?: string;
  cycle_id: number;
  target: number;
  actual_result: number;
  weight: number;
  score_achievement: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceRatingScaleRow {
  id: number;
  name: string;
  min_score: number;
  max_score: number;
  label: string;
  description?: string;
  status: string;
}

export interface PerformanceReviewRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  cycle_id: number;
  cycle_name?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  review_type: 'SELF_REVIEW' | 'MANAGER_REVIEW' | 'FINAL_REVIEW';
  status: string;
  overall_score: number;
  overall_rating?: string;
  strengths?: string;
  areas_for_improvement?: string;
  comments?: string;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  self_review?: {
    achievements?: string;
    challenges?: string;
    training_needs?: string;
    employee_comments?: string;
  };
  kpis?: StaffPerformanceKPIRow[];
}

export interface AppraisalRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  cycle_id: number;
  cycle_name?: string;
  review_id?: number;
  current_salary: number;
  recommended_increment_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'NO_INCREMENT';
  recommended_increment_value: number;
  recommended_incentive: number;
  reason?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  effective_from?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceIncentiveRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  cycle_id: number;
  appraisal_id?: number;
  amount: number;
  reason: string;
  status: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
}

export class PerformanceRepository {
  constructor(private db: Database.Database) {}

  // --- APPRAISAL CYCLES ---
  getCycles(): AppraisalCycleRow[] {
    return this.db.prepare('SELECT * FROM appraisal_cycles ORDER BY start_date DESC, id DESC').all() as AppraisalCycleRow[];
  }

  getCycleById(id: number): AppraisalCycleRow | undefined {
    return this.db.prepare('SELECT * FROM appraisal_cycles WHERE id = ?').get(id) as AppraisalCycleRow | undefined;
  }

  createCycle(input: { name: string; type?: string; start_date: string; end_date: string; created_by?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO appraisal_cycles (name, type, start_date, end_date, status, created_by)
      VALUES (?, ?, ?, ?, 'OPEN', ?)
    `).run(input.name.trim(), input.type || 'QUARTERLY', input.start_date, input.end_date, input.created_by || null);
    return Number(info.lastInsertRowid);
  }

  // --- GOALS ---
  getGoals(filters?: { staffId?: number; cycleId?: number }): PerformanceGoalRow[] {
    let sql = `
      SELECT pg.*, s.staff_code, s.first_name, s.last_name, ac.name as cycle_name
      FROM performance_goals pg
      JOIN staff s ON pg.staff_id = s.id
      LEFT JOIN appraisal_cycles ac ON pg.cycle_id = ac.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.staffId) { sql += ' AND pg.staff_id = ?'; params.push(filters.staffId); }
    if (filters?.cycleId) { sql += ' AND pg.cycle_id = ?'; params.push(filters.cycleId); }

    sql += ' ORDER BY pg.id DESC';
    const rows = this.db.prepare(sql).all(...params) as PerformanceGoalRow[];
    for (const r of rows) {
      r.progress_percentage = r.target_value > 0 ? Math.min(100, Math.round((r.current_value / r.target_value) * 100)) : 0;
    }
    return rows;
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
    created_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO performance_goals (
        staff_id, cycle_id, title, description, category, target_value, current_value, unit, weight, priority, start_date, due_date, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'IN_PROGRESS', ?)
    `).run(
      input.staff_id,
      input.cycle_id || null,
      input.title.trim(),
      input.description?.trim() || null,
      input.category || 'SALES',
      input.target_value,
      input.unit || '₹',
      input.weight || 20,
      input.priority || 'MEDIUM',
      input.start_date || null,
      input.due_date || null,
      input.created_by || null
    );
    return Number(info.lastInsertRowid);
  }

  updateGoalProgress(goalId: number, currentValue: number, status?: string): void {
    const goal = this.db.prepare('SELECT * FROM performance_goals WHERE id = ?').get(goalId) as PerformanceGoalRow | undefined;
    if (!goal) return;

    let newStatus = status || goal.status;
    if (!status && goal.target_value > 0) {
      if (currentValue >= goal.target_value) newStatus = 'COMPLETED';
      else if (currentValue > 0) newStatus = 'IN_PROGRESS';
    }

    this.db.prepare(`
      UPDATE performance_goals
      SET current_value = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(currentValue, newStatus, goalId);
  }

  // --- KPIS ---
  getKPIs(): PerformanceKPIRow[] {
    return this.db.prepare("SELECT * FROM performance_kpis WHERE status = 'ACTIVE' ORDER BY id ASC").all() as PerformanceKPIRow[];
  }

  createKPI(input: { code: string; name: string; description?: string; category: string; measurement_type?: string; default_target?: number; unit?: string; weight?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO performance_kpis (code, name, description, category, measurement_type, default_target, unit, weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.code.trim().toUpperCase(),
      input.name.trim(),
      input.description?.trim() || null,
      input.category,
      input.measurement_type || 'PERCENTAGE',
      input.default_target || 100,
      input.unit || '%',
      input.weight || 25
    );
    return Number(info.lastInsertRowid);
  }

  getStaffKPIs(staffId: number, cycleId: number): StaffPerformanceKPIRow[] {
    return this.db.prepare(`
      SELECT spk.*, pk.code as kpi_code, pk.name as kpi_name, pk.category as kpi_category
      FROM staff_performance_kpis spk
      JOIN performance_kpis pk ON spk.kpi_id = pk.id
      WHERE spk.staff_id = ? AND spk.cycle_id = ?
      ORDER BY pk.id ASC
    `).all(staffId, cycleId) as StaffPerformanceKPIRow[];
  }

  assignStaffKPI(input: { staff_id: number; kpi_id: number; cycle_id: number; target: number; weight?: number }): number {
    const info = this.db.prepare(`
      INSERT OR REPLACE INTO staff_performance_kpis (staff_id, kpi_id, cycle_id, target, actual_result, weight, score_achievement)
      VALUES (?, ?, ?, ?, 0, ?, 0)
    `).run(input.staff_id, input.kpi_id, input.cycle_id, input.target, input.weight || 25);
    return Number(info.lastInsertRowid);
  }

  recordKPIResult(id: number, actualResult: number, scoreAchievement: number): void {
    this.db.prepare(`
      UPDATE staff_performance_kpis
      SET actual_result = ?, score_achievement = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(actualResult, scoreAchievement, id);
  }

  // --- RATING SCALES ---
  getRatingScales(): PerformanceRatingScaleRow[] {
    return this.db.prepare("SELECT * FROM performance_rating_scales WHERE status = 'ACTIVE' ORDER BY min_score DESC").all() as PerformanceRatingScaleRow[];
  }

  // --- REVIEWS & SELF REVIEWS ---
  getReviews(filters?: { staffId?: number; cycleId?: number }): PerformanceReviewRow[] {
    let sql = `
      SELECT pr.*, s.staff_code, s.first_name, s.last_name, d.name as department_name, ac.name as cycle_name, u.display_name as reviewer_name
      FROM performance_reviews pr
      JOIN staff s ON pr.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN appraisal_cycles ac ON pr.cycle_id = ac.id
      LEFT JOIN users u ON pr.reviewer_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.staffId) { sql += ' AND pr.staff_id = ?'; params.push(filters.staffId); }
    if (filters?.cycleId) { sql += ' AND pr.cycle_id = ?'; params.push(filters.cycleId); }

    sql += ' ORDER BY pr.id DESC';
    const rows = this.db.prepare(sql).all(...params) as PerformanceReviewRow[];

    for (const r of rows) {
      r.self_review = this.db.prepare('SELECT * FROM performance_self_reviews WHERE review_id = ?').get(r.id) as any;
      r.kpis = this.getStaffKPIs(r.staff_id, r.cycle_id);
    }
    return rows;
  }

  getReviewById(id: number): PerformanceReviewRow | undefined {
    const row = this.db.prepare(`
      SELECT pr.*, s.staff_code, s.first_name, s.last_name, d.name as department_name, ac.name as cycle_name, u.display_name as reviewer_name
      FROM performance_reviews pr
      JOIN staff s ON pr.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN appraisal_cycles ac ON pr.cycle_id = ac.id
      LEFT JOIN users u ON pr.reviewer_id = u.id
      WHERE pr.id = ?
    `).get(id) as PerformanceReviewRow | undefined;

    if (row) {
      row.self_review = this.db.prepare('SELECT * FROM performance_self_reviews WHERE review_id = ?').get(row.id) as any;
      row.kpis = this.getStaffKPIs(row.staff_id, row.cycle_id);
    }
    return row;
  }

  saveReview(input: {
    staff_id: number;
    cycle_id: number;
    reviewer_id?: number;
    review_type?: string;
    overall_score: number;
    overall_rating: string;
    strengths?: string;
    areas_for_improvement?: string;
    comments?: string;
    status?: string;
  }): number {
    const existing = this.db.prepare(`
      SELECT id FROM performance_reviews
      WHERE staff_id = ? AND cycle_id = ? AND review_type = ?
    `).get(input.staff_id, input.cycle_id, input.review_type || 'MANAGER_REVIEW') as { id: number } | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE performance_reviews SET
          reviewer_id = ?, overall_score = ?, overall_rating = ?, strengths = ?, areas_for_improvement = ?,
          comments = ?, status = ?, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        input.reviewer_id || null, input.overall_score, input.overall_rating, input.strengths || null,
        input.areas_for_improvement || null, input.comments || null, input.status || 'SUBMITTED', existing.id
      );
      return existing.id;
    } else {
      const info = this.db.prepare(`
        INSERT INTO performance_reviews (
          staff_id, cycle_id, reviewer_id, review_type, status, overall_score, overall_rating, strengths, areas_for_improvement, comments, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        input.staff_id, input.cycle_id, input.reviewer_id || null, input.review_type || 'MANAGER_REVIEW',
        input.status || 'SUBMITTED', input.overall_score, input.overall_rating, input.strengths || null,
        input.areas_for_improvement || null, input.comments || null
      );
      return Number(info.lastInsertRowid);
    }
  }

  saveSelfReview(input: {
    review_id: number;
    staff_id: number;
    achievements?: string;
    challenges?: string;
    training_needs?: string;
    employee_comments?: string;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO performance_self_reviews (
        review_id, staff_id, achievements, challenges, training_needs, employee_comments
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      input.review_id, input.staff_id, input.achievements || null, input.challenges || null,
      input.training_needs || null, input.employee_comments || null
    );
    return Number(info.lastInsertRowid);
  }

  // --- APPRAISALS & INCENTIVES ---
  getAppraisals(filters?: { staffId?: number; cycleId?: number }): AppraisalRow[] {
    let sql = `
      SELECT a.*, s.staff_code, s.first_name, s.last_name, d.name as department_name, ac.name as cycle_name, u.display_name as approved_by_name
      FROM appraisals a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN appraisal_cycles ac ON a.cycle_id = ac.id
      LEFT JOIN users u ON a.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.staffId) { sql += ' AND a.staff_id = ?'; params.push(filters.staffId); }
    if (filters?.cycleId) { sql += ' AND a.cycle_id = ?'; params.push(filters.cycleId); }

    sql += ' ORDER BY a.id DESC';
    return this.db.prepare(sql).all(...params) as AppraisalRow[];
  }

  createAppraisal(input: {
    staff_id: number;
    cycle_id: number;
    review_id?: number;
    current_salary: number;
    recommended_increment_type?: string;
    recommended_increment_value?: number;
    recommended_incentive?: number;
    reason?: string;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO appraisals (
        staff_id, cycle_id, review_id, current_salary, recommended_increment_type, recommended_increment_value, recommended_incentive, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL')
    `).run(
      input.staff_id,
      input.cycle_id,
      input.review_id || null,
      input.current_salary,
      input.recommended_increment_type || 'PERCENTAGE',
      input.recommended_increment_value || 0,
      input.recommended_incentive || 0,
      input.reason?.trim() || null
    );
    return Number(info.lastInsertRowid);
  }

  updateAppraisalStatus(id: number, status: 'APPROVED' | 'REJECTED' | 'IMPLEMENTED', approvedBy?: number): void {
    this.db.prepare(`
      UPDATE appraisals
      SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, approvedBy || null, id);
  }

  createIncentive(input: {
    staff_id: number;
    cycle_id: number;
    appraisal_id?: number;
    amount: number;
    reason: string;
    approved_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO performance_incentives (staff_id, cycle_id, appraisal_id, amount, reason, status, approved_by)
      VALUES (?, ?, ?, ?, ?, 'APPROVED', ?)
    `).run(
      input.staff_id,
      input.cycle_id,
      input.appraisal_id || null,
      input.amount,
      input.reason.trim(),
      input.approved_by || null
    );
    return Number(info.lastInsertRowid);
  }
}
