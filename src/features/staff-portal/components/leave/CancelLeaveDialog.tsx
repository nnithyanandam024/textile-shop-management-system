import React from 'react';
import { Ban, AlertTriangle } from 'lucide-react';

interface CancelLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  title?: string;
  description?: string;
}

export const CancelLeaveDialog: React.FC<CancelLeaveDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  title = 'Cancel Leave Request?',
  description = 'Are you sure you want to cancel this request? This action will mark the application as cancelled.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 relative text-center space-y-4">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">{description}</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Keep Request
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Ban className="w-4 h-4" />
                <span>Confirm Cancel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
