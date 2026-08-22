import React, { useState } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { useStaffLeave } from '../hooks/useStaffLeave';
import { LeaveBalanceCards } from '../components/leave/LeaveBalanceCards';
import { LeaveCalendar } from '../components/leave/LeaveCalendar';
import { LeaveRequestList } from '../components/leave/LeaveRequestList';
import { LeaveHistory } from '../components/leave/LeaveHistory';
import { LeaveFilters } from '../components/leave/LeaveFilters';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal';
import { PermissionRequestModal } from '../components/leave/PermissionRequestModal';
import { LeaveDetailsModal } from '../components/leave/LeaveDetailsModal';
import { CancelLeaveDialog } from '../components/leave/CancelLeaveDialog';
import { StaffLeaveRequestItem, LeaveCalendarDayItem } from '../services/staffLeaveService';
import {
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Plus,
  Clock,
} from 'lucide-react';

export const StaffLeave: React.FC = () => {
  const {
    balances,
    leaveTypes,
    requests,
    permissions,
    calendar,
    history,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    loading,
    actionLoading,
    error,
    successMessage,
    applyLeave,
    cancelLeave,
    requestPermission,
    cancelPermission,
    refresh,
    clearError,
    clearSuccess,
  } = useStaffLeave();

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<StaffLeaveRequestItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Cancellation Confirmation Dialog
  const [cancelTarget, setCancelTarget] = useState<{ id: number; type: 'LEAVE' | 'PERMISSION' } | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const handleOpenDetails = (req: StaffLeaveRequestItem) => {
    setSelectedRequestForDetails(req);
    setIsDetailsModalOpen(true);
  };

  const handleOpenCalendarDay = (day: LeaveCalendarDayItem) => {
    if (day.status === 'APPROVED_LEAVE' || day.status === 'PENDING_LEAVE') {
      const match = requests.find((r) => day.date >= r.startDate && day.date <= r.endDate);
      if (match) {
        handleOpenDetails(match);
      }
    }
  };

  const handleTriggerCancelLeave = (requestId: number) => {
    setCancelTarget({ id: requestId, type: 'LEAVE' });
    setIsCancelDialogOpen(true);
  };

  const handleTriggerCancelPermission = (permId: number) => {
    setCancelTarget({ id: permId, type: 'PERMISSION' });
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    let ok = false;
    if (cancelTarget.type === 'LEAVE') {
      ok = await cancelLeave(cancelTarget.id);
    } else {
      ok = await cancelPermission(cancelTarget.id);
    }
    if (ok) {
      setIsCancelDialogOpen(false);
      setCancelTarget(null);
    }
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
                  My Leave & Permission Management
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Manage your annual time off quota, apply for full/half day leaves, request short permissions, and track approvals
                </p>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsPermissionModalOpen(true)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Permission</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(true)}
                  className="px-3.5 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply Leave</span>
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

            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-44 bg-slate-200 rounded-3xl" />
                <div className="h-64 bg-slate-200 rounded-3xl" />
                <div className="h-48 bg-slate-200 rounded-3xl" />
              </div>
            ) : (
              <>
                {/* 1. Leave Balance Cards */}
                <LeaveBalanceCards
                  balances={balances}
                  onApplyLeave={() => setIsApplyModalOpen(true)}
                  onRequestPermission={() => setIsPermissionModalOpen(true)}
                />

                {/* 2. Monthly Leave Calendar */}
                <LeaveCalendar
                  calendar={calendar}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onSelectDay={handleOpenCalendarDay}
                />

                {/* 3. Filters */}
                <LeaveFilters
                  leaveTypes={leaveTypes}
                  selectedType={typeFilter}
                  onTypeChange={setTypeFilter}
                  selectedStatus={statusFilter}
                  onStatusChange={setStatusFilter}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  onReset={() => {
                    setStatusFilter('ALL');
                    setTypeFilter(undefined);
                    setSelectedYear(new Date().getFullYear());
                  }}
                />

                {/* 4. Requests & Permissions List */}
                <LeaveRequestList
                  requests={requests}
                  permissions={permissions}
                  onSelectRequest={handleOpenDetails}
                  onCancelRequest={handleTriggerCancelLeave}
                  onCancelPermission={handleTriggerCancelPermission}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  isLoading={actionLoading}
                />

                {/* 5. Annual Leave History Log */}
                <LeaveHistory
                  history={history}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  onSelectRequest={handleOpenDetails}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={applyLeave}
        leaveTypes={leaveTypes}
        balances={balances}
        isSubmitting={actionLoading}
      />

      <PermissionRequestModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onSubmit={requestPermission}
        isSubmitting={actionLoading}
      />

      <LeaveDetailsModal
        request={selectedRequestForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onCancelRequest={handleTriggerCancelLeave}
      />

      <CancelLeaveDialog
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setCancelTarget(null);
        }}
        onConfirm={handleConfirmCancel}
        isSubmitting={actionLoading}
        title={cancelTarget?.type === 'PERMISSION' ? 'Cancel Permission Request?' : 'Cancel Leave Request?'}
        description={
          cancelTarget?.type === 'PERMISSION'
            ? 'Are you sure you want to cancel this hourly permission request?'
            : 'Are you sure you want to cancel this leave application? Pending applications will be cancelled.'
        }
      />
    </div>
  );
};
