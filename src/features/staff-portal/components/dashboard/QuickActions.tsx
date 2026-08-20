import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { FileEdit, Clock, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      name: 'Apply Leave',
      description: 'Submit leave request',
      path: '/self-service/leave',
      icon: FileEdit,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      name: 'Attendance',
      description: 'View logs & corrections',
      path: '/self-service/attendance',
      icon: Clock,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      name: 'My Shift',
      description: 'View schedule & roster',
      path: '/self-service/shifts',
      icon: Calendar,
      iconBg: 'bg-indigo-50 text-[#2818cf] border-indigo-100',
    },
    {
      name: 'My Payslip',
      description: 'Confidential salary slips',
      path: '/self-service/payroll',
      icon: DollarSign,
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map((act) => (
          <Card
            key={act.name}
            onClick={() => navigate(act.path)}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl hover:border-[#2818cf] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform ${act.iconBg}`}
              >
                <act.icon className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#2818cf] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            <div className="mt-3">
              <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#2818cf] transition-colors">
                {act.name}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                {act.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
