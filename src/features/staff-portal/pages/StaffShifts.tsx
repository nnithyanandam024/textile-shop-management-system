import React, { useState } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { useStaffShifts } from '../hooks/useStaffShifts';
import { TodayShiftCard } from '../components/shifts/TodayShiftCard';
import { WeeklySchedule } from '../components/shifts/WeeklySchedule';
import { ShiftCalendar } from '../components/shifts/ShiftCalendar';
import { UpcomingShifts } from '../components/shifts/UpcomingShifts';
import { ShiftRequestHistory } from '../components/shifts/ShiftRequestHistory';
import { ShiftHistory } from '../components/shifts/ShiftHistory';
import { ShiftDetailsModal } from '../components/shifts/ShiftDetailsModal';
import { ShiftChangeRequestModal } from '../components/shifts/ShiftChangeRequestModal';
import { ShiftSwapRequestModal } from '../components/shifts/ShiftSwapRequestModal';
import { StaffShiftItem } from '../services/staffShiftService';
import {
  CalendarCheck,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

export const StaffShifts: React.FC = () => {
  const {
    todayShift,
    weeklySchedule,
    monthlySchedule,
    upcomingShifts,
    requests,
    templates,
    selectedMonth,
    setSelectedMonth,
    loading,
    actionLoading,
    error,
    successMessage,
    requestChange,
    requestSwap,
    cancelRequest,
    refresh,
    clearError,
    clearSuccess,
  } = useStaffShifts();

  // Modals state
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<StaffShiftItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedShiftForChange, setSelectedShiftForChange] = useState<StaffShiftItem | null>(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  const [selectedShiftForSwap, setSelectedShiftForSwap] = useState<StaffShiftItem | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const handleOpenDetails = (shift: StaffShiftItem) => {
    setSelectedShiftForDetails(shift);
    setIsDetailsModalOpen(true);
  };

  const handleOpenChange = (shift?: StaffShiftItem) => {
    setSelectedShiftForChange(shift || todayShift || null);
    setIsChangeModalOpen(true);
  };

  const handleOpenSwap = (shift?: StaffShiftItem) => {
    setSelectedShiftForSwap(shift || todayShift || null);
    setIsSwapModalOpen(true);
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
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  My Work Shifts & Schedule
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  View your assigned roster, store location, weekly timetable, and submit schedule requests
                </p>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleOpenSwap()}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Swap Shift</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenChange()}
                  className="px-3.5 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Request Change</span>
                </button>
              </div>
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

            {loading || !todayShift ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-3xl" />
                <div className="h-44 bg-slate-200 rounded-3xl" />
                <div className="h-64 bg-slate-200 rounded-3xl" />
              </div>
            ) : (
              <>
                {/* 1. Today's Shift Hero Card */}
                <TodayShiftCard
                  shift={todayShift}
                  onRequestChange={() => handleOpenChange(todayShift)}
                  onRequestSwap={() => handleOpenSwap(todayShift)}
                />

                {/* 2. 7-Day Weekly Timetable Grid */}
                <WeeklySchedule
                  schedule={weeklySchedule}
                  onSelectDay={handleOpenDetails}
                />

                {/* 3. Interactive Monthly Shift Roster Calendar */}
                <ShiftCalendar
                  monthlySchedule={monthlySchedule}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onSelectDay={handleOpenDetails}
                />

                {/* 4. Upcoming Next 7 Days Shifts */}
                <UpcomingShifts
                  shifts={upcomingShifts}
                  onSelectShift={handleOpenDetails}
                />

                {/* 5. Request Status History */}
                <ShiftRequestHistory
                  requests={requests}
                  onCancelRequest={cancelRequest}
                  isLoading={actionLoading}
                />

                {/* 6. Past Shift History Log */}
                <ShiftHistory
                  shifts={monthlySchedule?.days.filter((d) => d.date <= new Date().toISOString().slice(0, 10)) || []}
                  onSelectShift={handleOpenDetails}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ShiftDetailsModal
        shift={selectedShiftForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onRequestChange={handleOpenChange}
        onRequestSwap={handleOpenSwap}
      />

      <ShiftChangeRequestModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        onSubmit={requestChange}
        prefilledShift={selectedShiftForChange}
        templates={templates}
        isSubmitting={actionLoading}
      />

      <ShiftSwapRequestModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        onSubmit={requestSwap}
        prefilledShift={selectedShiftForSwap}
        isSubmitting={actionLoading}
      />
    </div>
  );
};
