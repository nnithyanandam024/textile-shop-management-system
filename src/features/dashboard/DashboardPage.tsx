import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import {
  Boxes,
  AlertTriangle,
  Wallet,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Users,
  Building2,
  DollarSign,
  ShoppingCart
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

export const DashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.dashboard) {
        const [kpiData, trendData, bestData, lowData, recentData] = await Promise.all([
          window.api.dashboard.getKPIs(),
          window.api.dashboard.getSalesTrend(7),
          window.api.dashboard.getBestSellers(5),
          window.api.dashboard.getLowStockAlerts(5),
          window.api.dashboard.getRecentTransactions(5),
        ]);

        setKpis(kpiData);
        setSalesTrend(trendData);
        setBestSellers(bestData);
        setLowStockAlerts(lowData);
        setRecentTx(recentData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Business Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of sales performance, revenue, gross profit, stock alerts, and cash flow</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2818cf]' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2818cf]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">TODAY'S SALES</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">₹{kpis?.today_sales?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpis?.today_bills || 0} Bills Generated</p>
          </div>
        </Card>

        {/* Net Revenue */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">NET REVENUE</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">₹{kpis?.total_revenue?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">Gross Sales - Returns</p>
          </div>
        </Card>

        {/* Gross Profit */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">GROSS PROFIT</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">₹{kpis?.gross_profit?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">COGS: ₹{kpis?.total_cogs?.toLocaleString() || 0}</p>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">SHOP EXPENSES</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">₹{kpis?.total_expenses?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-amber-600 mt-0.5">Operating Result: ₹{kpis?.net_operating_result?.toLocaleString() || 0}</p>
          </div>
        </Card>

        {/* Total Stock Units */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Boxes className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">TOTAL STOCK UNITS</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-slate-900">{kpis?.products_in_stock?.toLocaleString() || 0}</p>
          </div>
        </Card>

        {/* Low Stock & Out of Stock Alerts */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-rose-700 uppercase">STOCK ALERTS</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-rose-900">{kpis?.low_stock_count || 0} Low</span>
            <span className="text-xs font-bold text-rose-600">({kpis?.out_of_stock_count || 0} Out)</span>
          </div>
        </div>

        {/* Customer Outstanding */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">CUSTOMER DUE</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-purple-900">₹{kpis?.customer_outstanding?.toLocaleString() || 0}</p>
          </div>
        </Card>

        {/* Supplier Payable */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">SUPPLIER PAYABLE</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-sky-900">₹{kpis?.supplier_payable?.toLocaleString() || 0}</p>
          </div>
        </Card>
      </div>

      {/* Sales Trend Chart & Low Stock Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sales Trend (Last 7 Days)</h3>
                <p className="text-xs text-slate-500">Daily sales revenue graph</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend.length > 0 ? salesTrend : [{ date: 'Today', sales: kpis?.today_sales || 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2818cf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2818cf" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Area type="monotone" dataKey="sales" name="Sales Revenue (₹)" stroke="#2818cf" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Low Stock Panel */}
        <div className="lg:col-span-4">
          <Card className="h-full p-0 overflow-hidden flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Low Stock Alerts</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
              {lowStockAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">All inventory levels healthy</div>
              ) : (
                lowStockAlerts.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.product_name || item.sku}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                      {item.current_stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Best Sellers & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Best Selling Products */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Top Selling Products</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {bestSellers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No sales data recorded yet</div>
            ) : (
              bestSellers.map((b, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-[#2818cf] font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{b.name || b.sku}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {b.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-[#2818cf]">₹{b.total_revenue}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{b.total_qty} units sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Recent System Transactions</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTx.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No transactions recorded yet</div>
            ) : (
              recentTx.map((tx, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        tx.type === 'SALE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {tx.type}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">{tx.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900">₹{tx.amount}</span>
                    <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
