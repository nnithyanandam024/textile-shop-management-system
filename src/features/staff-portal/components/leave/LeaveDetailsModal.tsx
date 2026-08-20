import React from 'react';
import { StaffLeaveRequestItem } from '../../services/staffLeaveService';
import { getLeaveStatusConfig } from '../../utils/leaveStatus';
import {
  FileText,
  Calendar,
  Clock,
  User,
  XCircle,
  X,
} from 'lucide-react';

interface LeaveDetailsModalProps {
  request: StaffLeaveRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelRequest: (requestId: number) => void;
}

export const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  request,
  isOpen,
  onClose,
  onCancelRequest,
}) => {
  if (!isOpen || !request) return null;

  const statusCfg = getLeaveStatusConfig(request.status);
  const isHalfDay = request.durationType === 'HALF_DAY';

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {request.leaveName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Application #{request.id}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                From Date
              </span>
              <p className="font-extrabold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {formatDate(request.startDate)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                To Date
              </span>
              <p className="font-extrabold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {formatDate(request.endDate)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Total Duration
              </span>
              <p className="font-extrabold text-slate-900">
                {request.durationDays} {request.durationDays === 1 ? 'Day' : 'Days'} {isHalfDay ? `(${request.session || 'Half Day'})` : ''}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Submitted At
              </span>
              <p className="font-bold text-slate-700 flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {request.requestedAt?.slice(0, 16) || '—'}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Reason Provided
            </span>
            <p className="font-semibold text-slate-800 italic bg-white p-2.5 rounded-xl border border-slate-100">
              “{request.reason}”
            </p>
          </div>

          {/* Reviewer remarks if available */}
          {request.reviewedBy && (
            <div className="pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Management Review
              </span>
              <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Reviewed by: <strong>{request.reviewedBy}</strong>
                </span>
                {request.reviewedAt && (
                  <span className="text-[11px] text-slate-400">{request.reviewedAt.slice(0, 10)}</span>
                )}
              </div>
              {request.reviewComment && (
                <p className="text-[11px] text-indigo-900 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                  {request.reviewComment}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {request.status === 'PENDING' && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onCancelRequest(request.id);
            }}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Cancel This Leave Request</span>
          </button>
        )}
      </div>
    </div>
  );
};
