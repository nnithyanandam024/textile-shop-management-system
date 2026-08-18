import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ApplyLeaveModal } from './modals/ApplyLeaveModal';
import { LeaveApprovalModal } from './modals/LeaveApprovalModal';
import { LeaveTypeModal } from './modals/LeaveTypeModal';
import { AdjustBalanceModal } from './modals/AdjustBalanceModal';
import { HolidayModal } from './modals/HolidayModal';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Search,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

export const LeaveListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'approvals' | 'balances' | 'calendar' | 'types' | 'holidays'>('requests');

  // Data states
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any | null>(null);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedTypeForEdit, setSelectedTypeForEdit] = useState<any | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api?.leave) {
        const reqs = await window.api.leave.getRequests({
          status: statusFilter || undefined,
          search: search || undefined,
        });
        setRequests(reqs || []);

        const types = await window.api.leave.getTypes(true);
        setLeaveTypes(types || []);

        const hols = await window.api.leave.getHolidays(true);
        setHolidays(hols || []);
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleCancelLeave = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this leave request? Used leave balance will be restored.')) return;
    if (window.api?.leave) {
      const res = await window.api.leave.cancel(id);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Cancellation failed.');
      }
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (window.api?.leave) {
      const res = await window.api.leave.deleteHoliday(id);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Delete failed.');
      }
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const approvedToday = requests.filter((r) => r.status === 'APPROVED');

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave Management System</h1>
            <p className="text-xs font-semibold text-slate-500">Track employee leave balances, manage approval queues & holiday calendars</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setIsAdjustModalOpen(true)}>
            Adjust Balance
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsApplyModalOpen(true)}>
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Staff</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{staffList.length}</p>
        </Card>

        <Card className="p-4 bg-indigo-50/50 border border-indigo-100">
          <span className="text-[10px] font-extrabold text-[#2818cf] uppercase tracking-wider">On Leave Today</span>
          <p className="text-xl font-extrabold text-[#2818cf] mt-1">{approvedToday.length}</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-100">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Pending Approvals</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{pendingRequests.length}</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Holidays Scheduled</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{holidays.length}</p>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Leave Applications ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 relative ${
            activeTab === 'approvals'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Pending Approvals
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('types')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'types'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Leave Types & Policies
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'holidays'
              ? 'bg-indigo-50 text-[#2818cf] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Shop Holidays ({holidays.length})
        </button>
      </div>

      {/* TAB 1: LEAVE APPLICATIONS */}
      {activeTab === 'requests' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">From - To</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#2818cf]">{r.staff_code}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">
                      {r.first_name} {r.last_name || ''}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-indigo-50 text-[#2818cf] text-[10px] font-bold rounded-md">
                        {r.leave_code} — {r.leave_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.start_date} to {r.end_date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.duration_days} Days</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedRequestForReview(r);
                              setIsApprovalModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-[#2818cf] hover:underline"
                          >
                            Review
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                          <button
                            onClick={() => handleCancelLeave(r.id)}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'approvals' && (
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Pending Leave Requests Approval Queue ({pendingRequests.length})
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No pending leave requests requiring manager action.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {req.staff_code} — {req.first_name} {req.last_name || ''}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-[#2818cf] text-[10px] font-bold rounded-md">
                        {req.leave_name} ({req.duration_days} Days)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Dates: <span className="font-semibold text-slate-800">{req.start_date} to {req.end_date}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Reason: <span className="italic">{req.reason}</span>
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedRequestForReview(req);
                      setIsApprovalModalOpen(true);
                    }}
                  >
                    Review Application
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: LEAVE TYPES */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setSelectedTypeForEdit(null); setIsTypeModalOpen(true); }}>
              Create Leave Type
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveTypes.map((lt) => (
              <Card key={lt.id} className="p-5 border border-slate-200/80 space-y-3 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-extrabold text-[#2818cf] bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                    {lt.leave_code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${lt.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {lt.paid ? 'PAID' : 'UNPAID'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{lt.name}</h3>
                <p className="text-xs text-slate-500">{lt.description || 'No description provided'}</p>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Annual Quota:</span>
                    <span className="font-bold text-slate-900">{lt.annual_allocation} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carry Forward:</span>
                    <span className="font-semibold text-slate-800">{lt.carry_forward_allowed ? `Allowed (Max ${lt.max_carry_forward}d)` : 'No'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { setSelectedTypeForEdit(lt); setIsTypeModalOpen(true); }}
                    className="p-1.5 text-slate-400 hover:text-[#2818cf] hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOLIDAYS */}
      {activeTab === 'holidays' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Shop Holiday Calendar ({holidays.length})</h3>
              <p className="text-xs text-slate-500">Store public holidays and official store closures</p>
            </div>

            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsHolidayModalOpen(true)}>
              Add Shop Holiday
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Holiday Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#2818cf]">{h.holiday_date}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{h.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200">
                        {h.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{h.description || '--'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        leaveTypes={leaveTypes}
      />

      <LeaveApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSuccess={fetchData}
        request={selectedRequestForReview}
      />

      <LeaveTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSuccess={fetchData}
        typeToEdit={selectedTypeForEdit}
      />

      <AdjustBalanceModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        leaveTypes={leaveTypes}
      />

      <HolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
