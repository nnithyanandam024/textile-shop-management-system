import React from 'react';
import { StaffLeaveTypeOption } from '../../services/staffLeaveService';
import { Filter, RotateCcw } from 'lucide-react';

interface LeaveFiltersProps {
  leaveTypes: StaffLeaveTypeOption[];
  selectedType?: number;
  onTypeChange: (typeId?: number) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onReset: () => void;
}

export const LeaveFilters: React.FC<LeaveFiltersProps> = ({
  leaveTypes,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  selectedYear,
  onYearChange,
  onReset,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-500 font-bold">
        <Filter className="w-4 h-4 text-slate-400" />
        <span>Filter Records:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Leave Type Selector */}
        <select
          value={selectedType || ''}
          onChange={(e) => onTypeChange(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] cursor-pointer"
        >
          <option value="">All Leave Types</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Status Selector */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] cursor-pointer"
        >
          <option value={currentYear - 1}>{currentYear - 1}</option>
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear + 1}>{currentYear + 1}</option>
        </select>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
