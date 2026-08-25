import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Calendar,
  Plus
} from 'lucide-react';
import { AiApi } from '../../../api/aiApi';

interface CustomerIntelligenceModalProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProductToBill?: (item: any) => void;
}

export const CustomerIntelligenceModal: React.FC<CustomerIntelligenceModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onSelectProductToBill
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && customerId) {
      const fetchIntelligence = async () => {
        setLoading(true);
        try {
          const [profRes, recRes] = await Promise.all([
            AiApi.getCustomerIntelligence(customerId),
            AiApi.getCartRecommendations([], customerId),
          ]);

          if (profRes.success && profRes.data) {
            setProfile(profRes.data);
          }
          if (recRes.success && recRes.data?.recommendations) {
            setRecommendations(recRes.data.recommendations);
          }
        } catch (err) {
          console.error('Failed to load customer intelligence:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchIntelligence();
    }
  }, [isOpen, customerId]);

  if (!isOpen || !customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#2012ad] via-[#3525cb] to-[#4837ea] text-white flex items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">{profile?.customerName || 'Customer Intelligence'}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full">
                  {profile?.segmentLabel || 'Customer'}
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-mono mt-0.5">
                Code: {profile?.customerCode} • Total Visits: {profile?.totalVisits} • Lifetime Spend: ₹{profile?.totalLifetimeSpend?.toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] bg-[#f9fafc]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-[#2012ad] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-600">Analyzing Customer Purchasing Profile & Category Affinity...</p>
            </div>
          ) : !profile ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No purchase history found for this customer.
            </div>
          ) : (
            <>
              {/* 1. Buying Cycle & Due Visit Banner */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2012ad]" />
                    <span>Customer Buying Cycle & Visit Interval</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    profile.isDueForVisit ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {profile.isDueForVisit ? '⏳ Due for Re-visit' : '🟢 Active Cycle'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Purchase Interval</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">Every ~{profile.averageDaysBetweenPurchases} Days</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Days Since Last Visit</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">{profile.daysSinceLastPurchase} Days Ago</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Average Ticket (AOV)</span>
                    <p className="text-base font-black text-[#2012ad] mt-0.5">₹{profile.averageOrderValue?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-[#2012ad] font-semibold flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{profile.suggestedAction}</span>
                </div>
              </div>

              {/* 2. Category Affinity Breakdown */}
              {profile.categoryAffinities?.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Category Preference & Revenue Share
                  </h3>

                  <div className="space-y-2.5">
                    {profile.categoryAffinities.map((cat: any) => (
                      <div key={cat.categoryId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>{cat.categoryName}</span>
                          <span>₹{cat.totalSpent?.toLocaleString()} ({cat.percentageOfSpend}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#2012ad] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${cat.percentageOfSpend}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Tailored Garment Recommendations */}
              {recommendations.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2012ad]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Tailored Product Recommendations For This Customer
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendations.map((item) => (
                      <div
                        key={item.variantId}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-indigo-50 text-[#2012ad] rounded uppercase">
                              {item.strategyLabel}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              ₹{item.sellingPrice?.toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{item.productName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>
                          <p className="text-[10px] text-slate-600 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                            💡 {item.aiReasoning}
                          </p>
                        </div>

                        {onSelectProductToBill && (
                          <button
                            onClick={() => {
                              onSelectProductToBill(item);
                              onClose();
                            }}
                            className="w-full py-1.5 bg-[#2012ad] hover:bg-[#1a0e90] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 mt-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Active Bill</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
