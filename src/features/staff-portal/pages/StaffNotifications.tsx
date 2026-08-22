import React from 'react';
import { useStaffNotifications } from '../hooks/useStaffNotifications';
import {
  Bell,
  CheckCheck,
  Clock,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';

export const StaffNotifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    categoryFilter,
    readStateFilter,
    loading,
    error,
    setCategoryFilter,
    setReadStateFilter,
    onMarkRead,
    onMarkAllRead,
    clearError,
  } = useStaffNotifications();

  const getCategoryIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ATTENDANCE':
        return <Clock className="w-4 h-4 text-teal-600" />;
      case 'LEAVE':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'PAYROLL':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'INVENTORY':
        return <Package className="w-4 h-4 text-purple-600" />;
      case 'POS':
        return <ShoppingCart className="w-4 h-4 text-[#2012ad]" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBg = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ATTENDANCE':
        return 'bg-teal-50 border-teal-100';
      case 'LEAVE':
        return 'bg-amber-50 border-amber-100';
      case 'PAYROLL':
        return 'bg-emerald-50 border-emerald-100';
      case 'INVENTORY':
        return 'bg-purple-50 border-purple-100';
      case 'POS':
        return 'bg-indigo-50 border-indigo-100';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
            Shift alerts, leave status updates, inventory assignments, and system communications
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="px-4 py-2.5 bg-white border border-slate-200/80 hover:border-[#2012ad] text-slate-700 hover:text-[#2012ad] rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-[#2012ad]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-extrabold text-rose-700 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={clearError} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Category Pills & Read State Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-extrabold gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Feeds' },
            { id: 'ATTENDANCE', label: 'Attendance' },
            { id: 'LEAVE', label: 'Leave' },
            { id: 'PAYROLL', label: 'Payroll' },
            { id: 'INVENTORY', label: 'Inventory' },
            { id: 'POS', label: 'POS & Sales' },
            { id: 'SYSTEM', label: 'System' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-[#2012ad] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Read State Toggle */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setReadStateFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              readStateFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setReadStateFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              readStateFilter === 'UNREAD'
                ? 'bg-[#2012ad] text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-white rounded-3xl border border-slate-100" />
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">No Notifications</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                You're completely caught up with all shift, task, and store alerts.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-slate-200/70 shadow-xs opacity-90'
                  : 'bg-white border-indigo-200 shadow-md shadow-indigo-600/5 ring-1 ring-[#2012ad]/10'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${getCategoryBg(
                    n.type
                  )}`}
                >
                  {getCategoryIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 tracking-tight">{n.title}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-500">
                      {n.type}
                    </span>
                    {n.priority === 'HIGH' || n.priority === 'URGENT' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                        {n.priority}
                      </span>
                    ) : null}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#2012ad]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  title="Mark as read"
                  className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-[#2012ad] border border-slate-200/80 transition-all shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
export default StaffNotifications;
