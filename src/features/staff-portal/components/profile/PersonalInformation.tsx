import React, { useState, useEffect } from 'react';
import { StaffProfile } from '../../services/staffProfileService';
import { User, Calendar, Users, Edit3, Check, X, ShieldAlert } from 'lucide-react';

interface PersonalInformationProps {
  profile: StaffProfile;
  onSave: (fields: { dateOfBirth?: string; gender?: string }) => Promise<boolean>;
  isSaving: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({
  profile,
  onSave,
  isSaving,
  onDirtyChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dob, setDob] = useState(profile.dateOfBirth || '');
  const [gender, setGender] = useState(profile.gender || 'Male');

  useEffect(() => {
    setDob(profile.dateOfBirth || '');
    setGender(profile.gender || 'Male');
  }, [profile]);

  const isDirty = dob !== (profile.dateOfBirth || '') || gender !== (profile.gender || 'Male');

  useEffect(() => {
    onDirtyChange?.(isEditing && isDirty);
  }, [isEditing, isDirty, onDirtyChange]);

  const handleCancel = () => {
    setDob(profile.dateOfBirth || '');
    setGender(profile.gender || 'Male');
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSave({
      dateOfBirth: dob || undefined,
      gender: gender || undefined,
    });
    if (ok) {
      setIsEditing(false);
    }
  };

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
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Personal Information
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">
              Identity details & basic demographic records
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-[#2012ad] border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name (Protected Legal Record) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={profile.fullName}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              Locked
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            Official name changes require HR approval
          </p>
        </div>

        {/* Username / Account */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Portal Username
          </label>
          <input
            type="text"
            value={profile.username || 'Unbound'}
            disabled
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Date of Birth
          </label>
          {isEditing ? (
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={isSaving}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100">
              {formatDate(profile.dateOfBirth)}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Gender
          </label>
          {isEditing ? (
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={isSaving}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100">
              {profile.gender || '—'}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
