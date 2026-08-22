import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStaffCustomers } from '../hooks/useStaffCustomers';
import { CustomerProfileHeader } from '../components/customers/CustomerProfileHeader';
import { CustomerOverviewTab } from '../components/customers/CustomerOverviewTab';
import { CustomerPurchaseHistoryTab } from '../components/customers/CustomerPurchaseHistoryTab';
import { CustomerReturnsTab } from '../components/customers/CustomerReturnsTab';
import { CustomerLoyaltyTab } from '../components/customers/CustomerLoyaltyTab';
import { CustomerNotesTab } from '../components/customers/CustomerNotesTab';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { CustomerPreferencesModal } from '../components/customers/CustomerPreferencesModal';
import { CustomerLoyaltyAdjustModal } from '../components/customers/CustomerLoyaltyAdjustModal';
import {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Award,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const StaffCustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PURCHASES' | 'RETURNS' | 'LOYALTY' | 'NOTES'>('OVERVIEW');

  const {
    customerDetails,
    purchases,
    returns,
    loyalty,
    loadingProfile,
    isEditModalOpen,
    isPreferencesModalOpen,
    isLoyaltyAdjustModalOpen,
    error,
    successMessage,
    setIsEditModalOpen,
    setIsPreferencesModalOpen,
    setIsLoyaltyAdjustModalOpen,
    onLoadProfile,
    onUpdateCustomer,
    onUpdatePreferences,
    onAddNote,
    onAdjustLoyalty,
    clearError,
    clearSuccess,
  } = useStaffCustomers();

  useEffect(() => {
    if (customerId) {
      onLoadProfile(customerId);
    }
  }, [customerId, onLoadProfile]);

  if (loadingProfile) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse select-none">
        <div className="h-44 bg-white rounded-3xl border border-slate-100" />
        <div className="h-12 bg-white rounded-2xl border border-slate-100" />
        <div className="h-64 bg-white rounded-3xl border border-slate-100" />
      </div>
    );
  }

  if (!customerDetails) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-3 select-none">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-extrabold text-rose-700">
          Customer profile not found.
        </div>
      </div>
    );
  }

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

      {/* Profile Header */}
      <CustomerProfileHeader
        customer={customerDetails}
        onOpenEdit={() => setIsEditModalOpen(true)}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center bg-white p-1.5 rounded-3xl border border-slate-200/80 shadow-xs gap-1 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
          { id: 'PURCHASES', label: `Purchases (${purchases.length})`, icon: ShoppingBag },
          { id: 'RETURNS', label: `Returns (${returns.length})`, icon: RotateCcw },
          { id: 'LOYALTY', label: `Loyalty Points (${customerDetails.loyaltyPoints})`, icon: Award },
          { id: 'NOTES', label: `Notes (${customerDetails.notes.length})`, icon: FileText },
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

      {/* Tab Panels */}
      {activeTab === 'OVERVIEW' && (
        <CustomerOverviewTab
          customer={customerDetails}
          onOpenPreferences={() => setIsPreferencesModalOpen(true)}
        />
      )}

      {activeTab === 'PURCHASES' && (
        <CustomerPurchaseHistoryTab purchases={purchases} />
      )}

      {activeTab === 'RETURNS' && (
        <CustomerReturnsTab returns={returns} />
      )}

      {activeTab === 'LOYALTY' && (
        <CustomerLoyaltyTab
          loyalty={loyalty}
          onOpenAdjustModal={() => setIsLoyaltyAdjustModalOpen(true)}
        />
      )}

      {activeTab === 'NOTES' && (
        <CustomerNotesTab
          notes={customerDetails.notes}
          onAddNote={(note) => onAddNote(customerDetails.id, note)}
        />
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <CustomerFormModal
          isOpen={isEditModalOpen}
          initialData={customerDetails}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={(data) => onUpdateCustomer(customerDetails.id, data)}
        />
      )}

      {/* Edit Preferences Modal */}
      {isPreferencesModalOpen && (
        <CustomerPreferencesModal
          isOpen={isPreferencesModalOpen}
          initialPreferences={customerDetails.preferences}
          onClose={() => setIsPreferencesModalOpen(false)}
          onSave={(prefs) => onUpdatePreferences(customerDetails.id, prefs)}
        />
      )}

      {/* Loyalty Adjust Modal */}
      {isLoyaltyAdjustModalOpen && (
        <CustomerLoyaltyAdjustModal
          isOpen={isLoyaltyAdjustModalOpen}
          currentBalance={customerDetails.loyaltyPoints}
          onClose={() => setIsLoyaltyAdjustModalOpen(false)}
          onAdjust={(pts, type, desc) => onAdjustLoyalty(customerDetails.id, pts, type, desc)}
        />
      )}
    </div>
  );
};
export default StaffCustomerProfile;
