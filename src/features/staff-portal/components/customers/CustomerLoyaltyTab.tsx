import React from 'react';
import { StaffCustomerLoyaltyData } from '../../services/staffCustomerService';
import { Award, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface CustomerLoyaltyTabProps {
  loyalty: StaffCustomerLoyaltyData | null;
  onOpenAdjustModal: () => void;
}

export const CustomerLoyaltyTab: React.FC<CustomerLoyaltyTabProps> = ({
  loyalty,
  onOpenAdjustModal,
}) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'from-purple-600 to-indigo-600 text-white';
      case 'GOLD':
        return 'from-amber-500 to-yellow-600 text-white';
      case 'SILVER':
        return 'from-slate-400 to-slate-600 text-white';
      default:
        return 'from-orange-500 to-amber-600 text-white';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Loyalty Header Card & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier Card */}
        <div
          className={`rounded-3xl p-6 bg-gradient-to-br ${getTierColor(
            loyalty?.tier || 'BRONZE'
          )} shadow-xl shadow-indigo-600/10 flex flex-col justify-between space-y-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 opacity-90" />
              <span className="text-xs font-black tracking-wider uppercase">
                {loyalty?.tier || 'BRONZE'} MEMBER
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
              Ratna Vilas Rewards
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold opacity-90 block">Current Available Points</span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black font-mono">
                {(loyalty?.pointsBalance || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold opacity-90">PTS</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-semibold">
            <span>Lifetime: {loyalty?.lifetimePoints || 0} pts</span>
            <button
              type="button"
              onClick={onOpenAdjustModal}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-white font-extrabold transition-all"
            >
              Adjust / Redeem
            </button>
          </div>
        </div>

        {/* Earned This Month */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Earned This Month
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                +{loyalty?.earnedThisMonth || 0}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            From completed store POS purchases
          </p>
        </div>

        {/* Total Points Redeemed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Total Redeemed
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                -{loyalty?.redeemedTotal || 0}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Converted to discounts on purchases
          </p>
        </div>
      </div>

      {/* Points Transaction Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900">Loyalty Points History</h4>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {loyalty?.transactions.length || 0} Transactions
          </span>
        </div>

        {loyalty?.transactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-semibold">
            No points activity yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {loyalty?.transactions.map((tx) => (
              <div
                key={tx.id}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'EARN'
                        ? 'bg-emerald-50 text-emerald-600'
                        : tx.type === 'REDEEM'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-indigo-50 text-[#2012ad]'
                    }`}
                  >
                    {tx.type === 'EARN' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : tx.type === 'REDEEM' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN')} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-black font-mono ${
                      tx.type === 'EARN'
                        ? 'text-emerald-600'
                        : tx.type === 'REDEEM'
                        ? 'text-rose-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {tx.type === 'EARN' ? `+${tx.points}` : `${tx.points}`} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
