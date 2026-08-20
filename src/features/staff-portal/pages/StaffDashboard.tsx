import React from 'react';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { useStaffDashboard } from '../hooks/useStaffDashboard';
import { StaffHeader } from '../components/StaffHeader';
import { StaffSidebar } from '../components/StaffSidebar';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
import { AttendanceCard } from '../components/dashboard/AttendanceCard';
import { ShiftCard } from '../components/dashboard/ShiftCard';
import { LeaveBalanceCard } from '../components/dashboard/LeaveBalanceCard';
import { DocumentStatusCard } from '../components/dashboard/DocumentStatusCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { UpcomingShifts } from '../components/dashboard/UpcomingShifts';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { AlertCircle, RotateCw } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { currentStaffUser } = useStaffAuth();
  const { data, loading, error, refresh } = useStaffDashboard();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900 selection:bg-[#2818cf] selection:text-white">
      {/* Responsive Staff Sidebar */}
      <StaffSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StaffHeader />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {loading && !data ? (
            <DashboardSkeleton />
          ) : error && !data ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="p-8 bg-white border border-rose-200 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Unable to load dashboard</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{error}</p>
                </div>
                <button
                  onClick={refresh}
                  className="w-full py-2.5 px-4 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#2818cf]/20 flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          ) : data ? (
            <>
              {/* 1. Welcome Section */}
              <WelcomeSection
                firstName={data.staff.firstName || currentStaffUser?.displayName.split(' ')[0] || 'Staff'}
                employeeCode={data.staff.employeeCode || currentStaffUser?.employeeCode || 'STF-0001'}
                roleName={data.staff.designationName || currentStaffUser?.roleName || 'STAFF'}
                onRefresh={refresh}
                isRefreshing={loading}
              />

              {/* 2. Top Metric Cards: Attendance, Shift, Leave Balance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AttendanceCard
                  status={data.attendance.status}
                  checkIn={data.attendance.checkIn}
                  checkOut={data.attendance.checkOut}
                  workedFormatted={data.attendance.workedFormatted}
                  shiftStart={data.attendance.shiftStart}
                />

                <ShiftCard
                  hasShift={data.todayShift.hasShift}
                  isDayOff={data.todayShift.isDayOff}
                  name={data.todayShift.name}
                  timeRange={data.todayShift.timeRange}
                  location={data.todayShift.location}
                  breakTime={data.todayShift.breakTime}
                />

                <LeaveBalanceCard balances={data.leaveBalances} />
              </div>

              {/* 3. Document Compliance Status Card */}
              <DocumentStatusCard
                totalRequired={data.documents.totalRequired}
                verifiedCount={data.documents.verifiedCount}
                completionPercentage={data.documents.completionPercentage}
                items={data.documents.items}
                expiringAlert={data.documents.expiringAlert}
              />

              {/* 4. Quick Actions */}
              <QuickActions />

              {/* 5. Bottom Two Column Grid: Upcoming Shifts & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UpcomingShifts shifts={data.upcomingShifts} />
                <RecentActivity activities={data.recentActivity} />
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
};
