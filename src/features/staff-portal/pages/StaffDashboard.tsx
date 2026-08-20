import React from 'react';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { StaffHeader } from '../components/StaffHeader';
import { StaffSidebar } from '../components/StaffSidebar';
import { Card } from '../../../components/ui/Card';
import { Sparkles, Calendar, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffDashboard: React.FC = () => {
  const { currentStaffUser } = useStaffAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900 selection:bg-[#2818cf] selection:text-white">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StaffHeader />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {/* Welcome Hero Banner */}
          <div className="p-8 bg-gradient-to-r from-[#2818cf] via-indigo-600 to-indigo-800 text-white rounded-3xl shadow-xl shadow-[#2818cf]/15 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold text-indigo-100 border border-white/20">
                <Sparkles className="w-3.5 h-3.5" /> Staff Self-Service Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome, {currentStaffUser?.displayName}!
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 font-semibold max-w-xl leading-relaxed">
                You are currently logged in with Employee ID{' '}
                <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-white">
                  {currentStaffUser?.employeeCode}
                </span>{' '}
                as <span className="font-bold text-white">{currentStaffUser?.roleName}</span>.
              </p>
            </div>
          </div>

          {/* Quick Access Grid / Shell Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              className="p-5 bg-white border border-slate-200/80 hover:border-[#2818cf] transition-all cursor-pointer group"
              onClick={() => navigate('/self-service/profile')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Employee Profile
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-extrabold text-slate-900 mt-2">{currentStaffUser?.displayName}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{currentStaffUser?.departmentName || 'Main Store'}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[11px] font-bold text-[#2818cf] gap-1">
                <span>View Full Profile</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            <Card
              className="p-5 bg-white border border-slate-200/80 hover:border-[#2818cf] transition-all cursor-pointer group"
              onClick={() => navigate('/self-service/attendance')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Attendance & Check-in
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-extrabold text-slate-900 mt-2">Active Work Shift</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">09:00 AM – 06:00 PM</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[11px] font-bold text-emerald-600 gap-1">
                <span>Check Attendance</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            <Card
              className="p-5 bg-white border border-slate-200/80 hover:border-[#2818cf] transition-all cursor-pointer group"
              onClick={() => navigate('/self-service/payroll')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Payslip & Salary
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-extrabold text-slate-900 mt-2">Confidential Payroll</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">August 2026</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[11px] font-bold text-amber-600 gap-1">
                <span>View Payslips</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Phase 2 Coming Soon Notice */}
          <Card className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">STAFF DASHBOARD SHELL</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Phase 1 Staff Login and Authentication is active. Today's live attendance, upcoming shifts, leave counters, and quick actions will be integrated in <strong>Phase 2: Today View & Personal Summary</strong>.
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};
