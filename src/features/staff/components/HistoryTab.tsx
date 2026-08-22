import React from 'react';
import { Card } from '../../../components/ui/Card';
import { History, Calendar, UserCheck } from 'lucide-react';

interface HistoryTabProps {
  history: any[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
          <History className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Employment History Timeline</h3>
          <p className="text-xs text-slate-500">Historical log of promotions, transfers & manager changes</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          No historical employment changes recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {history.map((h, idx) => (
            <div key={h.id || idx} className="relative flex items-start gap-4 group">
              <div className="w-5 h-5 rounded-full bg-white border-2 border-[#2012ad] flex items-center justify-center shrink-0 -ml-8 group-hover:scale-110 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2012ad]" />
              </div>

              <div className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{h.designation_name}</h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-[#2012ad]">
                      {h.department_name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {h.effective_from} {h.effective_to ? `to ${h.effective_to}` : '(Current Role)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <p><span className="text-slate-400 text-[10px]">Employment Type:</span> {h.employment_type?.replace('_', ' ')}</p>
                  <p><span className="text-slate-400 text-[10px]">Manager:</span> {h.manager_name || 'None'}</p>
                  <p className="sm:col-span-2 text-slate-500 italic">"{h.reason || 'Role change'}"</p>
                </div>

                {h.author_name && (
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    Recorded by: {h.author_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
