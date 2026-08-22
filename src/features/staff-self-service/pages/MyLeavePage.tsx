import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Calendar, Plus, X, AlertCircle } from 'lucide-react';

export const MyLeavePage: React.FC = () => {
  const [leaveData, setLeaveData] = useState<{ balances: any[]; requests: any[] }>({ balances: [], requests: [] });
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Apply Form State
  const [leaveTypeId, setLeaveTypeId] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchLeave = async () => {
    try {
      if (window.api?.selfService) {
        const res = await window.api.selfService.getLeave();
        setLeaveData(res || { balances: [], requests: [] });
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    }
  };

  useEffect(() => {
    fetchLeave();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate || !reason.trim()) {
      setError('Start date, end date, and reason are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (window.api?.selfService) {
        const res = await window.api.selfService.applyLeave({
          leave_type_id: Number(leaveTypeId),
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
        });

        if (res.success) {
          setIsApplyModalOpen(false);
          fetchLeave();
        } else {
          setError(res.error || 'Failed to submit leave request.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: number) => {
    if (window.api?.selfService) {
      await window.api.selfService.cancelLeave(id);
      fetchLeave();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Leave Management</h1>
            <p className="text-xs font-semibold text-slate-500">Check remaining leave balances and submit leave applications</p>
          </div>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsApplyModalOpen(true)}>
          Apply Leave
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { name: 'Casual Leave', total: 6, used: 2, color: 'bg-indigo-50 text-[#2012ad]' },
          { name: 'Sick Leave', total: 6, used: 1, color: 'bg-emerald-50 text-emerald-600' },
          { name: 'Earned / Annual Leave', total: 6, used: 1, color: 'bg-amber-50 text-amber-600' },
        ].map((b, idx) => (
          <Card key={idx} className="p-4 bg-white border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{b.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${b.color}`}>
                {b.total - b.used} Available
              </span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2">{b.total - b.used} Days</p>
            <span className="text-[11px] font-semibold text-slate-500">{b.used} days used of {b.total} annual allocation</span>
          </Card>
        ))}
      </div>

      {/* Leave Requests Table */}
      <Card className="space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leave Application Requests</h3>
          <span className="text-[11px] font-semibold text-slate-500">{leaveData.requests.length} applications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">From Date</th>
                <th className="py-3 px-4">To Date</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {leaveData.requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No leave applications submitted yet
                  </td>
                </tr>
              ) : (
                leaveData.requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.leave_type_name || 'Casual Leave'}</td>
                    <td className="py-3 px-4 font-mono">{r.start_date}</td>
                    <td className="py-3 px-4 font-mono">{r.end_date}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-700'
                            : r.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'PENDING' && (
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => handleCancelLeave(r.id)}>
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Apply Leave */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave Type *</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
                >
                  <option value={1}>Casual Leave</option>
                  <option value={2}>Sick Leave</option>
                  <option value={3}>Earned / Annual Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="From Date *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                <Input label="To Date *" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Leave *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Enter detailed reason..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
