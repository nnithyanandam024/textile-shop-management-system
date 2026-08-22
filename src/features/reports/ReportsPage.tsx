import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'INVENTORY' | 'FINANCIAL' | 'CUSTOMERS' | 'SUPPLIERS'>('SALES');
  const [period, setPeriod] = useState<string>('THIS_MONTH');

  const [salesReport, setSalesReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [customerReport, setCustomerReport] = useState<any[]>([]);
  const [supplierReport, setSupplierReport] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, period]);

  const getDateRange = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'TODAY') {
      return { startDate: `${todayStr} 00:00:00`, endDate: `${todayStr} 23:59:59` };
    }
    if (period === 'THIS_WEEK') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { startDate: `${d.toISOString().split('T')[0]} 00:00:00`, endDate: `${todayStr} 23:59:59` };
    }
    if (period === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: `${firstDay} 00:00:00`, endDate: `${todayStr} 23:59:59` };
    }
    return {};
  };

  const fetchReportData = async () => {
    setLoading(true);
    const range = getDateRange();

    try {
      if (window.api && window.api.reports) {
        if (activeTab === 'SALES') {
          const res = await window.api.reports.getSales(range);
          setSalesReport(res);
        } else if (activeTab === 'INVENTORY') {
          const res = await window.api.reports.getInventory();
          setInventoryReport(res);
        } else if (activeTab === 'FINANCIAL') {
          const res = await window.api.reports.getFinancial(range);
          setFinancialReport(res);
        } else if (activeTab === 'CUSTOMERS') {
          const res = await window.api.reports.getCustomers();
          setCustomerReport(res);
        } else if (activeTab === 'SUPPLIERS') {
          const res = await window.api.reports.getSuppliers();
          setSupplierReport(res);
        }
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!window.api || !window.api.reports) return;

    let dataToExport: any[] = [];
    let headers: { key: string; label: string }[] = [];
    let filename = `Report_${activeTab}_${Date.now()}.csv`;

    if (activeTab === 'SALES' && salesReport?.invoices) {
      dataToExport = salesReport.invoices;
      headers = [
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'sale_date', label: 'Date' },
        { key: 'total', label: 'Total (₹)' },
        { key: 'payment_status', label: 'Payment Status' },
      ];
    } else if (activeTab === 'INVENTORY' && inventoryReport?.currentStock) {
      dataToExport = inventoryReport.currentStock;
      headers = [
        { key: 'sku', label: 'SKU' },
        { key: 'product_name', label: 'Product Name' },
        { key: 'category_name', label: 'Category' },
        { key: 'current_stock', label: 'Current Stock' },
        { key: 'stock_valuation', label: 'Valuation (₹)' },
      ];
    } else if (activeTab === 'CUSTOMERS') {
      dataToExport = customerReport;
      headers = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Customer Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'total_purchases', label: 'Total Purchases (₹)' },
        { key: 'outstanding_balance', label: 'Outstanding (₹)' },
      ];
    } else if (activeTab === 'SUPPLIERS') {
      dataToExport = supplierReport;
      headers = [
        { key: 'code', label: 'Code' },
        { key: 'company_name', label: 'Company Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'total_purchased', label: 'Purchases Total (₹)' },
        { key: 'payable_balance', label: 'Payable Balance (₹)' },
      ];
    }

    if (dataToExport.length > 0) {
      const csvStr = await window.api.reports.exportCSV(dataToExport, headers);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabLabel = { SALES: 'Sales Report', INVENTORY: 'Inventory Valuation', FINANCIAL: 'Financial P&L Statement', CUSTOMERS: 'Customer Ledger Report', SUPPLIERS: 'Supplier Payables Report' }[activeTab];
  const periodLabel = { TODAY: 'Today', THIS_WEEK: 'Past 7 Days', THIS_MONTH: 'This Month', ALL_TIME: 'All Time' }[period] ?? period;

  return (
    <div className="space-y-6">
      {/* Print-only report header — hidden in browser, visible on print */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">TEXORA TEXTILE MANAGER</h1>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">Business Report — {tabLabel}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold text-slate-700">Period: {periodLabel}</p>
            <p>Printed on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="mt-1 text-[10px] text-slate-400">Generated by Texora Textile Manager v0.1</p>
          </div>
        </div>
      </div>

      {/* Header — hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reports & Business Analytics</h1>
            <p className="text-xs font-medium text-slate-500">Sales performance, inventory valuation, financial profit & loss statements, customer credit, and supplier payables</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs & Date Range Bar — hidden on print */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('SALES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SALES' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Reports
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'INVENTORY' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Valuation
          </button>
          <button
            onClick={() => setActiveTab('FINANCIAL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'FINANCIAL' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Financial P&L
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CUSTOMERS' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Balances
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SUPPLIERS' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supplier Payables
          </button>
        </div>

        {/* Date Filter */}
        {(activeTab === 'SALES' || activeTab === 'FINANCIAL') && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">Past 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="ALL_TIME">All Time</option>
          </select>
        )}
      </div>

      {/* Main Report Body */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold">Generating report calculation...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* TAB 1: SALES REPORT */}
          {activeTab === 'SALES' && salesReport && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900">Sales Summary & Invoices</h3>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesReport.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="p-3 font-bold text-slate-800">{inv.customer_name || 'Walk-in'}</td>
                        <td className="p-3 text-slate-600">{inv.employee_name || 'Admin'}</td>
                        <td className="p-3 text-slate-500">{new Date(inv.sale_date).toLocaleDateString()}</td>
                        <td className="p-3 font-extrabold text-[#2012ad]">₹{inv.total}</td>
                        <td className="p-3 font-semibold text-emerald-700">{inv.balance_amount > 0 ? 'PARTIAL' : 'PAID'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY VALUATION */}
          {activeTab === 'INVENTORY' && inventoryReport && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Inventory Valuation (Purchase Price)</p>
                  <p className="text-2xl font-extrabold text-[#2012ad]">₹{inventoryReport.totalValuation.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">{inventoryReport.currentStock.length} Active Product SKUs</p>
                  <p className="text-xs font-extrabold text-rose-600">{inventoryReport.lowStock.length} Low Stock | {inventoryReport.deadStock.length} Dead Stock</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3">Unit Cost</th>
                      <th className="p-3 text-right">Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryReport.currentStock.map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{it.sku}</td>
                        <td className="p-3 font-bold text-slate-800">{it.product_name}</td>
                        <td className="p-3 text-slate-600">{it.category_name || 'General'}</td>
                        <td className="p-3 font-extrabold text-slate-900">{it.current_stock}</td>
                        <td className="p-3 font-medium text-slate-600">₹{it.purchase_price}</td>
                        <td className="p-3 text-right font-extrabold text-[#2012ad]">₹{it.stock_valuation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL P&L */}
          {activeTab === 'FINANCIAL' && financialReport && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900">Profit & Loss Financial Statement</h3>
              
              <div className="max-w-2xl border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-sm">
                <div className="p-4 bg-slate-50 flex justify-between font-bold text-slate-900">
                  <span>Gross Sales</span>
                  <span>₹{financialReport.grossSales.toLocaleString()}</span>
                </div>
                <div className="p-4 flex justify-between text-rose-600 font-semibold">
                  <span>(-) Sales Returns & Refunds</span>
                  <span>₹{financialReport.totalReturns.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-indigo-50/50 flex justify-between font-extrabold text-slate-900">
                  <span>Net Sales Revenue</span>
                  <span className="text-[#2012ad]">₹{financialReport.netRevenue.toLocaleString()}</span>
                </div>
                <div className="p-4 flex justify-between text-slate-600 font-medium">
                  <span>(-) Cost of Goods Sold (COGS)</span>
                  <span>₹{financialReport.totalCogs.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-emerald-50/50 flex justify-between font-extrabold text-emerald-900">
                  <span>Gross Profit Margin</span>
                  <span>₹{financialReport.grossProfit.toLocaleString()}</span>
                </div>
                <div className="p-4 flex justify-between text-amber-700 font-semibold">
                  <span>(-) Operating Shop Expenses</span>
                  <span>₹{financialReport.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-slate-900 text-white flex justify-between font-extrabold text-base rounded-b-xl">
                  <span>Net Operating Business Result</span>
                  <span className="text-emerald-400">₹{financialReport.netOperatingResult.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER BALANCES */}
          {activeTab === 'CUSTOMERS' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Customer Directory & Credit Ledgers</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Total Purchases</th>
                      <th className="p-3 text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerReport.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="p-3 font-bold text-slate-800">{c.name}</td>
                        <td className="p-3 text-slate-600">{c.phone || '-'}</td>
                        <td className="p-3 font-bold text-slate-900">₹{c.total_purchases}</td>
                        <td className="p-3 text-right font-extrabold text-purple-700">₹{c.outstanding_balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SUPPLIER PAYABLES */}
          {activeTab === 'SUPPLIERS' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Supplier Purchases & Payable Accounts</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Company Name</th>
                      <th className="p-3">Contact Person</th>
                      <th className="p-3">Total Purchased</th>
                      <th className="p-3 text-right">Payable Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierReport.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{s.code}</td>
                        <td className="p-3 font-bold text-slate-800">{s.company_name}</td>
                        <td className="p-3 text-slate-600">{s.contact_person || '-'}</td>
                        <td className="p-3 font-bold text-slate-900">₹{s.total_purchased}</td>
                        <td className="p-3 text-right font-extrabold text-sky-700">₹{s.payable_balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
