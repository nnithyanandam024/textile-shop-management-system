import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, Briefcase, BadgeCheck, ShieldCheck, Edit2, Power } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  onEdit: () => void;
  onDeactivate: () => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  isOpen,
  onClose,
  staff,
  onEdit,
  onDeactivate,
}) => {
  if (!isOpen || !staff) return null;

  const fullName = `${staff.first_name} ${staff.last_name || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="h-28 bg-gradient-to-r from-[#2818cf] to-indigo-600 relative p-6 flex items-start justify-between">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-[10px] font-bold tracking-wider uppercase">
            {staff.staff_code}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/40 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Main */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {staff.photo_path ? (
                <img src={`file://${staff.photo_path}`} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-50 text-[#2818cf] flex items-center justify-center text-2xl font-bold">
                  {staff.first_name[0]}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>
                Edit Profile
              </Button>
              {staff.status === 'ACTIVE' && (
                <Button variant="outline" className="text-rose-600 hover:bg-rose-50 border-rose-200" icon={<Power className="w-3.5 h-3.5" />} onClick={onDeactivate}>
                  Deactivate
                </Button>
              )}
            </div>
          </div>

          {/* Identity Info */}
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-slate-900">{fullName}</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  staff.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                ● {staff.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {staff.designation_name} — <span className="text-[#2818cf]">{staff.department_name}</span>
            </p>
          </div>

          {/* Details Section */}
          <div className="mt-6 space-y-4">
            {/* Contact Details */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{staff.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{staff.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.address || 'No address registered'}</span>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined: {staff.joining_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Type: {staff.employment_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Role: {staff.designation_name}</span>
                </div>
                {staff.username ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>User: @{staff.username}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                    <span>No System User Linked</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
