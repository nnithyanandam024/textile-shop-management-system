import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CreateCycleModal } from './modals/CreateCycleModal';
import { AddGoalModal } from './modals/AddGoalModal';
import { PerformanceReviewModal } from './modals/PerformanceReviewModal';
import { AppraisalModal } from './modals/AppraisalModal';
import {
  Award,
  Plus,
  Calendar,
  Target,
  CheckCircle2,
  TrendingUp,
  Check,
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cycles' | 'goals' | 'kpis' | 'reviews' | 'appraisals'>('cycles');

  // Data states
  const [cycles, setCycles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Modals
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api?.performance) {
        const c = await window.api.performance.getCycles();
        setCycles(c || []);
        const g = await window.api.performance.getGoals();
        setGoals(g || []);
        const k = await window.api.performance.getKPIs();
        setKpis(k || []);
        const r = await window.api.performance.getReviews();
        setReviews(r || []);
        const a = await window.api.performance.getAppraisals();
        setAppraisals(a || []);
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
      }
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveAppraisal = async (appraisalId: number) => {
    if (!window.confirm('Are you sure you want to approve this appraisal? Approved salary increments will take effect on the next pay structure period.')) return;
    if (window.api?.performance) {
      const res = await window.api.performance.approveAppraisal(appraisalId);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Approval failed.');
      }
    }
  };

  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length)
    : 85;

  const topPerformersCount = reviews.filter((r) => r.overall_score >= 90).length;
  const pendingAppraisalsCount = appraisals.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Performance & Appraisal Engine</h1>
            <p className="text-xs font-semibold text-slate-500">Track goals, weighted KPI scores, manager evaluations & salary increment recommendations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<Target className="w-4 h-4" />} onClick={() => setIsGoalModalOpen(true)}>
            Add Goal
          </Button>
          <Button variant="outline" icon={<Award className="w-4 h-4" />} onClick={() => setIsReviewModalOpen(true)}>
            Review Staff
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCycleModalOpen(true)}>
            Create Cycle
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Staff Evaluated</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{reviews.length}</p>
        </Card>

        <Card className="p-4 bg-indigo-50/50 border border-indigo-100">
          <span className="text-[10px] font-extrabold text-[#2012ad] uppercase tracking-wider">Average Performance</span>
          <p className="text-xl font-extrabold text-[#2012ad] mt-1">{avgScore}%</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Top Performers (≥90%)</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{topPerformersCount}</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-100">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Pending Appraisals</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{pendingAppraisalsCount}</p>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('cycles')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'cycles'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appraisal Cycles ({cycles.length})
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'goals'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          Staff Goals ({goals.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Performance Reviews ({reviews.length})
        </button>

        <button
          onClick={() => setActiveTab('appraisals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'appraisals'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Appraisals & Increments ({appraisals.length})
        </button>
      </div>

      {/* TAB 1: APPRAISAL CYCLES */}
      {activeTab === 'cycles' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Cycle Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Evaluation Window</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4">{c.type}</td>
                    <td className="py-3 px-4">{c.start_date} to {c.end_date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: STAFF GOALS */}
      {activeTab === 'goals' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Staff Performance Goals ({goals.length})</h3>
              <p className="text-xs text-slate-500">Measurable sales, customer service, and attendance target goals</p>
            </div>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsGoalModalOpen(true)}>
              Add Staff Goal
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Goal Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Target & Progress</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {goals.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{g.staff_code} — {g.first_name} {g.last_name || ''}</td>
                    <td className="py-3 px-4 font-bold text-[#2012ad]">{g.title}</td>
                    <td className="py-3 px-4">{g.category}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{g.unit}{g.current_value.toLocaleString()} / {g.unit}{g.target_value.toLocaleString()}</span>
                          <span className="text-[#2012ad]">{g.progress_percentage}%</span>
                        </div>
                        <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#2012ad] h-full rounded-full" style={{ width: `${g.progress_percentage}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold">{g.priority}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${g.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-[#2012ad] border border-indigo-200'}`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PERFORMANCE REVIEWS */}
      {activeTab === 'reviews' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Manager Evaluation Queue ({reviews.length})</h3>
              <p className="text-xs text-slate-500">Recorded performance evaluations, weighted scores & rating bands</p>
            </div>
            <Button variant="primary" icon={<Award className="w-4 h-4" />} onClick={() => setIsReviewModalOpen(true)}>
              Conduct Review
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4">Rating Band</th>
                  <th className="py-3 px-4">Strengths & Feedback</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.staff_code} — {r.first_name} {r.last_name || ''}</td>
                    <td className="py-3 px-4">{r.department_name || 'Staff'}</td>
                    <td className="py-3 px-4">{r.cycle_name}</td>
                    <td className="py-3 px-4 font-extrabold text-base text-[#2012ad]">{r.overall_score}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${r.overall_score >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-[#2012ad] border border-indigo-200'}`}>
                        {r.overall_rating}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{r.strengths || r.comments || 'Good performance'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-extrabold text-emerald-700 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: APPRAISALS & INCREMENTS */}
      {activeTab === 'appraisals' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Appraisal & Increment Recommendations ({appraisals.length})</h3>
              <p className="text-xs text-slate-500">Salary increment percentages & performance incentive recommendations</p>
            </div>
            <Button variant="primary" icon={<TrendingUp className="w-4 h-4" />} onClick={() => setIsAppraisalModalOpen(true)}>
              Submit Recommendation
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Current Salary</th>
                  <th className="py-3 px-4">Recommended Increment</th>
                  <th className="py-3 px-4">Recommended Incentive</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {appraisals.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{a.staff_code} — {a.first_name} {a.last_name || ''}</td>
                    <td className="py-3 px-4 font-bold">₹{a.current_salary.toLocaleString()}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700">
                      {a.recommended_increment_type === 'PERCENTAGE' ? `+${a.recommended_increment_value}%` : `+₹${a.recommended_increment_value.toLocaleString()}`}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-[#2012ad]">₹{a.recommended_incentive.toLocaleString()}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{a.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status === 'PENDING_APPROVAL' && (
                        <Button size="sm" variant="primary" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleApproveAppraisal(a.id)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateCycleModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        onSuccess={fetchData}
      />

      <AddGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        cycleList={cycles}
      />

      <PerformanceReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        cycleList={cycles}
        kpiList={kpis}
      />

      <AppraisalModal
        isOpen={isAppraisalModalOpen}
        onClose={() => setIsAppraisalModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        cycleList={cycles}
      />
    </div>
  );
};
