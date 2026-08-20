import React from 'react';
import { ShiftRequestItem } from '../../services/staffShiftService';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  CalendarCheck,
  Ban,
} from 'lucide-react';

interface ShiftRequestHistoryProps {
  requests: ShiftRequestItem[];
  onCancelRequest: (id: number, type: 'CHANGE' | 'SWAP') => void;
  isLoading: boolean;
}

export const ShiftRequestHistory: React.FC<ShiftRequestHistoryProps> = ({
  requests,
  onCancelRequest,
  isLoading,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            <Ban className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Shift Change & Swap Requests
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Audit trail of your requested schedule adjustments
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No shift requests submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={`${req.type}-${req.id}`}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      req.type === 'SWAP'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {req.type === 'SWAP' ? (
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    ) : (
                      <CalendarCheck className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      {req.type === 'SWAP' ? 'Shift Swap Request' : 'Shift Change Request'}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Target Date: {req.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(req.status)}
                  {req.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => onCancelRequest(req.id, req.type)}
                      disabled={isLoading}
                      className="px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                {req.type === 'SWAP' ? (
                  <p>
                    <span className="font-semibold text-slate-400">Swap Partner: </span>
                    <strong className="text-slate-900">{req.targetStaffName}</strong>
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-slate-400">Requested Timing: </span>
                    <strong className="text-slate-900">{req.requestedShiftName}</strong>
                  </p>
                )}

                <p className="text-[11px] text-slate-500 italic">“{req.reason}”</p>

                {req.reviewComment && (
                  <p className="pt-1 text-[11px] text-indigo-700 font-semibold border-t border-slate-100 mt-1">
                    Manager Note: {req.reviewComment} {req.reviewedBy ? `(Reviewed by ${req.reviewedBy})` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
