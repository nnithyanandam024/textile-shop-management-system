import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Users, TrendingUp, Package, Clock, BarChart3, ArrowUpRight } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      name: 'POS & Billing',
      description: 'Quick scan & terminal checkout',
      path: '/staff/pos',
      icon: ShoppingCart,
      iconBg: 'bg-indigo-50 text-[#2818cf] border-indigo-100',
    },
    {
      name: 'Customers',
      description: 'Directory, 360° profile & loyalty',
      path: '/staff/customers',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      name: 'My Sales',
      description: 'Track volume & commission',
      path: '/staff/sales',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      name: 'My Inventory',
      description: 'Stock count & physical audit',
      path: '/staff/inventory',
      icon: Package,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      name: 'Attendance',
      description: 'Clock in/out & monthly hours',
      path: '/staff/attendance',
      icon: Clock,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    },
    {
      name: 'Staff Reports',
      description: 'Sales, hours & commissions',
      path: '/staff/reports',
      icon: BarChart3,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Operations & Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {actions.map((act) => (
          <div
            key={act.name}
            onClick={() => navigate(act.path)}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-[#2818cf] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs group-hover:scale-105 transition-transform ${act.iconBg}`}
              >
                <act.icon className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2818cf] transition-colors" />
            </div>

            <div>
              <span className="text-xs font-extrabold text-slate-900 block group-hover:text-[#2818cf] transition-colors">
                {act.name}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
