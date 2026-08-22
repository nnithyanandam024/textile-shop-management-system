import React, { useState } from 'react';
import { X, Award } from 'lucide-react';

interface CustomerLoyaltyAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onAdjust: (points: number, type: 'EARN' | 'REDEEM' | 'ADJUST', description: string) => Promise<any>;
}

export const CustomerLoyaltyAdjustModal: React.FC<CustomerLoyaltyAdjustModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onAdjust,
}) => {
  const [type, setType] = useState<'EARN' | 'REDEEM' | 'ADJUST'>('EARN');
  const [points, setPoints] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (points <= 0) {
      setError('Points amount must be greater than 0.');
      return;
    }

    if (type === 'REDEEM' && points > currentBalance) {
      setError(`Cannot redeem more than available balance (${currentBalance} pts).`);
      return;
    }

    if (!description.trim()) {
      setError('A reason / description is required for audit logs.');
      return;
    }

    setSubmitting(true);
    try {
      await onAdjust(points, type, description.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Loyalty Points Operation</h3>
              <p className="text-xs text-slate-400 font-semibold">
                Available Balance: <span className="font-mono font-bold text-slate-700">{currentBalance} pts</span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'EARN', label: 'Reward (+)' },
              { id: 'REDEEM', label: 'Redeem (-)' },
              { id: 'ADJUST', label: 'Adjust' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id as any)}
                className={`py-2 rounded-2xl text-xs font-extrabold border transition-all ${
                  type === opt.id
                    ? 'bg-[#2012ad] text-white border-[#2012ad] shadow-md shadow-indigo-600/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Points input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700">Points Value</label>
            <input
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-[#2012ad]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700">Reason / Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Festival bonus reward; In-store loyalty redemption"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-extrabold text-rose-700">
              {error}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-[#2012ad] hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
