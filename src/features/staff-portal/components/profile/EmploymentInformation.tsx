import React from 'react';
import { StaffProfile } from '../../services/staffProfileService';
import { Briefcase, Lock, ShieldCheck, Calendar, Building, UserCheck } from 'lucide-react';

interface EmploymentInformationProps {
  profile: StaffProfile;
  onRequestChangeClick: () => void;
}

export const EmploymentInformation: React.FC<EmploymentInformationProps> = ({
  profile,
  onRequestChangeClick,
}) => {
  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Employment Records
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">
              Official store affiliation, organizational role, and management hierarchy
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/70">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Admin Read-Only</span>
        </span>
      </div>

      {/* Read-Only Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Employee Code */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Employee ID / Code
          </span>
          <p className="text-xs font-mono font-extrabold text-slate-900">
            {profile.staffCode}
          </p>
        </div>

        {/* Department */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Department
          </span>
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs font-bold text-slate-900 truncate">
              {profile.departmentName}
            </p>
          </div>
        </div>

        {/* Designation */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Official Designation
          </span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2818cf] shrink-0" />
            <p className="text-xs font-bold text-slate-900 truncate">
              {profile.designationName}
            </p>
          </div>
        </div>

        {/* Joining Date */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Joining Date
          </span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs font-bold text-slate-900">
              {formatDate(profile.joiningDate)}
            </p>
          </div>
        </div>

        {/* Employment Type */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Employment Type
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-[#2818cf]">
            {profile.employmentType.replace('_', ' ')}
          </span>
        </div>

        {/* Reporting Manager */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            Reporting Manager
          </span>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs font-bold text-slate-900 truncate">
              {profile.managerName || 'Store Operations Lead'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="mt-4 p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 flex items-center justify-between gap-3 text-xs">
        <p className="text-[11px] font-semibold text-slate-600">
          Need to correct your designation, department, or bank details?
        </p>
        <button
          type="button"
          onClick={onRequestChangeClick}
          className="text-xs font-extrabold text-[#2818cf] hover:text-indigo-800 hover:underline shrink-0"
        >
          Submit Change Request →
        </button>
      </div>
    </div>
  );
};
