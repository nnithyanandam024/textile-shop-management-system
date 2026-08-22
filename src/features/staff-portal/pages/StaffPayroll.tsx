import React from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { useStaffPayroll } from '../hooks/useStaffPayroll';
import { SalaryOverview } from '../components/payroll/SalaryOverview';
import { SalaryComponents } from '../components/payroll/SalaryComponents';
import { OvertimeSummary } from '../components/payroll/OvertimeSummary';
import { IncentiveSummary } from '../components/payroll/IncentiveSummary';
import { DeductionSummary } from '../components/payroll/DeductionSummary';
import { AttendanceImpact } from '../components/payroll/AttendanceImpact';
import { LeaveImpact } from '../components/payroll/LeaveImpact';
import { PayslipHistory } from '../components/payroll/PayslipHistory';
import { PayslipDetailsModal } from '../components/payroll/PayslipDetailsModal';
import { SalaryHistory } from '../components/payroll/SalaryHistory';
import {
  FileText,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

export const StaffPayroll: React.FC = () => {
  const {
    currentPayroll,
    periods,
    selectedPeriodId,
    history,
    salaryHistory,
    overtimeSummary,
    incentiveSummary,
    loading,
    error,
    activePayslipDetails,
    isPayslipModalOpen,
    setIsPayslipModalOpen,
    selectPeriod,
    viewPayslip,
    refresh,
    clearError,
  } = useStaffPayroll();

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
            {/* Page Title & Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  My Payroll & Compensation
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  View your salary overview, allowances, approved overtime, incentives, deductions, and official payslips
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => viewPayslip()}
                  disabled={!currentPayroll}
                  className="px-4 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Current Payslip</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
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
                <div className="h-56 bg-slate-200 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64 bg-slate-200 rounded-3xl" />
                  <div className="h-64 bg-slate-200 rounded-3xl" />
                </div>
                <div className="h-48 bg-slate-200 rounded-3xl" />
              </div>
            ) : (
              <>
                {/* 1. Salary Overview Card */}
                <SalaryOverview
                  payroll={currentPayroll}
                  periods={periods}
                  selectedPeriodId={selectedPeriodId}
                  onSelectPeriod={selectPeriod}
                  onViewPayslip={() => viewPayslip()}
                />

                {/* 2. Side-by-Side Breakdown: Earnings vs Deductions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Earnings */}
                  <div className="space-y-6">
                    <SalaryComponents payroll={currentPayroll} />
                    <OvertimeSummary overtime={overtimeSummary} />
                    <IncentiveSummary incentives={incentiveSummary} />
                  </div>

                  {/* Right Column: Deductions & Impact */}
                  <div className="space-y-6">
                    <DeductionSummary payroll={currentPayroll} />
                    <AttendanceImpact attendance={currentPayroll?.attendanceImpact || null} />
                    <LeaveImpact leaveImpact={currentPayroll?.leaveImpact || null} />
                  </div>
                </div>

                {/* 3. Payslip History Table */}
                <PayslipHistory history={history} onViewPayslip={viewPayslip} />

                {/* 4. Salary Revision History Timeline */}
                <SalaryHistory salaryHistory={salaryHistory} />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Payslip Inspection & Print Modal */}
      <PayslipDetailsModal
        payroll={activePayslipDetails}
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
      />
    </div>
  );
};
