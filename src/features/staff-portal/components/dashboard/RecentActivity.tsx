import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Activity, Clock, Calendar, FileEdit, FileCheck, User, Sparkles } from 'lucide-react';

interface ActivityItem {
  id: number;
  iconType: 'ATTENDANCE' | 'SHIFT' | 'LEAVE' | 'DOCUMENT' | 'PROFILE' | 'DEFAULT';
  title: string;
  timestampFormatted: string;
  description?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: ActivityItem['iconType']) => {
    switch (type) {
      case 'ATTENDANCE':
        return <Clock className="w-3.5 h-3.5 text-emerald-600" />;
      case 'SHIFT':
        return <Calendar className="w-3.5 h-3.5 text-[#2012ad]" />;
      case 'LEAVE':
        return <FileEdit className="w-3.5 h-3.5 text-amber-600" />;
      case 'DOCUMENT':
        return <FileCheck className="w-3.5 h-3.5 text-cyan-600" />;
      case 'PROFILE':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getIconBg = (type: ActivityItem['iconType']) => {
    switch (type) {
      case 'ATTENDANCE':
        return 'bg-emerald-50 border-emerald-100';
      case 'SHIFT':
        return 'bg-indigo-50 border-indigo-100';
      case 'LEAVE':
        return 'bg-amber-50 border-amber-100';
      case 'DOCUMENT':
        return 'bg-cyan-50 border-cyan-100';
      case 'PROFILE':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Recent Activity
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${getIconBg(
                    act.iconType
                  )}`}
                >
                  {getIcon(act.iconType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{act.title}</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {act.timestampFormatted}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs font-semibold text-slate-400">
              <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="font-bold text-slate-700">You're all caught up.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No recent activity to display.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-wider">
          Live System Activity Feed
        </p>
      </div>
    </Card>
  );
};
