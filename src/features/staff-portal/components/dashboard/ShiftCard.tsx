import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Calendar, ArrowRight, MapPin, Coffee, Sparkles } from 'lucide-react';

interface ShiftCardProps {
  hasShift: boolean;
  isDayOff: boolean;
  name?: string;
  timeRange?: string;
  location?: string;
  breakTime?: string;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  hasShift,
  isDayOff,
  name = 'Morning Shift',
  timeRange = '09:00 AM – 06:00 PM',
  location = 'Main Textile Shop',
  breakTime = '01:00 PM – 02:00 PM',
}) => {
  const navigate = useNavigate();

  const renderContent = () => {
    if (isDayOff) {
      return (
        <div className="space-y-2 py-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 🌿 DAY OFF
          </div>
          <p className="text-xs font-semibold text-slate-500 pt-1">
            No shift scheduled today. Enjoy your weekly off!
          </p>
        </div>
      );
    }

    if (!hasShift) {
      return (
        <div className="space-y-2 py-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-xs font-bold">
            No Shift Assigned
          </div>
          <p className="text-xs font-semibold text-slate-500 pt-1">
            Please contact your store manager for shift roster details.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        <div>
          <span className="text-sm font-extrabold text-slate-900 block">{name}</span>
          <p className="text-xs font-extrabold text-[#2818cf] font-mono mt-0.5">{timeRange}</p>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Break: {breakTime}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center border border-indigo-100 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Today's Shift
            </h3>
          </div>
        </div>

        <div className="mt-2">{renderContent()}</div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/staff/shifts')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-indigo-50/80 text-slate-700 hover:text-[#2818cf] border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all group"
        >
          <span>View Shifts</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
};
