import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Edit3, AlertCircle } from 'lucide-react';

interface RequestCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  attendanceRecord: any;
}

export const RequestCorrectionModal: React.FC<RequestCorrectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  attendanceRecord,
}) => {
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [newStatus, setNewStatus] = useState('PRESENT');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attendanceRecord && isOpen) {
      setNewCheckIn(attendanceRecord.check_in || '09:00');
      setNewCheckOut(attendanceRecord.check_out || '18:00');
      setNewStatus(attendanceRecord.status || 'PRESENT');
      setReason('');
      setError('');
    }
  }, [attendanceRecord, isOpen]);

  if (!isOpen || !attendanceRecord) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please enter a reason for this attendance correction.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.attendance) {
        const res = await window.api.attendance.requestCorrection(attendanceRecord.attendance_id || attendanceRecord.id, {
          new_check_in: newCheckIn,
          new_check_out: newCheckOut,
          new_status: newStatus,
          reason: reason.trim(),
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to submit correction request.');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Attendance Correction</h3>
              <p className="text-xs text-slate-500">
                {attendanceRecord.staff_code} — {attendanceRecord.first_name} ({attendanceRecord.attendance_date})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Current Record</p>
            <p className="text-slate-600">
              Check-In: <span className="font-semibold text-slate-900">{attendanceRecord.check_in || 'N/A'}</span> | Check-Out:{' '}
              <span className="font-semibold text-slate-900">{attendanceRecord.check_out || 'N/A'}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New Check In"
              type="time"
              value={newCheckIn}
              onChange={(e) => setNewCheckIn(e.target.value)}
            />
            <Input
              label="New Check Out"
              type="time"
              value={newCheckOut}
              onChange={(e) => setNewCheckOut(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="HALF_DAY">HALF DAY</option>
              <option value="HOLIDAY">HOLIDAY</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Correction Reason *</label>
            <textarea
              rows={3}
              placeholder="e.g. Forgot to check in at morning counter, card scanner offline"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Submit Request for Approval
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
