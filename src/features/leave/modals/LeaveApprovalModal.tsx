import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, ShieldCheck, AlertCircle, Check, X as XIcon } from 'lucide-react';

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: any;
}

export const LeaveApprovalModal: React.FC<LeaveApprovalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  request,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const handleApprove = async () => {
    setError('');
    setLoading(true);
    try {
      if (window.api?.leave) {
        const res = await window.api.leave.approve(request.id);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Approval failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rejectionReason.trim()) {
      setError('Please enter a rejection reason.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.leave) {
        const res = await window.api.leave.reject(request.id, rejectionReason.trim());
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Rejection failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Review Leave Application</h3>
              <p className="text-xs text-slate-500">
                {request.staff_code} — {request.first_name} {request.last_name || ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Leave Type:</span>
              <span className="font-bold text-[#2012ad] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {request.leave_code} — {request.leave_name}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Requested Period:</span>
              <span className="font-semibold text-slate-900">
                {request.start_date} to {request.end_date} ({request.duration_days} Days)
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Department:</span>
              <span className="font-semibold text-slate-800">{request.department_name || 'Unassigned'}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-slate-700">
              <span className="font-bold block mb-1">Reason for Application:</span>
              <p className="italic text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">{request.reason}</p>
            </div>
          </div>

          {isRejecting ? (
            <form onSubmit={handleReject} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rejection Reason *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Insufficient department staffing for peak sale week"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsRejecting(false)} disabled={loading}>
                  Back
                </Button>
                <Button type="submit" variant="danger" isLoading={loading}>
                  Confirm Rejection
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="danger" icon={<XIcon className="w-4 h-4" />} onClick={() => setIsRejecting(true)}>
                Reject Leave
              </Button>
              <Button type="button" variant="primary" icon={<Check className="w-4 h-4" />} onClick={handleApprove} isLoading={loading}>
                Approve Leave
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
