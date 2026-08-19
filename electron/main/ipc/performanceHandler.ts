import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { PerformanceService } from '../services/performanceService';
import { AuthorizationService } from '../services/auth/authorizationService';
import { SessionService } from '../services/auth/sessionService';

export function registerPerformanceHandlers(db: Database.Database) {
  ipcMain.handle('performance:get-cycles', () => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getCycles();
  });

  ipcMain.handle('performance:create-cycle', (_, input: any) => {
    AuthorizationService.requirePermission('performance.create');
    const session = SessionService.getSession();
    const service = new PerformanceService(db);
    return service.createCycle(input, session?.userId);
  });

  ipcMain.handle('performance:get-goals', (_, filters?: any) => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getGoals(filters);
  });

  ipcMain.handle('performance:create-goal', (_, input: any) => {
    AuthorizationService.requirePermission('performance.manage_goals');
    const session = SessionService.getSession();
    const service = new PerformanceService(db);
    return service.createGoal(input, session?.userId);
  });

  ipcMain.handle('performance:update-goal', (_, { goalId, currentValue, status }: { goalId: number; currentValue: number; status?: string }) => {
    AuthorizationService.requirePermission('performance.manage_goals');
    const session = SessionService.getSession();
    const service = new PerformanceService(db);
    return service.updateGoalProgress(goalId, currentValue, status, session?.userId);
  });

  ipcMain.handle('performance:get-kpis', () => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getKPIs();
  });

  ipcMain.handle('performance:create-kpi', (_, input: any) => {
    AuthorizationService.requirePermission('performance.manage_kpis');
    const service = new PerformanceService(db);
    return service.createKPI(input);
  });

  ipcMain.handle('performance:assign-kpis', (_, { staffId, cycleId, kpis }: { staffId: number; cycleId: number; kpis: any[] }) => {
    AuthorizationService.requirePermission('performance.manage_kpis');
    const service = new PerformanceService(db);
    return service.assignStaffKPIs(staffId, cycleId, kpis);
  });

  ipcMain.handle('performance:get-reviews', (_, filters?: any) => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getReviews(filters);
  });

  ipcMain.handle('performance:get-review-by-id', (_, id: number) => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getReviewById(id);
  });

  ipcMain.handle('performance:submit-self-review', (_, input: any) => {
    AuthorizationService.requirePermission('performance.submit_review');
    const service = new PerformanceService(db);
    return service.submitSelfReview(input);
  });

  ipcMain.handle('performance:submit-manager-review', (_, input: any) => {
    AuthorizationService.requirePermission('performance.review');
    const session = SessionService.getSession();
    const service = new PerformanceService(db);
    return service.submitManagerReview(input, session?.userId);
  });

  ipcMain.handle('performance:get-appraisals', (_, filters?: any) => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getAppraisals(filters);
  });

  ipcMain.handle('performance:submit-appraisal', (_, input: any) => {
    AuthorizationService.requirePermission('performance.manage_appraisal');
    const service = new PerformanceService(db);
    return service.submitAppraisalRecommendation(input);
  });

  ipcMain.handle('performance:approve-appraisal', (_, appraisalId: number) => {
    AuthorizationService.requirePermission('performance.approve_appraisal');
    const session = SessionService.getSession();
    const service = new PerformanceService(db);
    return service.approveAppraisal(appraisalId, session?.userId || 1);
  });

  ipcMain.handle('performance:get-history', (_, staffId: number) => {
    AuthorizationService.requirePermission('performance.view');
    const service = new PerformanceService(db);
    return service.getPerformanceHistory(staffId);
  });
}
