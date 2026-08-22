import React from 'react';
import { MonthlyAttendanceSummary } from '../../services/staffAttendanceService';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Percent,
} from 'lucide-react';

interface AttendanceSummaryProps {
  summary: MonthlyAttendanceSummary | null;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Monthly Summary ({summary.month})
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Aggregated monthly performance & attendance rate
            </p>
          </div>
        </div>

        {/* Attendance Rate Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-extrabold">
          <Percent className="w-3.5 h-3.5 text-emerald-600" />
          <span>{summary.attendanceRate}% Rate</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
              Present Days
            </span>
            <p className="text-lg font-extrabold text-emerald-950 mt-0.5">
              {summary.presentCount} <span className="text-xs font-semibold text-emerald-700">days</span>
            </p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
        </div>

        <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
              Late Arrivals
            </span>
            <p className="text-lg font-extrabold text-amber-950 mt-0.5">
              {summary.lateCount} <span className="text-xs font-semibold text-amber-700">times</span>
            </p>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500 opacity-80" />
        </div>

        <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">
              Absences
            </span>
            <p className="text-lg font-extrabold text-rose-950 mt-0.5">
              {summary.absentCount} <span className="text-xs font-semibold text-rose-700">days</span>
            </p>
          </div>
          <XCircle className="w-6 h-6 text-rose-500 opacity-80" />
        </div>

        <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
              Total Hours
            </span>
            <p className="text-lg font-extrabold text-indigo-950 mt-0.5 font-mono">
              {summary.totalHoursFormatted}
            </p>
          </div>
          <Clock className="w-6 h-6 text-[#2012ad] opacity-80" />
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Approved Leaves: <strong className="text-slate-900">{summary.leaveCount}</strong></span>
        </div>
        <div className="text-slate-600 font-semibold">
          Half Days: <strong className="text-slate-900">{summary.halfDayCount}</strong>
        </div>
        <div className="text-slate-600 font-semibold">
          Store Holidays: <strong className="text-slate-900">{summary.holidayCount}</strong>
        </div>
        <div className="text-slate-600 font-semibold">
          Weekly Offs: <strong className="text-slate-900">{summary.weekOffCount}</strong>
        </div>
      </div>
    </div>
  );
};
