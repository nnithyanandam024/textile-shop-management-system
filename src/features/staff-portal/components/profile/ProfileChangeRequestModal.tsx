import React, { useState } from 'react';
import { ProfileChangeRequest } from '../../services/staffProfileService';
import { FileQuestion, X, Check, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ProfileChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (input: {
    fieldName: string;
    oldValue?: string;
    newValue: string;
    reason: string;
  }) => Promise<boolean>;
  pastRequests: ProfileChangeRequest[];
  isSubmitting: boolean;
}

export const ProfileChangeRequestModal: React.FC<ProfileChangeRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
  pastRequests,
  isSubmitting,
}) => {
  const [tab, setTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [fieldName, setFieldName] = useState('Legal Full Name');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fieldName) {
      setError('Please select a field to update.');
      return;
    }
    if (!newValue.trim()) {
      setError('Please provide the requested new value.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason / justification for this change.');
      return;
    }

    const ok = await onSubmitRequest({
      fieldName,
      oldValue: oldValue.trim() || undefined,
      newValue: newValue.trim(),
      reason: reason.trim(),
    });

    if (ok) {
      setNewValue('');
      setOldValue('');
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center mx-auto mb-2">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Request Official Record Update</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Submit administrative change requests for HR review
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setTab('NEW')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'NEW' ? 'bg-white text-[#2818cf] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => setTab('HISTORY')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'HISTORY' ? 'bg-white text-[#2818cf] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Past Requests</span>
            {pastRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-[#2818cf]">
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
                  Field / Detail to Update <span className="text-red-500">*</span>
                </label>
                <select
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] focus:bg-white cursor-pointer"
                >
                  <option value="Legal Full Name">Legal Full Name</option>
                  <option value="Bank Account Number">Bank Account Number</option>
                  <option value="Bank IFSC Code">Bank IFSC Code</option>
                  <option value="PAN / Tax ID Number">PAN / Tax ID Number</option>
                  <option value="Aadhar / Govt ID Number">Aadhar / Govt ID Number</option>
                  <option value="Designation / Job Role">Designation / Job Role</option>
                  <option value="Department Transfer">Department Transfer</option>
                  <option value="Other Official Detail">Other Official Detail</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current / Old Value (Optional)
                </label>
                <input
                  type="text"
                  value={oldValue}
                  onChange={(e) => setOldValue(e.target.value)}
                  placeholder="Existing value on record"
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Requested New Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Exact new detail to be recorded"
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason / Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this change is needed (e.g. Bank change, Legal name correction with gazette)..."
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] focus:bg-white resize-none"
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
                  className="flex-1 py-3 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {pastRequests.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No past change requests found.</p>
                </div>
              ) : (
                pastRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {req.field_name}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-xs text-slate-700 space-y-0.5">
                      <p>
                        <span className="font-semibold text-slate-400">New: </span>
                        <span className="font-bold">{req.new_value}</span>
                      </p>
                      {req.old_value && (
                        <p className="text-[11px] text-slate-400">Old: {req.old_value}</p>
                      )}
                      <p className="text-[11px] text-slate-500 italic">“{req.reason}”</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      Submitted: {req.created_at?.slice(0, 10) || 'Recently'}
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
