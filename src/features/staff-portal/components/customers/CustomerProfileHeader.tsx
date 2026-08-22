import React from 'react';
import { StaffCustomerDetails } from '../../services/staffCustomerService';
import { Phone, Mail, MapPin, Edit3, ShoppingCart, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomerProfileHeaderProps {
  customer: StaffCustomerDetails;
  onOpenEdit: () => void;
}

export const CustomerProfileHeader: React.FC<CustomerProfileHeaderProps> = ({
  customer,
  onOpenEdit,
}) => {
  const navigate = useNavigate();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GOLD':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SILVER':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 select-none">
      {/* Back button & Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/staff/customers')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Customer Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenEdit}
            className="px-3.5 py-2 rounded-2xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/staff/pos')}
            className="px-4 py-2 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Launch POS Sale</span>
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-[#2818cf] font-black text-xl flex items-center justify-center shrink-0 shadow-inner">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{customer.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 font-mono">
                {customer.customerCode}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider flex items-center gap-1 ${getTierColor(
                  customer.tier
                )}`}
              >
                <Award className="w-3 h-3" />
                <span>{customer.tier} Tier</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap pt-1">
              {customer.phone && (
                <div className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.city}, {customer.state || 'Tamil Nadu'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Snapshot Metrics */}
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-50/80 p-4 rounded-3xl border border-slate-100 shrink-0">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Purchases
            </span>
            <span className="text-lg font-black text-slate-900 font-mono">
              ₹{customer.totalPurchases.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Orders
            </span>
            <span className="text-lg font-black text-slate-900 font-mono">
              {customer.ordersCount}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Loyalty Points
            </span>
            <span className="text-lg font-black text-[#2818cf] font-mono">
              {customer.loyaltyPoints}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
