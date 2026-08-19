import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Award, Target, MessageSquare, X } from 'lucide-react';

export const MyPerformancePage: React.FC = () => {
  const [isSelfReviewOpen, setIsSelfReviewOpen] = useState(false);

  // Self review state
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');

  const fetchPerf = async () => {
    try {
      if (window.api?.selfService) {
        await window.api.selfService.getPerformance();
      }
    } catch (err) {
      console.error('Failed to load performance data:', err);
    }
  };

  useEffect(() => {
    fetchPerf();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Performance & Goals</h1>
            <p className="text-xs font-semibold text-slate-500">Track monthly evaluation scores, KPI goals and submit self-assessment reviews</p>
          </div>
        </div>

        <Button variant="primary" icon={<MessageSquare className="w-4 h-4" />} onClick={() => setIsSelfReviewOpen(true)}>
          Self Assessment Review
        </Button>
      </div>

      {/* Scorecard Overview Banner */}
      <Card className="p-6 bg-white border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Overall Rating Score</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">88% — Exceeds Expectations</h3>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-[#2818cf] rounded-full text-xs font-extrabold border border-indigo-100">
            August 2026 Cycle
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Attendance & Punctuality</span>
            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">90%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Sales Performance</span>
            <p className="text-lg font-extrabold text-[#2818cf] mt-0.5">85%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Customer Feedback</span>
            <p className="text-lg font-extrabold text-amber-600 mt-0.5">92%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Team Collaboration</span>
            <p className="text-lg font-extrabold text-cyan-600 mt-0.5">88%</p>
          </div>
        </div>
      </Card>

      {/* Goal Progress Bars */}
      <Card className="p-5 space-y-4 bg-white border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#2818cf]" />
            <h3 className="text-sm font-bold text-slate-900">Active KPI Targets & Goals</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">Q3 Performance Cycle</span>
        </div>

        <div className="space-y-4">
          {[
            { title: 'Monthly Silk Saree Sales Target (₹2,50,000)', progress: 80, color: 'bg-emerald-500' },
            { title: 'Customer Follow-up & Satisfaction Calls', progress: 95, color: 'bg-[#2818cf]' },
            { title: 'New Fabric & Textile Product Training', progress: 60, color: 'bg-amber-500' },
          ].map((g, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>{g.title}</span>
                <span>{g.progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${g.color} transition-all duration-500`} style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal: Self Review */}
      {isSelfReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Submit Self Assessment Review</h3>
              <button onClick={() => setIsSelfReviewOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setIsSelfReviewOpen(false); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Key Achievements this Month *</label>
                <textarea
                  rows={3}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  required
                  placeholder="Describe your sales achievements and customer highlights..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Challenges & Required Support</label>
                <textarea
                  rows={3}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Describe any challenges faced..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsSelfReviewOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Submit Self Assessment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
