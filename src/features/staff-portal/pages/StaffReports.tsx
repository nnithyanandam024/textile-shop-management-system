import React from 'react';
import { useStaffReports } from '../hooks/useStaffReports';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Award,
  Package,
  Calendar,
  RotateCcw,
  CreditCard,
  Layers,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const StaffReports: React.FC = () => {
  const {
    activeTab,
    period,
    salesReport,
    attendanceReport,
    commissionReport,
    inventoryReport,
    loading,
    error,
    setActiveTab,
    setPeriod,
  } = useStaffReports();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Header & Report Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Staff Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold">
            Confidential personal performance reports for sales, attendance, commission earnings, and inventory tasks
          </p>
        </div>

        {/* Period Selector (applicable for sales & commission) */}
        {(activeTab === 'SALES' || activeTab === 'COMMISSION') && (
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-extrabold shrink-0">
            {[
              { id: 'TODAY', label: 'Today' },
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
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-extrabold text-rose-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center bg-white p-1.5 rounded-3xl border border-slate-200/80 shadow-xs gap-1 overflow-x-auto">
        {[
          { id: 'SALES', label: 'Sales Performance', icon: DollarSign },
          { id: 'ATTENDANCE', label: 'Attendance & Hours', icon: Clock },
          { id: 'COMMISSION', label: 'Commission Tracker', icon: Award },
          { id: 'INVENTORY', label: 'Inventory Tasks', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#2818cf] text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 bg-white rounded-3xl border border-slate-100" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-100" />
        </div>
      )}

      {/* TAB 1: SALES PERFORMANCE */}
      {!loading && activeTab === 'SALES' && salesReport && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Total Sales Revenue
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹{salesReport.totalSalesVolume.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Orders Billed
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {salesReport.totalOrdersCount} Orders
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Average Order Value
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹{salesReport.averageOrderValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Units Sold
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {salesReport.totalItemsSold} Items
                </span>
              </div>
            </div>
          </div>

          {/* Payment Tender Breakdown & Top Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tender Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2818cf]" />
                <span>Payment Mode Breakdown</span>
              </h4>

              {salesReport.tenderBreakdown.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No tender recorded for this period.
                </div>
              ) : (
                <div className="space-y-3">
                  {salesReport.tenderBreakdown.map((t) => (
                    <div key={t.method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-700">{t.method}</span>
                        <span className="text-slate-900 font-mono">
                          ₹{t.amount.toLocaleString('en-IN')} ({t.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2818cf] rounded-full"
                          style={{ width: `${Math.min(100, t.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products Sold */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Top Selling Products</span>
              </h4>

              {salesReport.topProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No sales recorded for this period.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {salesReport.topProducts.map((p) => (
                    <div key={p.sku} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{p.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 font-mono block">
                          ₹{p.revenue.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{p.quantity} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Completed Invoices */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900">Period Invoice Ledger</h4>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {salesReport.recentSales.length} Invoices
              </span>
            </div>

            {salesReport.recentSales.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No invoices found for this period.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Invoice No</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Tender</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {salesReport.recentSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-bold font-mono text-[#2818cf]">{s.invoiceNumber}</td>
                        <td className="px-6 py-3.5 text-slate-900">{s.customerName}</td>
                        <td className="px-6 py-3.5">{s.itemsCount} items</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600">
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                          {new Date(s.saleDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-3.5 text-right font-black font-mono text-slate-900">
                          ₹{s.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & HOURS */}
      {!loading && activeTab === 'ATTENDANCE' && attendanceReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Present Days
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {attendanceReport.presentDays} Days
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Total Hours Worked
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {attendanceReport.totalWorkedHours} Hrs
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Daily Average
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {attendanceReport.averageDailyHours} Hrs/Day
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Late Check-ins
                </span>
                <span className="text-xl font-black text-amber-600 font-mono">
                  {attendanceReport.lateArrivals} Times
                </span>
              </div>
            </div>
          </div>

          {/* Daily Attendance Logs */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900">Attendance Log History</h4>
              <span className="text-[11px] font-bold text-slate-400 font-mono">{attendanceReport.dailyLogs.length} Entries</span>
            </div>

            {attendanceReport.dailyLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No attendance logs found for this period.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Check In</th>
                      <th className="px-6 py-3">Check Out</th>
                      <th className="px-6 py-3">Hours</th>
                      <th className="px-6 py-3 text-right">Punctuality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {attendanceReport.dailyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-bold font-mono text-slate-900">{log.date}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              log.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.status === 'LEAVE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">{log.checkInTime || '—'}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">{log.checkOutTime || '—'}</td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{log.totalHours || 0} hrs</td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              log.isLate ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {log.isLate ? 'Late Arrival' : 'On Time'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSION TRACKER */}
      {!loading && activeTab === 'COMMISSION' && commissionReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Eligible Sales Volume
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono block">
                ₹{commissionReport.commissionableVolume.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">100% Eligible for Commission</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Active Commission Rate
              </span>
              <span className="text-2xl font-black text-[#2818cf] font-mono block">
                {commissionReport.commissionRate}%
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Configured Store Commission</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Earned Commission
              </span>
              <span className="text-2xl font-black text-amber-600 font-mono block">
                ₹{commissionReport.commissionEarned.toLocaleString('en-IN')}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                Status: {commissionReport.payoutStatus}
              </span>
            </div>
          </div>

          {/* Invoices Contributing to Commission */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900">Commissionable Invoices</h4>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {commissionReport.recentCommissionSales.length} Records
              </span>
            </div>

            {commissionReport.recentCommissionSales.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No commissionable sales recorded for this period.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {commissionReport.recentCommissionSales.map((s) => (
                  <div key={s.invoiceNumber} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 font-mono block">{s.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{s.customerName} • {new Date(s.saleDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-amber-600 font-mono block">+₹{s.commissionAmount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Sale: ₹{s.saleTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY TASKS */}
      {!loading && activeTab === 'INVENTORY' && inventoryReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Stock Counts Assigned
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono block">
                {inventoryReport.stockCountsAssigned} Sessions
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Physical stock audit tasks</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Stock Counts Completed
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono block">
                {inventoryReport.stockCountsCompleted} Finished
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Reconciled counts</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Stock Movements Handled
              </span>
              <span className="text-2xl font-black text-[#2818cf] font-mono block">
                {inventoryReport.stockMovementsHandled} Items
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Sales, Returns & Adjustments</span>
            </div>
          </div>

          {/* Recent Stock Activity */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900">Recent Inventory Movement Activity</h4>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {inventoryReport.recentTransactions.length} Transactions
              </span>
            </div>

            {inventoryReport.recentTransactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No inventory transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inventoryReport.recentTransactions.map((tx) => (
                  <div key={tx.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">{tx.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{tx.sku} • {tx.notes || 'Movement'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black font-mono block ${
                          tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.quantity > 0 ? `+${tx.quantity}` : `${tx.quantity}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{tx.transactionType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffReports;
