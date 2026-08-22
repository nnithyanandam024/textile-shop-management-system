import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Briefcase, Edit2, ShieldCheck } from 'lucide-react';

interface EmploymentTabProps {
  staff: any;
  onEdit: () => void;
}

export const EmploymentTab: React.FC<EmploymentTabProps> = ({ staff, onEdit }) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Employment Details</h3>
            <p className="text-xs text-slate-500">Department, designation, reporting manager & employment dates</p>
          </div>
        </div>

        <Button variant="outline" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>
          Edit Employment Info
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-semibold text-slate-700">
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Staff Code / ID</p>
          <p className="text-sm font-extrabold text-[#2012ad] font-mono mt-1">{staff.staff_code}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Department</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.department_name}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Designation</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.designation_name}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Reporting Manager</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.manager_name || 'No direct manager assigned'}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Employment Type</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.employment_type?.replace('_', ' ')}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Employment Status</p>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              staff.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            ● {staff.status}
          </span>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Work Location</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.work_location || 'Main Store'}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Joining Date</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.joining_date}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Confirmation Date</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.confirmation_date || 'Not confirmed'}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Exit Date</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.exit_date || 'Active Employee (NULL)'}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Linked Application Login User Account</p>
          <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            {staff.username ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>@{staff.username} ({staff.user_display_name})</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal">No System User Linked</span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
};
