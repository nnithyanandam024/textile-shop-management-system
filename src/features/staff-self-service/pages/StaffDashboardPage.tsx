import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  Calendar,
  FileText,
  Bell,
  ArrowRight,
  ShieldCheck,
  Send,
  UserCheck,
} from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      if (window.api?.selfService) {
        const res = await window.api.selfService.getDashboard();
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load staff self-service dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-[#2818cf] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading your personal workspace...</p>
      </div>
    );
  }

  const { profile, todayAttendance, todayShift, leaveBalance, documentCompletion, unreadNotificationsCount } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting Banner */}
      <Card className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-[#2818cf] text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-extrabold mb-2 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Employee Portal • {profile?.staff_code || 'STF-0001'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good Morning, {profile?.first_name || 'Staff Member'} 👋
            </h1>
            <p className="text-xs text-indigo-100/90 font-semibold mt-1">
              {profile?.designation_name || 'Sales Executive'} • {profile?.department_name || 'Storefront Sales'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
              icon={<Bell className="w-4 h-4" />}
              onClick={() => navigate('/self-service/notifications')}
            >
              Notifications ({unreadNotificationsCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Attendance */}
        <Card className="p-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900 mt-2">
            {todayAttendance?.check_in ? todayAttendance.check_in.slice(11, 16) : 'Not Checked In'}
          </p>
          <span className="text-[11px] font-bold text-emerald-600">
            {todayAttendance ? todayAttendance.status : 'Pending Check-In'}
          </span>
        </Card>

        {/* Shift */}
        <Card className="p-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Today's Shift</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900 mt-2">
            {todayShift?.start_time ? `${todayShift.start_time} – ${todayShift.end_time}` : '09:00 AM – 06:00 PM'}
          </p>
          <span className="text-[11px] font-bold text-amber-600">
            {todayShift?.shift_name || 'Standard Store Shift'}
          </span>
        </Card>

        {/* Leave Balance */}
        <Card className="p-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Leave Balance</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-[#2818cf]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-[#2818cf] mt-2">
            {leaveBalance?.remaining || 14} Days Remaining
          </p>
          <span className="text-[11px] font-semibold text-slate-500">
            {leaveBalance?.used || 0} days used of {leaveBalance?.total || 18}
          </span>
        </Card>

        {/* Documents */}
        <Card className="p-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Documents Compliance</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900 mt-2">
            {documentCompletion?.complianceScore || 100}% Complete
          </p>
          <span className="text-[11px] font-semibold text-cyan-700">
            {documentCompletion?.completedCount || 5} / {documentCompletion?.totalRequired || 5} Verified
          </span>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <Card className="p-5 space-y-3 bg-slate-50/50 border border-slate-200/80">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Button
            variant="outline"
            className="w-full bg-white justify-start"
            icon={<CalendarCheck className="w-4 h-4 text-emerald-600" />}
            onClick={() => navigate('/self-service/attendance')}
          >
            My Attendance
          </Button>

          <Button
            variant="outline"
            className="w-full bg-white justify-start"
            icon={<Calendar className="w-4 h-4 text-[#2818cf]" />}
            onClick={() => navigate('/self-service/leave')}
          >
            Apply Leave
          </Button>

          <Button
            variant="outline"
            className="w-full bg-white justify-start"
            icon={<FileText className="w-4 h-4 text-cyan-600" />}
            onClick={() => navigate('/self-service/documents')}
          >
            My Documents
          </Button>

          <Button
            variant="outline"
            className="w-full bg-white justify-start"
            icon={<UserCheck className="w-4 h-4 text-amber-600" />}
            onClick={() => navigate('/self-service/payroll')}
          >
            View Payslips
          </Button>

          <Button
            variant="outline"
            className="w-full bg-white justify-start"
            icon={<Send className="w-4 h-4 text-rose-600" />}
            onClick={() => navigate('/staff/communication')}
          >
            Message Manager
          </Button>
        </div>
      </Card>

      {/* Dashboard Grid Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="p-5 space-y-3 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Personal Information Summary</h3>
            <button
              onClick={() => navigate('/self-service/profile')}
              className="text-xs font-extrabold text-[#2818cf] hover:underline flex items-center gap-1"
            >
              View Full Profile <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Staff Code</span>
              <span className="font-extrabold text-slate-900">{profile?.staff_code || 'STF-0001'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Joining Date</span>
              <span className="font-extrabold text-slate-900">{profile?.joining_date || '2026-01-15'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Phone Number</span>
              <span className="font-extrabold text-slate-900">{profile?.phone || '+91 98765 43210'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Employment Type</span>
              <span className="font-extrabold text-slate-900">{profile?.employment_type || 'FULL_TIME'}</span>
            </div>
          </div>
        </Card>

        {/* Schedule & Timing Card */}
        <Card className="p-5 space-y-3 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Work Schedule Overview</h3>
            <button
              onClick={() => navigate('/self-service/shifts')}
              className="text-xs font-extrabold text-[#2818cf] hover:underline flex items-center gap-1"
            >
              Weekly Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-700">Monday – Friday</span>
              <span className="font-extrabold text-slate-900">09:00 AM – 06:00 PM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-700">Saturday</span>
              <span className="font-extrabold text-slate-900">09:00 AM – 02:00 PM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-700">Sunday</span>
              <span className="font-extrabold text-emerald-600">WEEKLY OFF</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
