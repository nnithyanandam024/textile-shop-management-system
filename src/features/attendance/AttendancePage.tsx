import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ManualAttendanceModal } from './modals/ManualAttendanceModal';
import { RequestCorrectionModal } from './modals/RequestCorrectionModal';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Check,
  X,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  ShieldCheck,
  UserX,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'monthly' | 'reports' | 'approvals' | 'settings'>('today');

  // Today Date
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Daily Data & Filters
  const [kpis, setKpis] = useState<any>({
    total_staff: 0,
    present: 0,
    absent: 0,
    half_day: 0,
    late: 0,
    permission: 0,
    not_marked: 0,
  });
  const [dailyList, setDailyList] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // References
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<any | null>(null);

  // Monthly Tab State
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthlySummary, setMonthlySummary] = useState<any | null>(null);

  // Approvals Tab State
  const [pendingCorrections, setPendingCorrections] = useState<any[]>([]);

  // Settings Tab State
  const [settings, setSettings] = useState<any>({
    work_start_time: '09:00',
    work_end_time: '18:00',
    grace_minutes: 10,
    full_day_minutes: 480,
    half_day_minutes: 240,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      if (window.api?.attendance) {
        const res = await window.api.attendance.getDaily(todayDate, {
          departmentId: deptFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        });
        setKpis(res.kpis || {});
        setDailyList(res.list || []);
      }
    } catch (err) {
      console.error('Failed to load daily attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      if (window.api?.department) {
        const depts = await window.api.department.getAll(false);
        setDepartments(depts);
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
        if (s.staff && s.staff.length > 0 && !selectedStaffId) {
          setSelectedStaffId(s.staff[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  };

  const fetchPendingCorrections = async () => {
    try {
      if (window.api?.attendance) {
        const pending = await window.api.attendance.getPendingCorrections();
        setPendingCorrections(pending || []);
      }
    } catch (err) {
      console.error('Failed to load pending corrections:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      if (window.api?.attendance) {
        const s = await window.api.attendance.getSettings();
        setSettings(s || {});
      }
    } catch (err) {
      console.error('Failed to load attendance settings:', err);
    }
  };

  const fetchMonthlySummary = async () => {
    if (!selectedStaffId) return;
    try {
      if (window.api?.attendance) {
        const summary = await window.api.attendance.getStaffMonthly(
          Number(selectedStaffId),
          selectedYear,
          selectedMonth
        );
        setMonthlySummary(summary || null);
      }
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
    }
  };

  useEffect(() => {
    fetchReferenceData();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'today') {
      fetchDailyData();
    } else if (activeTab === 'approvals') {
      fetchPendingCorrections();
    } else if (activeTab === 'monthly') {
      fetchMonthlySummary();
    }
  }, [activeTab, todayDate, search, deptFilter, statusFilter, selectedStaffId, selectedYear, selectedMonth]);

  const handleCheckIn = async (staffId: number) => {
    if (window.api?.attendance) {
      const res = await window.api.attendance.checkIn(staffId);
      if (res.success) {
        fetchDailyData();
      } else {
        alert(res.error || 'Check-in failed');
      }
    }
  };

  const handleCheckOut = async (staffId: number) => {
    if (window.api?.attendance) {
      const res = await window.api.attendance.checkOut(staffId);
      if (res.success) {
        fetchDailyData();
      } else {
        alert(res.error || 'Check-out failed');
      }
    }
  };

  const handleApproveCorrection = async (correctionId: number, approve: boolean) => {
    if (window.api?.attendance) {
      const res = await window.api.attendance.approveCorrection(correctionId, approve);
      if (res.success) {
        fetchPendingCorrections();
        fetchDailyData();
      } else {
        alert(res.error || 'Action failed');
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMessage('');
    try {
      if (window.api?.attendance) {
        const res = await window.api.attendance.updateSettings(settings);
        if (res.success) {
          setSettingsMessage('Attendance settings updated successfully.');
        } else {
          setSettingsMessage(res.error || 'Failed to update settings.');
        }
      }
    } catch (err: any) {
      setSettingsMessage(err.message || 'Action failed.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-sm">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Management</h1>
            <p className="text-xs font-semibold text-slate-500">Track daily check-in/out, working hours, late arrivals & monthly summaries</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={todayDate}
            onChange={(e) => setTodayDate(e.target.value)}
            className="w-40"
          />
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsManualModalOpen(true)}>
            Mark Manual Attendance
          </Button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{kpis.total_staff}</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-2">{kpis.present}</p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border border-rose-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-700 mt-2">{kpis.absent}</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-700 mt-2">{kpis.late}</p>
        </Card>

        <Card className="p-4 bg-cyan-50/50 border border-cyan-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider">Half / Permission</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xl font-extrabold text-cyan-700 mt-2">{kpis.half_day + kpis.permission}</p>
        </Card>

        <Card className="p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Not Marked</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-600 mt-2">{kpis.not_marked}</p>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'today'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Today's Attendance
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'monthly'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Monthly Summary & Calendar
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Reports & Analytics
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 relative ${
            activeTab === 'approvals'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Correction Approvals
          {pendingCorrections.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCorrections.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Timing Settings
        </button>
      </div>

      {/* TAB 1: TODAY'S ATTENDANCE */}
      {activeTab === 'today' && (
        <Card className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(Number(e.target.value) || '')}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF DAY</option>
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="NOT_MARKED">NOT MARKED</option>
              </select>
            </div>
          </div>

          {/* Daily Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Status & Flags</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {dailyList.map((row) => (
                  <tr key={row.staff_id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#2012ad]">{row.staff_code}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">
                      {row.first_name} {row.last_name || ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{row.department_name || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      {row.check_in ? (
                        <span className="font-mono font-bold text-slate-800">{row.check_in}</span>
                      ) : (
                        <span className="text-slate-400">--:--</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.check_out ? (
                        <span className="font-mono font-bold text-slate-800">{row.check_out}</span>
                      ) : (
                        <span className="text-slate-400">--:--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{row.worked_hours_formatted}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            row.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.status === 'ABSENT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : row.status === 'HALF_DAY'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.status}
                        </span>

                        {row.late_minutes > 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                            Late ({row.late_minutes}m)
                          </span>
                        )}

                        {row.early_exit_minutes > 0 && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                            Early Exit ({row.early_exit_minutes}m)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!row.check_in ? (
                          <Button size="sm" variant="primary" onClick={() => handleCheckIn(row.staff_id)}>
                            Check In
                          </Button>
                        ) : !row.check_out ? (
                          <Button size="sm" variant="outline" onClick={() => handleCheckOut(row.staff_id)}>
                            Check Out
                          </Button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Completed</span>
                        )}

                        <button
                          onClick={() => {
                            setSelectedRecordForCorrection(row);
                            setIsCorrectionModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-[#2012ad] hover:underline"
                        >
                          Correct
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: MONTHLY SUMMARY & CALENDAR */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 p-2.5"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_code} — {s.first_name} {s.last_name || ''}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 p-2.5"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 p-2.5"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {monthlySummary && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Attendance Score:</span>
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-[#2012ad] text-sm font-extrabold rounded-full">
                  {monthlySummary.attendance_percentage}%
                </span>
              </div>
            )}
          </Card>

          {monthlySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="p-4 bg-slate-50">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Working Days</span>
                <p className="text-lg font-bold text-slate-900 mt-1">{monthlySummary.working_days} Days</p>
              </Card>
              <Card className="p-4 bg-emerald-50/50">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Present</span>
                <p className="text-lg font-bold text-emerald-700 mt-1">{monthlySummary.present_count} Days</p>
              </Card>
              <Card className="p-4 bg-rose-50/50">
                <span className="text-[10px] font-extrabold text-rose-600 uppercase">Absent</span>
                <p className="text-lg font-bold text-rose-700 mt-1">{monthlySummary.absent_count} Days</p>
              </Card>
              <Card className="p-4 bg-amber-50/50">
                <span className="text-[10px] font-extrabold text-amber-600 uppercase">Late Arrivals</span>
                <p className="text-lg font-bold text-amber-700 mt-1">{monthlySummary.late_count} Times</p>
              </Card>
              <Card className="p-4 bg-indigo-50/50">
                <span className="text-[10px] font-extrabold text-[#2012ad] uppercase">Total Worked</span>
                <p className="text-lg font-bold text-[#2012ad] mt-1">{monthlySummary.total_worked_hours_formatted}</p>
              </Card>
              <Card className="p-4 bg-cyan-50/50">
                <span className="text-[10px] font-extrabold text-cyan-600 uppercase">Half Days</span>
                <p className="text-lg font-bold text-cyan-700 mt-1">{monthlySummary.half_day_count} Days</p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORTS */}
      {activeTab === 'reports' && (
        <Card className="space-y-4 text-center py-12">
          <BarChart3 className="w-12 h-12 text-[#2012ad] mx-auto opacity-80" />
          <h3 className="text-base font-bold text-slate-900">Attendance Reports & Exports</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Generate monthly staff attendance reports, late arrival summaries, and CSV data exports.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" icon={<FileSpreadsheet className="w-4 h-4" />}>
              Export Attendance CSV
            </Button>
            <Button variant="outline" icon={<Printer className="w-4 h-4" />}>
              Print Monthly Summary
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 4: APPROVALS */}
      {activeTab === 'approvals' && (
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Pending Attendance Corrections ({pendingCorrections.length})
          </h3>

          {pendingCorrections.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No pending attendance correction requests.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCorrections.map((corr) => (
                <div key={corr.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {corr.staff_code} — {corr.first_name} {corr.last_name || ''}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-[#2012ad] text-[10px] font-bold rounded-md">
                        {corr.attendance_date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Reason: <span className="font-semibold text-slate-800">{corr.reason}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Requested by @{corr.requested_by_name || 'Manager'} • New Check-In: {corr.new_check_in || 'N/A'}, Check-Out: {corr.new_check_out || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="danger" icon={<X className="w-3.5 h-3.5" />} onClick={() => handleApproveCorrection(corr.id, false)}>
                      Reject
                    </Button>
                    <Button size="sm" variant="primary" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleApproveCorrection(corr.id, true)}>
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="max-w-2xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Shop Working Hours & Grace Period Settings</h3>
            <p className="text-xs text-slate-500">Configure store operating timings for automatic late and early exit calculations</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsMessage && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-[#2012ad]">
                {settingsMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Shop Work Start Time *"
                type="time"
                value={settings.work_start_time || '09:00'}
                onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
                required
              />
              <Input
                label="Shop Work End Time *"
                type="time"
                value={settings.work_end_time || '18:00'}
                onChange={(e) => setSettings({ ...settings, work_end_time: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Late Grace Period (Mins) *"
                type="number"
                value={settings.grace_minutes || 10}
                onChange={(e) => setSettings({ ...settings, grace_minutes: Number(e.target.value) })}
                required
              />
              <Input
                label="Full Day (Minutes) *"
                type="number"
                value={settings.full_day_minutes || 480}
                onChange={(e) => setSettings({ ...settings, full_day_minutes: Number(e.target.value) })}
                required
              />
              <Input
                label="Half Day (Minutes) *"
                type="number"
                value={settings.half_day_minutes || 240}
                onChange={(e) => setSettings({ ...settings, half_day_minutes: Number(e.target.value) })}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" isLoading={settingsLoading}>
                Save Attendance Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={fetchDailyData}
        staffList={staffList}
        initialDate={todayDate}
      />

      {/* Correction Modal */}
      <RequestCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSuccess={fetchDailyData}
        attendanceRecord={selectedRecordForCorrection}
      />
    </div>
  );
};
