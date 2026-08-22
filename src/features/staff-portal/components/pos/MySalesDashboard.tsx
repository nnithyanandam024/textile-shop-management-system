import React, { useState, useEffect } from 'react';
import { StaffMySalesSummary, staffPOSService } from '../../services/staffPOSService';
import { DollarSign, ShoppingBag, Layers, Percent, Eye } from 'lucide-react';

interface MySalesDashboardProps {
  onOpenReceipt?: (saleId: number) => void;
}

export const MySalesDashboard: React.FC<MySalesDashboardProps> = ({ onOpenReceipt }) => {
  const [period, setPeriod] = useState<'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('TODAY');
  const [summary, setSummary] = useState<StaffMySalesSummary | null>(null);

  const loadData = async (selectedPeriod: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL') => {
    try {
      const data = await staffPOSService.getMySales({ period: selectedPeriod });
      setSummary(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Personal Sales & Commission Tracker</h3>
          <p className="text-xs text-slate-400 font-semibold">
            Real-time track of your POS billing volume, completed orders, and earned commission
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-extrabold">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                period === p.id
                  ? 'bg-[#2818cf] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Volume */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Sales Volume
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{(summary?.totalSalesVolume || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Orders Count */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Completed Orders
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {summary?.totalOrdersCount || 0} Orders
            </span>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Units Sold
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {summary?.totalItemsSoldCount || 0} Units
            </span>
          </div>
        </div>

        {/* Commission */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Commission ({summary?.commissionRate || 1.5}%)
            </span>
            <span className="text-xl font-black text-amber-600 font-mono">
              ₹{(summary?.commissionEarned || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Sales History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900">Recent Completed Invoices</h4>
          <span className="text-[11px] font-semibold text-slate-400 font-mono">
            {summary?.recentSales.length || 0} Records
          </span>
        </div>

        {summary?.recentSales.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-semibold">
            No sales completed in this period.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Invoice No</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Tender Mode</th>
                  <th className="px-6 py-3">Date & Time</th>
                  {onOpenReceipt && <th className="px-6 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {summary?.recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-[#2818cf]">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-6 py-3.5 text-slate-900">{s.customerName}</td>
                    <td className="px-6 py-3.5">{s.itemsCount} items</td>
                    <td className="px-6 py-3.5 font-black text-slate-900 font-mono">
                      ₹{s.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(s.saleDate).toLocaleDateString('en-IN')} {new Date(s.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {onOpenReceipt && (
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(s.id)}
                          className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-[#2818cf] rounded-xl transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                          title="View & Print Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
