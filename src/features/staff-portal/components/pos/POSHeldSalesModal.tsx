import React from 'react';
import { StaffPOSHeldSaleItem } from '../../services/staffPOSService';
import { X, Layers, Play, Trash2, Clock, User } from 'lucide-react';

interface POSHeldSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldSales: StaffPOSHeldSaleItem[];
  onResume: (heldId: number) => void;
  onDiscard: (heldId: number) => void;
}

export const POSHeldSalesModal: React.FC<POSHeldSalesModalProps> = ({
  isOpen,
  onClose,
  heldSales,
  onResume,
  onDiscard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Held Shopping Carts</h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Resume or clear parked shopping carts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Held Carts List */}
        {heldSales.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-extrabold">No parked carts available</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
            {heldSales.map((h) => {
              const itemsCount = h.cartData?.cart?.length || 0;
              return (
                <div key={h.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h5 className="text-xs font-extrabold text-slate-900">{h.referenceName}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-semibold">
                        <User className="w-2.5 h-2.5" />
                        {h.customerName}
                      </span>
                      <span>• {itemsCount} items</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-900 font-mono">
                      ₹{h.totalAmount.toLocaleString('en-IN')}
                    </span>

                    <button
                      type="button"
                      onClick={() => onResume(h.id)}
                      className="px-3 py-1.5 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDiscard(h.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Discard Held Cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
