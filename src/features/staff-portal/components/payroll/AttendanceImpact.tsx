import React from 'react';
import { StaffAttendanceImpactSummary } from '../../services/staffPayrollService';
import { CalendarCheck } from 'lucide-react';

interface AttendanceImpactProps {
  attendance: StaffAttendanceImpactSummary | null;
}

export const AttendanceImpact: React.FC<AttendanceImpactProps> = ({ attendance }) => {
  if (!attendance) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Attendance Impact on Payroll
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Direct correlation between time logs, shifts worked, and salary calculations
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
          {attendance.scheduledDays} Scheduled Working Days
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-700 block">Present Days</span>
          <strong className="text-lg font-extrabold text-emerald-900 font-mono">
            {attendance.presentDays} d
          </strong>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
          <span className="text-[10px] font-bold text-[#2012ad] block">Paid Leaves</span>
          <strong className="text-lg font-extrabold text-indigo-900 font-mono">
            {attendance.paidLeaveDays} d
          </strong>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-700 block">Unpaid Leaves</span>
          <strong className="text-lg font-extrabold text-amber-900 font-mono">
            {attendance.unpaidLeaveDays} d
          </strong>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl">
          <span className="text-[10px] font-bold text-rose-700 block">Absences</span>
          <strong className="text-lg font-extrabold text-rose-900 font-mono">
            {attendance.absentDays} d
          </strong>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 block">Late Check-ins</span>
          <strong className="text-lg font-extrabold text-slate-800 font-mono">
            {attendance.lateArrivals}
          </strong>
        </div>
      </div>
    </div>
  );
};
