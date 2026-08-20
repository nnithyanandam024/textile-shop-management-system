import React, { useState } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { useStaffAttendance } from '../hooks/useStaffAttendance';
import { TodayAttendanceCard } from '../components/attendance/TodayAttendanceCard';
import { AttendanceSummary } from '../components/attendance/AttendanceSummary';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar';
import { AttendanceHistory } from '../components/attendance/AttendanceHistory';
import { AttendanceDetailsModal } from '../components/attendance/AttendanceDetailsModal';
import { CorrectionRequestModal } from '../components/attendance/CorrectionRequestModal';
import { AttendanceHistoryItem, staffAttendanceService } from '../services/staffAttendanceService';
import { AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

export const StaffAttendance: React.FC = () => {
  const {
    today,
    history,
    summary,
    correctionRequests,
    selectedMonth,
    setSelectedMonth,
    statusFilter,
    setStatusFilter,
    loading,
    actionLoading,
    error,
    successMessage,
    liveSeconds,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    requestCorrection,
    refresh,
    clearError,
    clearSuccess,
  } = useStaffAttendance();

  // Modals state
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<AttendanceHistoryItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceHistoryItem | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  const handleDateClick = async (dateStr: string) => {
    try {
      const record = await staffAttendanceService.getAttendanceByDate(dateStr);
      if (record) {
        setSelectedRecordForDetails(record);
        setIsDetailsModalOpen(true);
      } else {
        // Create blank representation for that date
        setSelectedRecordForDetails({
          id: 0,
          attendanceDate: dateStr,
          status: 'NOT_CHECKED_IN',
          checkIn: null,
          checkOut: null,
          breakStart: null,
          breakEnd: null,
          totalBreakMinutes: 0,
          workedMinutes: 0,
          lateMinutes: 0,
          earlyExitMinutes: 0,
          formattedHours: '0h 0m',
          shiftName: 'Morning Shift',
          scheduledStart: '09:00',
          scheduledEnd: '18:00',
        });
        setIsDetailsModalOpen(true);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenCorrection = (record?: AttendanceHistoryItem) => {
    setSelectedRecordForCorrection(record || null);
    setIsCorrectionModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <StaffHeader />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Page Title & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  My Attendance & Timesheet
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Track your daily work sessions, breaks, clock-in records, and monthly statistics
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCorrection()}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Request Attendance Correction</span>
              </button>
            </div>

            {/* Notifications */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={clearSuccess}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refresh}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-[11px] font-bold text-red-900 transition-colors flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-red-700 hover:text-red-900"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {loading || !today ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-slate-200 rounded-3xl" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-72 bg-slate-200 rounded-3xl" />
                  <div className="h-72 bg-slate-200 rounded-3xl" />
                </div>
              </div>
            ) : (
              <>
                {/* 1. Today's Attendance Hero Card */}
                <TodayAttendanceCard
                  today={today}
                  liveSeconds={liveSeconds}
                  onCheckIn={checkIn}
                  onCheckOut={checkOut}
                  onStartBreak={startBreak}
                  onEndBreak={endBreak}
                  onRequestCorrectionClick={() => handleOpenCorrection()}
                  isLoading={actionLoading}
                />

                {/* 2. Monthly Summary Card */}
                <AttendanceSummary summary={summary} />

                {/* 3. Interactive Attendance Calendar */}
                <AttendanceCalendar
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  history={history}
                  onDateClick={handleDateClick}
                />

                {/* 4. Tabular Attendance History with Filters */}
                <AttendanceHistory
                  history={history}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  onViewDetails={handleDateClick}
                  onRequestCorrection={handleOpenCorrection}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AttendanceDetailsModal
        record={selectedRecordForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onRequestCorrection={(rec) => {
          setSelectedRecordForCorrection(rec);
          setIsCorrectionModalOpen(true);
        }}
      />

      <CorrectionRequestModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSubmitRequest={requestCorrection}
        prefilledRecord={selectedRecordForCorrection}
        pastRequests={correctionRequests}
        isSubmitting={actionLoading}
      />
    </div>
  );
};
