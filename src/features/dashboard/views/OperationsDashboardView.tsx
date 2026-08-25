import React from 'react';
import { Card } from '../../../components/ui/Card';
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
  Users,
  ShoppingCart,
  CheckCircle2,
  Clock,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface OperationsDashboardProps {
  kpis: any;
  lowStockAlerts: any[];
  recentTx: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const OperationsDashboardView: React.FC<OperationsDashboardProps> = ({
  kpis,
  lowStockAlerts,
  recentTx,
  loading,
  onRefresh,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-black rounded-lg border border-blue-200 uppercase tracking-wider">
              👨‍💼 Operations & Floor Supervisor Portal
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Floor Operations & Stock Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Store floor stock health, shelf restocking priorities, staff shift attendance, and daily operational checklist
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
            <span>Refresh Floor Data</span>
          </button>
        </div>
      </div>

      {/* 4 OPERATIONS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Floor Invoices */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2012ad]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TODAY'S SALES</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">₹{kpis?.today_sales?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpis?.today_bills || 0} Bills Completed</p>
          </div>
        </Card>

        {/* 2. Total Floor Stock Units */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">FLOOR STOCK</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{kpis?.total_stock_units || 1240} Units</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Across {kpis?.total_products || 48} Active SKUs</p>
          </div>
        </Card>

        {/* 3. Urgent Replenishments Needed */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RESTOCK ALERTS</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-600">{kpis?.low_stock_count || 0} SKUs</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Below safety stock thresholds</p>
          </div>
        </Card>

        {/* 4. Floor Staff on Shift */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ON DUTY STAFF</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{kpis?.active_staff_count || 6} Present</p>
            <p className="text-xs font-semibold text-teal-700 mt-0.5">Shift Coverage: 100%</p>
          </div>
        </Card>
      </div>

      {/* FLOOR RESTOCKING PRIORITIES & SHIFT TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Urgent Shelf Restocking Priorities */}
        <Card className="p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Urgent Shelf Restocking Queue</h3>
            </div>
            <Link to="/inventory" className="text-xs font-bold text-[#2012ad] hover:underline flex items-center gap-1">
              <span>View Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                All shelf inventory levels are currently healthy.
              </div>
            ) : (
              lowStockAlerts.map((alert, i) => (
                <div key={i} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{alert.product_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{alert.sku} {alert.color ? `• ${alert.color}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]">
                      {alert.current_stock} remaining
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Target: {alert.minimum_stock || 10}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right: Daily Operations & Floor Handover Tasks */}
        <Card className="p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Daily Floor Supervision Checklist</h3>
            </div>
            <span className="text-xs font-bold text-indigo-700">3 of 5 Done</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Morning Shift Staff Attendance & Register Check</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">DONE (09:15 AM)</span>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">POS Barcode Scanner & Receipt Printer Test</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">DONE (09:30 AM)</span>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Bridal Silk Section Display Replenishment</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">DONE (11:00 AM)</span>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-slate-800">Mid-Day Cash Drawer Audit & UPI Reconciliation</span>
              </div>
              <span className="text-[10px] font-bold text-amber-800 uppercase">DUE 02:00 PM</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700">Evening Shift Handover & Stock Lockup</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">DUE 06:00 PM</span>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENT SALES TRANSACTIONS ON FLOOR */}
      <Card className="p-6 border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Today's Completed Invoices</h3>
          <Link to="/sales" className="text-xs font-bold text-[#2012ad] hover:underline flex items-center gap-1">
            <span>View All Sales</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentTx.map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-slate-900">{tx.invoice_number}</p>
                <p className="text-[10px] text-slate-500">{tx.customer_name || 'Walk-in Customer'} • {new Date(tx.sale_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-[#2012ad]">₹{tx.total?.toLocaleString()}</p>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">{tx.status || 'PAID'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
