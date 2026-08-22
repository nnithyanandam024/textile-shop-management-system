import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Clock, MapPin } from 'lucide-react';

export const MyShiftsPage: React.FC = () => {
  const weeklySchedule = [
    { day: 'Monday', shift: 'Morning Shift', hours: '09:00 AM – 06:00 PM', location: 'Main Textile Shop', status: 'ACTIVE' },
    { day: 'Tuesday', shift: 'Morning Shift', hours: '09:00 AM – 06:00 PM', location: 'Main Textile Shop', status: 'ACTIVE' },
    { day: 'Wednesday', shift: 'Evening Shift', hours: '10:00 AM – 07:00 PM', location: 'Main Textile Shop', status: 'ACTIVE' },
    { day: 'Thursday', shift: 'Morning Shift', hours: '09:00 AM – 06:00 PM', location: 'Main Textile Shop', status: 'ACTIVE' },
    { day: 'Friday', shift: 'Morning Shift', hours: '09:00 AM – 06:00 PM', location: 'Main Textile Shop', status: 'ACTIVE' },
    { day: 'Saturday', shift: 'Half-Day Shift', hours: '09:00 AM – 02:00 PM', location: 'Main Textile Shop', status: 'ACTIVE' },
    { day: 'Sunday', shift: 'Weekly Off', hours: 'OFF', location: 'N/A', status: 'OFF' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Work Schedule & Shifts</h1>
          <p className="text-xs font-semibold text-slate-500">View weekly roster, shift timings and assigned store work location</p>
        </div>
      </div>

      {/* Today Banner */}
      <Card className="p-6 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Today's Assigned Shift</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Morning Store Shift</h3>
          <p className="text-xs font-bold text-amber-800 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> 09:00 AM – 06:00 PM (9.0 Hours)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-4 py-2 rounded-xl border border-amber-200">
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>Main Storefront Sales Counter</span>
        </div>
      </Card>

      {/* Weekly Schedule Matrix */}
      <Card className="space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Shift Roster</h3>
          <span className="text-[11px] font-semibold text-slate-500">Standard 6-Day Store Cycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 p-4">
          {weeklySchedule.map((s, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                s.status === 'OFF'
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200/90 hover:border-[#2012ad]'
              }`}
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{s.day}</span>
                <p className="font-extrabold text-slate-900 text-xs mt-1">{s.shift}</p>
                <p className="text-[11px] font-semibold text-[#2012ad] mt-0.5">{s.hours}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate">{s.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
