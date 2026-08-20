import React, { useState } from 'react';
import { StaffLeaveRequestItem, StaffPermissionRequestItem } from '../../services/staffLeaveService';
import { getLeaveStatusConfig } from '../../utils/leaveStatus';
import { FileText, Clock, Eye, Calendar, AlertCircle } from 'lucide-react';

interface LeaveRequestListProps {
  requests: StaffLeaveRequestItem[];
  permissions: StaffPermissionRequestItem[];
  onSelectRequest: (req: StaffLeaveRequestItem) => void;
  onCancelRequest: (requestId: number) => void;
  onCancelPermission: (permId: number) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  isLoading: boolean;
}

export const LeaveRequestList: React.FC<LeaveRequestListProps> = ({
  requests,
  permissions,
  onSelectRequest,
  onCancelRequest,
  onCancelPermission,
  statusFilter,
  onStatusFilterChange,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'LEAVE' | 'PERMISSION'>('LEAVE');

  const formatDateRange = (start: string, end: string, duration: number, isHalfDay: boolean) => {
    if (isHalfDay) {
      return `${start} (Half Day)`;
    }
    if (start === end) {
      return `${start} (1 Day)`;
    }
    return `${start} → ${end} (${duration} Days)`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              My Leave & Permission Applications
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Audit trail and real-time review status
            </p>
          </div>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('LEAVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LEAVE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PERMISSION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PERMISSION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Permissions ({permissions.length})
          </button>
        </div>
      </div>

      {/* Filter Tabs for Leave */}
      {activeTab === 'LEAVE' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* Leave Requests Table */}
      {activeTab === 'LEAVE' ? (
        requests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-600">No leave requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="pb-3 px-3">Date / Duration</th>
                  <th className="pb-3 px-3">Leave Type</th>
                  <th className="pb-3 px-3">Reason</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const statusCfg = getLeaveStatusConfig(r.status);
                  const isHalfDay = r.durationType === 'HALF_DAY';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectRequest(r)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateRange(r.startDate, r.endDate, r.durationDays, isHalfDay)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-extrabold text-slate-800">
                          {r.leaveName}
                        </span>
                        {isHalfDay && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-[#2818cf]">
                            {r.session || 'Half'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-[220px] truncate">
                        {r.reason}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelRequest(r.id);
                              }}
                              disabled={isLoading}
                              className="px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRequest(r);
                            }}
                            className="p-1 text-slate-400 hover:text-[#2818cf] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Permission Requests Table */
        permissions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-600">No permission requests submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Window / Duration</th>
                  <th className="pb-3 px-3">Reason</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => {
                  const statusCfg = getLeaveStatusConfig(p.status);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {p.requestDate}
                      </td>

                      <td className="py-3 px-3 font-extrabold text-slate-800 whitespace-nowrap font-mono">
                        {p.startTime} – {p.endTime} ({p.durationFormatted})
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-[220px] truncate">
                        {p.reason}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {p.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => onCancelPermission(p.id)}
                            disabled={isLoading}
                            className="px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};
