import React, { useState, useEffect } from 'react';
import { StaffShiftItem, SwapCandidateItem, staffShiftService } from '../../services/staffShiftService';
import { ArrowRightLeft, X, Check, AlertCircle, Calendar, User } from 'lucide-react';

interface ShiftSwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    target_staff_id: number;
    shift_date: string;
    reason: string;
  }) => Promise<boolean>;
  prefilledShift?: StaffShiftItem | null;
  isSubmitting: boolean;
}

export const ShiftSwapRequestModal: React.FC<ShiftSwapRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledShift,
  isSubmitting,
}) => {
  const [shiftDate, setShiftDate] = useState(() => prefilledShift?.date || new Date().toISOString().slice(0, 10));
  const [candidates, setCandidates] = useState<SwapCandidateItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledShift) {
      setShiftDate(prefilledShift.date);
    }
  }, [prefilledShift]);

  // Fetch candidate peers for this date
  useEffect(() => {
    if (!isOpen || !shiftDate) return;
    let isMounted = true;
    setLoadingCandidates(true);
    staffShiftService.getSwapCandidates(shiftDate)
      .then((data) => {
        if (isMounted) {
          setCandidates(data);
          if (data.length > 0) {
            setSelectedStaffId(data[0].id);
          }
        }
      })
      .catch(() => {
        // fallback
      })
      .finally(() => {
        if (isMounted) setLoadingCandidates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, shiftDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shiftDate) {
      setError('Please select a shift date.');
      return;
    }
    if (!selectedStaffId) {
      setError('Please select a peer staff member to swap with.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the shift swap request.');
      return;
    }

    const ok = await onSubmit({
      target_staff_id: selectedStaffId,
      shift_date: shiftDate,
      reason: reason.trim(),
    });

    if (ok) {
      setReason('');
      onClose();
    }
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedStaffId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Request Shift Swap</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Propose a mutual shift swap with an eligible colleague
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Shift Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shift Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
              />
            </div>
          </div>

          {/* Peer Staff Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Swap With Peer Staff <span className="text-red-500">*</span>
            </label>
            {loadingCandidates ? (
              <div className="p-3 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
                Loading available colleagues...
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-3 text-center text-xs text-amber-700 font-semibold bg-amber-50 rounded-xl">
                No active peers available for swap on this date.
              </div>
            ) : (
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white cursor-pointer"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.staffCode}) — Shift: {c.currentShift}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Selected Peer Shift Summary Preview */}
          {selectedCandidate && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-center justify-between">
              <span className="font-semibold">Colleague's Current Shift:</span>
              <span className="font-bold text-[#2012ad]">{selectedCandidate.currentShift}</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain the reason for this swap request (e.g. Mutual schedule agreement for family event)..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || candidates.length === 0}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Send Swap Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
