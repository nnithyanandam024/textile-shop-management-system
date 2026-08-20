import React from 'react';
import { StaffProfile } from '../../services/staffProfileService';
import { Camera, KeyRound, FileQuestion, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ProfileHeaderProps {
  profile: StaffProfile;
  onChangePhotoClick: () => void;
  onChangePasswordClick: () => void;
  onRequestChangeClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onChangePhotoClick,
  onChangePasswordClick,
  onRequestChangeClick,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isActive = profile.status === 'ACTIVE';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden select-none">
      {/* Decorative subtle background accents */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-indigo-50/50 via-purple-50/30 to-transparent pointer-events-none rounded-tr-3xl" />

      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
        {/* Left: Avatar + Identity */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar Photo Frame */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-[#2818cf] to-indigo-700 p-0.5 shadow-md flex items-center justify-center">
              {profile.photoPath ? (
                <img
                  src={profile.photoPath}
                  alt={profile.fullName}
                  className="w-full h-full object-cover rounded-[22px]"
                  onError={(e) => {
                    // Fallback to text initials if broken
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-[22px] bg-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold tracking-wider">
                  {getInitials(profile.fullName)}
                </div>
              )}
            </div>

            {/* Change Photo Hover Overlay Button */}
            <button
              type="button"
              onClick={onChangePhotoClick}
              className="absolute inset-0 bg-slate-900/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Change</span>
            </button>

            {/* Status dot indicator */}
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                isActive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              title={`Status: ${profile.status}`}
            />
          </div>

          {/* Name & Badges */}
          <div className="space-y-2">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {profile.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-indigo-50 text-[#2818cf] border border-indigo-100/80">
                  {profile.staffCode}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                {profile.designationName} • <span className="text-slate-700">{profile.departmentName}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{profile.status}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                {profile.workLocation}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={onChangePhotoClick}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Camera className="w-4 h-4 text-slate-500" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={onChangePasswordClick}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-[#2818cf] border border-transparent hover:border-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={onRequestChangeClick}
            className="px-3.5 py-2.5 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 active:scale-95"
          >
            <FileQuestion className="w-4 h-4" />
            <span>Request HR Update</span>
          </button>
        </div>
      </div>
    </div>
  );
};
