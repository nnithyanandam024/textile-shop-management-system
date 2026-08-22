import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { FileEdit, ArrowRight } from 'lucide-react';

interface LeaveBalanceItem {
  code: string;
  name: string;
  allocated: number;
  used: number;
  available: number;
  percentage: number;
}

interface LeaveBalanceCardProps {
  balances: LeaveBalanceItem[];
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ balances }) => {
  const navigate = useNavigate();

  const displayBalances = balances.length > 0 ? balances.slice(0, 2) : [
    { code: 'CL', name: 'Casual Leave', allocated: 6, used: 2, available: 4, percentage: 67 },
    { code: 'AL', name: 'Annual Leave', allocated: 12, used: 4, available: 8, percentage: 67 },
  ];

  return (
    <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
              <FileEdit className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Leave Balance
            </h3>
          </div>
        </div>

        <div className="space-y-3.5 mt-2">
          {displayBalances.map((item) => (
            <div key={item.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{item.name}</span>
                <span className="font-extrabold text-[#2012ad]">
                  {item.available} <span className="text-[10px] font-semibold text-slate-500">/ {item.allocated} Days</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2012ad] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/staff/leave')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-indigo-50/80 text-slate-700 hover:text-[#2012ad] border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all group"
        >
          <span>View Leave</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
};
