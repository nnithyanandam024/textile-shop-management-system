import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { RequestAttendanceCorrectionModal } from '../modals/RequestAttendanceCorrectionModal';
import { CalendarCheck, CalendarClock } from 'lucide-react';

export const MyAttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  const fetchAttendance = async () => {
    try {
      if (window.api?.selfService) {
        const logs = await window.api.selfService.getAttendance();
        setAttendance(logs || []);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const leaveCount = attendance.filter((a) => a.status === 'LEAVE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Attendance Calendar</h1>
            <p className="text-xs font-semibold text-slate-500">Track daily check-in times, working hours & submit missing time adjustments</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<CalendarClock className="w-4 h-4" />}
          onClick={() => setIsCorrectionModalOpen(true)}
        >
          Request Correction
        </Button>
      </div>

      {/* Top Monthly Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Present Days</span>
          <p className="text-xl font-extrabold text-emerald-800 mt-1">{presentCount}</p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border border-rose-100">
          <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Absent Days</span>
          <p className="text-xl font-extrabold text-rose-800 mt-1">{absentCount}</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-100">
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Late Arrivals</span>
          <p className="text-xl font-extrabold text-amber-800 mt-1">{lateCount}</p>
        </Card>

        <Card className="p-4 bg-indigo-50/50 border border-indigo-100">
          <span className="text-[10px] font-extrabold text-[#2012ad] uppercase tracking-wider">Leave Days</span>
          <p className="text-xl font-extrabold text-[#2012ad] mt-1">{leaveCount}</p>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card className="space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daily Attendance Logs</h3>
          <span className="text-[11px] font-semibold text-slate-500">{attendance.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{a.date}</td>
                    <td className="py-3 px-4 font-mono">{a.check_in ? a.check_in.slice(11, 16) : '—'}</td>
                    <td className="py-3 px-4 font-mono">{a.check_out ? a.check_out.slice(11, 16) : '—'}</td>
                    <td className="py-3 px-4 font-bold">{a.working_hours ? `${a.working_hours} hrs` : '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          a.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : a.status === 'ABSENT'
                            ? 'bg-rose-100 text-rose-700'
                            : a.status === 'LATE'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-50 text-[#2012ad]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RequestAttendanceCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSuccess={fetchAttendance}
      />
    </div>
  );
};
