import React from 'react';
import { ProfileActivityItem } from '../../services/staffProfileService';
import { History, UserCheck, KeyRound, Camera, PhoneCall, FileText } from 'lucide-react';

interface ProfileActivityProps {
  activities: ProfileActivityItem[];
}

export const ProfileActivity: React.FC<ProfileActivityProps> = ({ activities }) => {
  const getIcon = (action: string) => {
    if (action.includes('PASSWORD')) return <KeyRound className="w-3.5 h-3.5 text-purple-600" />;
    if (action.includes('PHOTO')) return <Camera className="w-3.5 h-3.5 text-indigo-600" />;
    if (action.includes('EMERGENCY')) return <PhoneCall className="w-3.5 h-3.5 text-rose-600" />;
    if (action.includes('REQUEST')) return <FileText className="w-3.5 h-3.5 text-amber-600" />;
    return <UserCheck className="w-3.5 h-3.5 text-[#2818cf]" />;
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Profile Activity Trail
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">
              Audit log of changes made to your employee profile & credentials
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="p-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-500">No profile change logs recorded yet.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start justify-between gap-3 group">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-500 shadow-sm flex items-center justify-center">
                {getIcon(act.action)}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-[#2818cf] transition-colors">
                  {act.description}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">
                  Action: {act.action}
                </span>
              </div>

              <span className="text-[10px] font-medium text-slate-400 font-mono shrink-0">
                {formatTimestamp(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
