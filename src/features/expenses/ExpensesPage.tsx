import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, RefreshCw, XCircle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Expense {
  id: number;
  expense_number: string;
  category_name?: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  description?: string;
  expense_date: string;
  status: string;
}

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // Add Expense form inputs
  const [amount, setAmount] = useState<number>(0);
  const [categoryName, setCategoryName] = useState<string>('Rent');
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.expenses) {
        const list = await window.api.expenses.getAll();
        setExpenses(list);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Expense amount must be greater than 0.');
      return;
    }

    setError('');
    setActionLoading(true);

    try {
      if (window.api && window.api.expenses) {
        const res = await window.api.expenses.create({
          amount,
          category_name: categoryName,
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim() || undefined,
          description: description.trim() || undefined,
        });

        if (res.success) {
          setAmount(0);
          setDescription('');
          setReferenceNumber('');
          setShowAddModal(false);
          setSuccess('Expense record saved successfully!');
          fetchExpenses();
        } else {
          setError(res.error || 'Failed to record expense.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Expense creation error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelExpense = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to cancel this expense record?')) return;

    setError('');
    try {
      if (window.api && window.api.expenses) {
        const res = await window.api.expenses.cancel(expenseId);
        if (res.success) {
          setSuccess('Expense cancelled successfully.');
          fetchExpenses();
        } else {
          setError(res.error || 'Failed to cancel expense.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error cancelling expense.');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.expense_number.toLowerCase().includes(term) ||
      (e.category_name && e.category_name.toLowerCase().includes(term)) ||
      (e.description && e.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#2012ad]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Shop Expense Management</h1>
            <p className="text-xs font-medium text-slate-500">Record operating expenses, shop bills, staff salaries, transport, and maintenance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExpenses}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Expenses"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Expense #, Category, or Description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
          />
        </div>
      </div>

      {/* Expense Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-sm font-medium">Loading expenses...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No expense records found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Expense #</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredExpenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{ex.expense_number}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{ex.category_name || 'General'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(ex.expense_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-extrabold text-[#2012ad]">₹{ex.amount}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-semibold">{ex.payment_method}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        ex.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ex.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelExpense(ex.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs transition-all"
                        title="Cancel Expense"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record New Expense</h3>
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expense Amount (₹) *</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 4500"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expense Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Salary">Staff Salary</option>
                  <option value="Transport">Transport / Freight</option>
                  <option value="Packaging">Packaging Material</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Marketing">Marketing & Ads</option>
                  <option value="Cleaning">Cleaning & Housekeeping</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reference / Bill #</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. BILL-8899"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly shop electricity bill for August..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="w-1/2 py-2.5 bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Expense</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
