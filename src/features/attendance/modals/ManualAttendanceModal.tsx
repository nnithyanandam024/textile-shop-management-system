import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, CalendarCheck } from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  initialStaffId?: number;
  initialDate?: string;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  initialStaffId,
  initialDate,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [status, setStatus] = useState('PRESENT');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [permissionMinutes, setPermissionMinutes] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(initialStaffId || (staffList.length > 0 ? staffList[0].id : ''));
      const today = new Date().toISOString().split('T')[0];
      setAttendanceDate(initialDate || today);
      setStatus('PRESENT');
      setCheckIn('09:00');
      setCheckOut('18:00');
      setPermissionMinutes(0);
      setRemarks('');
      setError('');
    }
  }, [isOpen, initialStaffId, initialDate, staffList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (!attendanceDate) {
      setError('Please select attendance date.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.attendance) {
        const res = await window.api.attendance.markManual({
          staff_id: Number(staffId),
          attendance_date: attendanceDate,
          status,
          check_in: status === 'ABSENT' || status === 'HOLIDAY' || status === 'WEEK_OFF' ? undefined : checkIn,
          check_out: status === 'ABSENT' || status === 'HOLIDAY' || status === 'WEEK_OFF' ? undefined : checkOut,
          permission_minutes: Number(permissionMinutes) || 0,
          remarks: remarks.trim() || undefined,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to record manual attendance.');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mark Manual Attendance</h3>
              <p className="text-xs text-slate-500">Record check-in, check-out or absent status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Staff Member *</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="">Select Employee...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.staff_code} — {s.first_name} {s.last_name || ''} ({s.department_name || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Attendance Date *"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF DAY</option>
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="WEEK_OFF">WEEK OFF</option>
              </select>
            </div>
          </div>

          {status !== 'ABSENT' && status !== 'HOLIDAY' && status !== 'WEEK_OFF' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Check In Time"
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
              <Input
                label="Check Out Time"
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
              <Input
                label="Permission (Mins)"
                type="number"
                placeholder="e.g. 30"
                value={permissionMinutes}
                onChange={(e) => setPermissionMinutes(Number(e.target.value))}
              />
            </div>
          )}

          <Input
            label="Remarks / Notes"
            placeholder="e.g. Official outdoor duty, forgot card"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Attendance Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
