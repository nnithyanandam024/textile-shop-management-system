import React from 'react';
import { useStaffCustomers } from '../hooks/useStaffCustomers';
import { CustomerSearch } from '../components/customers/CustomerSearch';
import { CustomerListTable } from '../components/customers/CustomerListTable';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { Users, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffCustomers: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers,
    searchQuery,
    tierFilter,
    loading,
    isCreateModalOpen,
    error,
    successMessage,
    setSearchQuery,
    setTierFilter,
    setIsCreateModalOpen,
    onCreateCustomer,
    clearError,
    clearSuccess,
  } = useStaffCustomers();

  const totalSpend = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Toast Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-extrabold text-rose-700 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={clearError} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs font-extrabold text-emerald-700 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={clearSuccess} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory & 360° Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold">
            Search customer records, view purchase history, manage textile preferences, and track loyalty points
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-3xl border border-slate-200/80 shadow-xs shrink-0 flex-wrap">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Customers</span>
              <span className="text-xs font-black text-slate-900 font-mono">{customers.length} Profiles</span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200" />

          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="font-extrabold text-xs">₹</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Spend</span>
              <span className="text-xs font-black text-slate-900 font-mono">₹{totalSpend.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200" />

          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Loyalty Points</span>
              <span className="text-xs font-black text-amber-600 font-mono">{totalPoints.toLocaleString('en-IN')} Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <CustomerSearch
        query={searchQuery}
        onQueryChange={setSearchQuery}
        tierFilter={tierFilter}
        onTierFilterChange={setTierFilter}
        onOpenAddModal={() => setIsCreateModalOpen(true)}
      />

      {/* Customer List Table */}
      <CustomerListTable
        customers={customers}
        loading={loading}
        onSelectCustomer={(id) => navigate(`/staff/customers/${id}`)}
      />

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onCreateCustomer}
      />
    </div>
  );
};
export default StaffCustomers;
