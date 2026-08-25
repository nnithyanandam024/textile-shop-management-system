import React from 'react';
import { Card } from '../../../components/ui/Card';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Users,
  DollarSign,
  ShoppingCart,
  Sparkles,
  PackageCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ManagementDashboardProps {
  kpis: any;
  salesTrend: any[];
  bestSellers: any[];
  lowStockAlerts: any[];
  recentTx: any[];
  loading: boolean;
  onRefresh: () => void;
  onOpenAnalytics: () => void;
}

export const ManagementDashboardView: React.FC<ManagementDashboardProps> = ({
  kpis,
  salesTrend,
  bestSellers,
  lowStockAlerts,
  recentTx,
  loading,
  onRefresh,
  onOpenAnalytics,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-black rounded-lg border border-purple-200 uppercase tracking-wider">
              👨‍💼 Store Management Portal
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Store Management Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational sales tracking, stock replenishment forecasting, reorder planning, and staff attendance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
            <span>Refresh Live Data</span>
          </button>
        </div>
      </div>

      {/* 6 STORE MANAGEMENT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Today's Store Sales */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2012ad]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TODAY'S STORE SALES</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">₹{kpis?.today_sales?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpis?.today_bills || 0} Invoices Billed</p>
          </div>
        </Card>

        {/* 2. Monthly Revenue */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MONTHLY REVENUE</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">₹{kpis?.total_revenue?.toLocaleString() || 0}</p>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Target Achieved: 92%</span>
            </div>
          </div>
        </Card>

        {/* 3. Available Inventory */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STORE INVENTORY</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{kpis?.total_stock_units || 1240} units</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Across {kpis?.total_products || 48} Product SKUs</p>
          </div>
        </Card>

        {/* 4. Stock Replenishment Alerts */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">REORDER PRIORITIES</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-600">{kpis?.low_stock_count || 0} SKUs</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpis?.out_of_stock_count || 0} out of stock</p>
          </div>
        </Card>

        {/* 5. Active Shift Staff */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STORE STAFF</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{kpis?.active_staff_count || 6} / {kpis?.total_staff_count || 6}</p>
            <p className="text-xs font-semibold text-teal-700 mt-0.5">All staff clocked in on time</p>
          </div>
        </Card>

        {/* 6. Customer Base */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <PackageCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CUSTOMER VISITS</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{kpis?.total_customers || 142}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Active retail & loyal members</p>
          </div>
        </Card>
      </div>

      {/* SALES TRAJECTORY & BEST SELLERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Sales Curve</h3>
              <p className="text-xs text-slate-500">Store sales volume over the past 7 days</p>
            </div>
            <button
              onClick={onOpenAnalytics}
              className="text-xs font-bold text-[#2012ad] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Analytics</span>
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="mgrSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2012ad" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2012ad" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#2012ad" strokeWidth={3} fillOpacity={1} fill="url(#mgrSalesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Fast Moving Items */}
        <Card className="p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Top Selling Products</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">7-DAY VOLUME</span>
          </div>

          <div className="space-y-3">
            {bestSellers.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-[#2012ad]">{item.units_sold} sold</p>
                  <p className="text-[10px] font-semibold text-slate-600">₹{item.total_revenue?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* REPLENISHMENT PRIORITIES & RECENT INVOICES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Replenishment List */}
        <Card className="p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Low Stock Replenishment Queue</h3>
            </div>
            <span className="text-xs font-bold text-amber-700">{lowStockAlerts.length} Action Items</span>
          </div>
          <div className="space-y-2">
            {lowStockAlerts.slice(0, 5).map((alert, i) => (
              <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-slate-900 truncate">{alert.product_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{alert.sku}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-black text-[10px]">
                    {alert.current_stock} left
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Min: {alert.minimum_stock || 5}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card className="p-6 border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Sales Invoices</h3>
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
    </div>
  );
};
