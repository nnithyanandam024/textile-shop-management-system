import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Phone, Mail, MapPin, Briefcase, HeartHandshake, FileText, AlertTriangle } from 'lucide-react';

interface OverviewTabProps {
  staff: any;
  emergencyContacts: any[];
  bankDetails: any;
  documents: any[];
  notes: any[];
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  staff,
  emergencyContacts,
  bankDetails,
  documents,
  notes,
  onNavigateTab,
}) => {
  const completion = staff.profile_completion || 0;
  const primaryEmergency = emergencyContacts.find((c) => c.is_primary) || emergencyContacts[0];

  return (
    <div className="space-y-6">
      {/* Profile Completion Bar */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Profile Completion Status</h4>
            <p className="text-xs text-slate-500">Calculated automatically based on filled profile data sections</p>
          </div>
          <span className="text-lg font-extrabold text-[#2818cf] font-mono">{completion}%</span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completion >= 90
                ? 'bg-emerald-500'
                : completion >= 60
                ? 'bg-[#2818cf]'
                : 'bg-amber-500'
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>

        {completion < 100 && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Profile incomplete ({completion}%). Check missing emergency contact, bank setup, or document verification.</span>
          </div>
        )}
      </Card>

      {/* Snapshot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Contact Snapshot */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#2818cf]" />
              Contact Information
            </h4>
            <button
              onClick={() => onNavigateTab('Contact')}
              className="text-[11px] font-bold text-[#2818cf] hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Primary: {staff.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email: {staff.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{staff.address || 'Address not registered'}</span>
            </div>
          </div>
        </Card>

        {/* Emergency Contact Snapshot */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              Primary Emergency Contact
            </h4>
            <button
              onClick={() => onNavigateTab('Emergency')}
              className="text-[11px] font-bold text-[#2818cf] hover:underline"
            >
              Manage
            </button>
          </div>

          {primaryEmergency ? (
            <div className="space-y-1.5 text-xs font-semibold text-slate-700">
              <p className="font-bold text-slate-900">{primaryEmergency.name} ({primaryEmergency.relationship})</p>
              <p className="text-slate-600">Phone: {primaryEmergency.phone}</p>
              {primaryEmergency.address && <p className="text-[11px] text-slate-400 truncate">{primaryEmergency.address}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">No emergency contact configured.</p>
          )}
        </Card>

        {/* Employment Snapshot */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              Employment Summary
            </h4>
            <button
              onClick={() => onNavigateTab('Employment')}
              className="text-[11px] font-bold text-[#2818cf] hover:underline"
            >
              View Full
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <div>
              <p className="text-[10px] text-slate-400">Department</p>
              <p className="font-bold text-[#2818cf]">{staff.department_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Designation</p>
              <p className="font-bold text-slate-900">{staff.designation_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Joined On</p>
              <p>{staff.joining_date}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Reporting Manager</p>
              <p>{staff.manager_name || 'None'}</p>
            </div>
          </div>
        </Card>

        {/* Bank & Documents Snapshot */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              Bank & Documents Overview
            </h4>
            <button
              onClick={() => onNavigateTab('Documents')}
              className="text-[11px] font-bold text-[#2818cf] hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <p>Bank: {bankDetails ? `${bankDetails.bank_name} (${bankDetails.masked_account_number})` : 'Not configured'}</p>
            <p>Uploaded Documents: {documents.length} files</p>
            <p>Internal Notes: {notes.length} notes</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
