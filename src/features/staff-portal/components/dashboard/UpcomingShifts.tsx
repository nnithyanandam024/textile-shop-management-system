import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Calendar, ArrowRight, Clock } from 'lucide-react';

interface UpcomingShiftItem {
  dayLabel: string;
  dateStr: string;
  name: string;
  startTime: string;
  endTime: string;
  timeRange: string;
}

interface UpcomingShiftsProps {
  shifts: UpcomingShiftItem[];
}

export const UpcomingShifts: React.FC<UpcomingShiftsProps> = ({ shifts }) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center border border-indigo-100 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Upcoming Shifts
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {shifts.length > 0 ? (
            shifts.map((shift, idx) => (
              <div key={idx} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {shift.dayLabel}
                  </span>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">{shift.name}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2818cf] font-mono bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100/70">
                    <Clock className="w-3 h-3 text-[#2818cf]" />
                    {shift.timeRange}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs font-semibold text-slate-400">
              <p className="font-bold text-slate-700">No upcoming shifts available.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Your schedule hasn't been assigned yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/self-service/shifts')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-indigo-50/80 text-slate-700 hover:text-[#2818cf] border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all group"
        >
          <span>View All Shifts</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
};
