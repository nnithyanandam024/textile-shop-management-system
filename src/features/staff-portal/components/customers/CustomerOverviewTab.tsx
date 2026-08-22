import React from 'react';
import { StaffCustomerDetails } from '../../services/staffCustomerService';
import { ShoppingBag, DollarSign, TrendingUp, Calendar, RotateCcw, Tag, Edit3 } from 'lucide-react';

interface CustomerOverviewTabProps {
  customer: StaffCustomerDetails;
  onOpenPreferences: () => void;
}

export const CustomerOverviewTab: React.FC<CustomerOverviewTabProps> = ({
  customer,
  onOpenPreferences,
}) => {
  return (
    <div className="space-y-6 select-none">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Purchases
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{customer.totalPurchases.toLocaleString('en-IN')}
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
              Total Orders
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {customer.ordersCount}
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Average Order Value
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{customer.averageOrderValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Returns */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Returns
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {customer.totalReturnsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Details & Textile Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Milestone Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2818cf]" />
            <span>Customer History & Milestones</span>
          </h4>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Customer Since</span>
              <span className="font-extrabold text-slate-800">
                {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Latest Purchase</span>
              <span className="font-extrabold text-slate-800">
                {customer.lastPurchaseDate
                  ? new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN')
                  : 'No orders yet'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Date of Birth</span>
              <span className="font-extrabold text-slate-800">
                {customer.preferences?.dob || 'Not provided'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Loyalty Lifetime Points</span>
              <span className="font-extrabold text-[#2818cf] font-mono">
                {customer.lifetimePoints} Points
              </span>
            </div>
          </div>
        </div>

        {/* Textile Shopping Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2818cf]" />
              <span>Textile Retail Preferences</span>
            </h4>

            <button
              type="button"
              onClick={onOpenPreferences}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors inline-flex items-center gap-1 text-[11px] font-extrabold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Preferred Categories / Fabrics
              </span>
              <p className="font-extrabold text-slate-800 pt-0.5">
                {customer.preferences?.preferredCategories || 'Sarees, Silk Kurtis, Traditional Wear'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Preferred Colors
              </span>
              <p className="font-extrabold text-slate-800 pt-0.5">
                {customer.preferences?.preferredColors || 'Royal Blue, Crimson Red, Gold'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Preferred Sizes
              </span>
              <p className="font-extrabold text-slate-800 pt-0.5 font-mono">
                {customer.preferences?.preferredSizes || 'Free Size, L (40)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
