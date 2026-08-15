import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import {
  Package,
  Boxes,
  AlertTriangle,
  Wallet,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ChevronDown
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

// Sample Trend Data for Recharts Overview
const inventoryTrendData = [
  { week: 'W1', stockIn: 450, stockOut: 320 },
  { week: 'W2', stockIn: 680, stockOut: 540 },
  { week: 'W3', stockIn: 720, stockOut: 610 },
  { week: 'W4', stockIn: 890, stockOut: 780 },
];

const lowStockItems = [
  { name: 'Premium Cotton Saree', sku: 'TX-PCS-001', qty: 10, isCritical: false },
  { name: 'Silk Thread (Gold, 500m)', sku: 'TH-GLD-500', qty: 4, isCritical: true },
  { name: 'Linen Blend Yardage (Navy)', sku: 'LN-NVY-YD', qty: 25, isCritical: false },
  { name: 'Dye Chemical Base X', sku: 'CH-BSX-10L', qty: 8, isCritical: true },
  { name: 'Weaving Loom Spares Set', sku: 'SR-LM-SET', qty: 2, isCritical: true },
];

export const DashboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('Last 30 Days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Good morning, Admin</h2>
          <p className="text-sm text-slate-500 mt-1">Here is your inventory overview for today.</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            LAST UPDATED: JUST NOW
          </span>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2818cf]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Products */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2818cf]">
              <Package className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-[#2818cf]">
              <TrendingUp className="w-3 h-3" />
              +8.2%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total Products</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">1,248</p>
          </div>
        </Card>

        {/* Card 2: Total Stock (Units) */}
        <Card>
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total Stock (Units)</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">18,450</p>
          </div>
        </Card>

        {/* Card 3: Low Stock Alerts (Tinted Alert Card) */}
        <div className="relative bg-gradient-to-br from-rose-100/90 to-rose-50/80 border border-rose-200/90 rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none text-rose-900">
            <AlertTriangle className="w-32 h-32" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-xs font-semibold text-rose-700">Low Stock Alerts</p>
            <p className="text-3xl font-extrabold text-rose-900 mt-1">36 Items</p>
          </div>
        </div>

        {/* Card 4: Inventory Value */}
        <Card>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Inventory Value</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">₹24.8L</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Overview Chart + Low Stock Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inventory Overview Graph (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Inventory Overview</h3>
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2818cf]/30 cursor-pointer"
                >
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                  <option>This Quarter</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inventoryTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStockIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2818cf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2818cf" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorStockOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                  <Area
                    type="monotone"
                    dataKey="stockIn"
                    name="Stock In"
                    stroke="#2818cf"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorStockIn)"
                  />
                  <Area
                    type="monotone"
                    dataKey="stockOut"
                    name="Stock Out"
                    stroke="#94a3b8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorStockOut)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Chart Legend */}
            <div className="flex items-center justify-end gap-6 pt-4 border-t border-slate-100 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2818cf]" />
                <span className="text-slate-700">Stock In</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-slate-500">Stock Out</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Low Stock Alerts Right Panel (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="h-full p-0 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">Low Stock Alerts</h3>
                </div>
                <button className="text-xs font-bold text-[#2818cf] hover:underline">View All</button>
              </div>

              {/* Table Subheader */}
              <div className="bg-indigo-50/60 px-5 py-2.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                <span>Item</span>
                <span>Qty Left</span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {lowStockItems.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">SKU: {item.sku}</p>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        item.isCritical
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
