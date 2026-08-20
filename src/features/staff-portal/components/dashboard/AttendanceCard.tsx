import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AttendanceCardProps {
  status: 'NOT_CHECKED_IN' | 'PRESENT' | 'COMPLETED' | 'HALF_DAY' | 'LATE' | 'ABSENT' | 'ON_LEAVE';
  checkIn?: string;
  checkOut?: string;
  workedFormatted: string;
  shiftStart?: string;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  status,
  checkIn,
  checkOut,
  workedFormatted,
  shiftStart = '09:00 AM',
}) => {
  const navigate = useNavigate();

  const renderContent = () => {
    if (status === 'COMPLETED') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> COMPLETED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Check In</p>
              <p className="text-xs font-bold text-slate-800">{checkIn || '09:02 AM'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Check Out</p>
              <p className="text-xs font-bold text-slate-800">{checkOut || '06:00 PM'}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Worked</p>
            <p className="text-sm font-extrabold text-slate-900">{workedFormatted}</p>
          </div>
        </div>
      );
    }

    if (status === 'PRESENT' || status === 'LATE') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> PRESENT
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Check In</p>
              <p className="text-xs font-bold text-slate-800">{checkIn || '09:02 AM'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Working Time</p>
              <p className="text-xs font-bold text-emerald-600">{workedFormatted}</p>
            </div>
          </div>
        </div>
      );
    }

    // NOT_CHECKED_IN or other status
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> NOT CHECKED IN
          </span>
        </div>
        <div className="pt-1 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400">Shift Expected Start</p>
          <p className="text-xs font-bold text-slate-800">{shiftStart}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Today's Attendance
            </h3>
          </div>
        </div>

        <div className="mt-2">{renderContent()}</div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/self-service/attendance')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-indigo-50/80 text-slate-700 hover:text-[#2818cf] border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all group"
        >
          <span>View Attendance</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
};
