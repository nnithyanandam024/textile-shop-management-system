import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { User, Calendar, Edit2 } from 'lucide-react';

interface PersonalTabProps {
  staff: any;
  onEdit: () => void;
}

export const PersonalTab: React.FC<PersonalTabProps> = ({ staff, onEdit }) => {
  const calculateAge = (dobString?: string): string => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'N/A';
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${age} Years`;
  };

  const fullName = `${staff.first_name} ${staff.last_name || ''}`.trim();

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
            <p className="text-xs text-slate-500">Identity, date of birth & demographic details</p>
          </div>
        </div>

        <Button variant="outline" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>
          Edit Personal Info
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-semibold text-slate-700">
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">First Name</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.first_name}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Last Name</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.last_name || '—'}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Full Identity Name</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{fullName}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Date of Birth</p>
          <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {staff.date_of_birth || 'Not registered'}
          </p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Calculated Age</p>
          <p className="text-sm font-bold text-[#2818cf] mt-1">{calculateAge(staff.date_of_birth)}</p>
        </div>

        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px]">Gender</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{staff.gender || 'Prefer not to say'}</p>
        </div>
      </div>
    </Card>
  );
};
