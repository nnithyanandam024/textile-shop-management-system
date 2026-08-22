import React, { useState, useEffect } from 'react';
import {
  AttendanceCorrectionRequestItem,
  AttendanceHistoryItem,
} from '../../services/staffAttendanceService';
import {
  HelpCircle,
  X,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface CorrectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (input: {
    date: string;
    attendanceId?: number;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }) => Promise<boolean>;
  prefilledRecord?: AttendanceHistoryItem | null;
  pastRequests: AttendanceCorrectionRequestItem[];
  isSubmitting: boolean;
}

export const CorrectionRequestModal: React.FC<CorrectionRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
  prefilledRecord,
  pastRequests,
  isSubmitting,
}) => {
  const [tab, setTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [date, setDate] = useState(() => prefilledRecord?.attendanceDate || new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState(() => prefilledRecord?.checkIn || '');
  const [checkOut, setCheckOut] = useState(() => prefilledRecord?.checkOut || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledRecord) {
      setDate(prefilledRecord.attendanceDate);
      setCheckIn(prefilledRecord.checkIn || '');
      setCheckOut(prefilledRecord.checkOut || '');
    }
  }, [prefilledRecord]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Please select the date for correction.');
      return;
    }
    if (!checkIn && !checkOut) {
      setError('Please provide at least a requested check-in or check-out time.');
      return;
    }
    if (!reason.trim()) {
      setError('Please describe why this correction is needed (e.g. Forgot to clock out, Store internet issue).');
      return;
    }

    const ok = await onSubmitRequest({
      date,
      attendanceId: prefilledRecord?.id,
      requestedCheckIn: checkIn.trim() || undefined,
      requestedCheckOut: checkOut.trim() || undefined,
      reason: reason.trim(),
    });

    if (ok) {
      setReason('');
      setTab('HISTORY');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        <span>Pending Review</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative select-none max-h-[90vh] flex flex-col">
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
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Attendance Correction</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Submit a correction request for missed check-ins or check-outs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setTab('NEW')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'NEW' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => setTab('HISTORY')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'HISTORY' ? 'bg-white text-[#2012ad] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Past Requests</span>
            {pastRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {pastRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {tab === 'NEW' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Attendance Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Requested Check-In (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Requested Check-Out (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason & Context <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why you missed clocking in/out (e.g. Forgot to clock out after closing counter, Store electricity glitch)..."
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] focus:bg-white resize-none"
                />
              </div>

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
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Correction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {pastRequests.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No past correction requests found.</p>
                </div>
              ) : (
                pastRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        Date: {req.date}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-xs text-slate-700 space-y-0.5">
                      {req.requestedCheckIn && (
                        <p>
                          <span className="font-semibold text-slate-400">Requested Check-In: </span>
                          <span className="font-bold">{req.requestedCheckIn}</span>
                        </p>
                      )}
                      {req.requestedCheckOut && (
                        <p>
                          <span className="font-semibold text-slate-400">Requested Check-Out: </span>
                          <span className="font-bold">{req.requestedCheckOut}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 italic">“{req.reason}”</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      Submitted: {req.createdAt?.slice(0, 10) || 'Recently'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
