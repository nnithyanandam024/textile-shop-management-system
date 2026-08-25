import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  RefreshCw,
  Check
} from 'lucide-react';
import { AiApi } from '../../../api/aiApi';

interface PosRecommendationWidgetProps {
  cartVariantIds: number[];
  customerId?: number;
  onAddToCart: (variant: any) => void;
}

export const PosRecommendationWidget: React.FC<PosRecommendationWidgetProps> = ({
  cartVariantIds,
  customerId,
  onAddToCart
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await AiApi.getCartRecommendations(cartVariantIds, customerId);
      if (res.success && res.data?.recommendations) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      console.error('Failed to fetch POS cart recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [cartVariantIds.length, customerId]);

  const handleAdd = (item: any) => {
    onAddToCart({
      id: item.variantId,
      product_id: item.productId,
      product_name: item.productName,
      sku: item.sku,
      selling_price: item.sellingPrice,
      current_stock: item.currentStock,
    });

    setAddedIds((prev) => new Set(prev).add(item.variantId));

    // Track recommendation conversion
    AiApi.trackRecommendationFeedback({
      recommendationId: `rec_${item.variantId}_${Date.now()}`,
      variantId: item.variantId,
      customerId,
      strategy: item.strategy,
      action: 'add_to_cart',
      timestamp: new Date().toISOString(),
    });
  };

  if (recommendations.length === 0 && !loading) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/40 rounded-2xl border border-indigo-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2012ad] text-amber-300 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                AI Cross-Sell & Upsell Assistant
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-extrabold bg-[#2012ad] text-white rounded-full">
                Live POS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Suggested products frequently bought with items in current bill
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          title="Refresh Suggestions"
          className="p-1.5 text-slate-500 hover:text-[#2012ad] hover:bg-white rounded-lg border border-slate-200/60 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2012ad]' : ''}`} />
        </button>
      </div>

      {/* Recommendations Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-3 bg-white rounded-xl border border-slate-100 animate-pulse space-y-2">
              <div className="w-24 h-3 bg-slate-200 rounded" />
              <div className="w-full h-4 bg-slate-200 rounded" />
              <div className="w-16 h-3 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendations.map((item) => {
            const isAdded = addedIds.has(item.variantId);
            return (
              <div
                key={item.variantId}
                className="p-3.5 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-2 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-indigo-50 text-[#2012ad] rounded-md uppercase tracking-wider">
                      {item.strategyLabel}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Stock: {item.currentStock}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-[#2012ad] transition-colors">
                    {item.productName}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>

                  <p className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 line-clamp-2">
                    💡 {item.aiReasoning}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    ₹{item.sellingPrice?.toLocaleString()}
                  </span>

                  <button
                    onClick={() => handleAdd(item)}
                    disabled={isAdded || item.currentStock <= 0}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs ${
                      isAdded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-[#2012ad] hover:bg-[#1a0e90] text-white active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Bill</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
