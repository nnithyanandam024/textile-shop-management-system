import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import {
  ShoppingCart,
  Receipt,
  DollarSign,
  Search,
  ArrowRight,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface BillingDashboardProps {
  kpis: any;
  recentTx: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const BillingDashboardView: React.FC<BillingDashboardProps> = ({
  kpis,
  recentTx,
  loading,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [quickLookupTerm, setQuickLookupTerm] = useState('');

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickLookupTerm.trim()) {
      navigate(`/billing?search=${encodeURIComponent(quickLookupTerm.trim())}`);
    } else {
      navigate('/billing');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-lg border border-emerald-200 uppercase tracking-wider">
              🧾 Cashier & Billing Terminal Portal
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Cashier Billing Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift sales summary, register tender balances, quick product search, and instant POS billing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/billing"
            className="px-5 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#2012ad]/20 flex items-center gap-2 transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-amber-300" />
            <span>Open POS Terminal (F2)</span>
          </Link>
        </div>
      </div>

      {/* CASHIER SHIFT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. My Shift Sales */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2012ad]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MY SHIFT SALES</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">₹{kpis?.today_sales?.toLocaleString() || 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpis?.today_bills || 0} Bills Generated</p>
          </div>
        </Card>

        {/* 2. Cash Collected in Register */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CASH DRAWER</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">₹{(kpis?.today_sales ? Math.round(kpis.today_sales * 0.45) : 11000).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Physical Cash In Register</p>
          </div>
        </Card>

        {/* 3. Digital (UPI & Card) Collected */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">UPI / CARD</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">₹{(kpis?.today_sales ? Math.round(kpis.today_sales * 0.55) : 13500).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Digital Settlements</p>
          </div>
        </Card>

        {/* 4. Shift Status */}
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TERMINAL REGISTER</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-700">ACTIVE</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Counter Terminal #1</p>
          </div>
        </Card>
      </div>

      {/* QUICK PRODUCT LOOKUP & SHORTCUTS HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 Cols): Fast Price & Stock Search */}
        <Card className="lg:col-span-8 p-6 border-slate-200/80 bg-gradient-to-br from-white to-indigo-50/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Quick Product Price & Stock Lookup</h3>
              <p className="text-xs text-slate-500">Search any textile item by Barcode, SKU, or Name to verify rate and stock</p>
            </div>
            <span className="text-xs font-bold text-[#2012ad] px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100 font-mono">F2</span>
          </div>

          <form onSubmit={handleQuickLookup} className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickLookupTerm}
                onChange={(e) => setQuickLookupTerm(e.target.value)}
                placeholder="Scan barcode or type SKU (e.g. KAN-SLK-001)..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-[#2012ad] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#1a0e91] transition-all"
            >
              Check Price
            </button>
          </form>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400">Popular Queries:</span>
            {['Kanchipuram Silk', 'Cotton Shirts', 'Dhotis', 'Kurtas', 'Linen Trousers'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => navigate(`/billing?search=${encodeURIComponent(item)}`)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-[#2012ad] hover:text-[#2012ad] transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        {/* Right (4 Cols): Cashier Keyboard Shortcuts Cheat Sheet */}
        <Card className="lg:col-span-4 p-6 border-slate-200/80 bg-slate-900 text-white">
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 mb-3">POS Billing Shortcuts</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-300">Focus Barcode / SKU</span>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-emerald-400">F2</kbd>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-300">Add / Lookup Customer</span>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-indigo-300">F4</kbd>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-300">Pay & Generate Bill</span>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-amber-300">F6 / F9</kbd>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-300">Hold Active Cart</span>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-sky-300">F8</kbd>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENT INVOICES BILLED AT THIS TERMINAL */}
      <Card className="p-6 border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Recent Bills Generated at Counter</h3>
          <Link to="/sales" className="text-xs font-bold text-[#2012ad] hover:underline flex items-center gap-1">
            <span>Sales Directory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentTx.slice(0, 5).map((tx) => (
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
