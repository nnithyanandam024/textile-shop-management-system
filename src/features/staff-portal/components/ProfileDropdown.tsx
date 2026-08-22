import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffUser } from '../services/staffAuthService';
import { User, Settings, LogOut } from 'lucide-react';

interface ProfileDropdownProps {
  user: StaffUser;
  isOpen: boolean;
  onClose: () => void;
  onLogoutClick: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  isOpen,
  onClose,
  onLogoutClick,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100"
    >
      {/* Header Info */}
      <div className="px-4 py-3">
        <p className="text-xs font-extrabold text-slate-900 truncate">{user.displayName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] font-mono font-bold text-[#2012ad] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
            {user.employeeCode}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">• {user.roleName}</span>
        </div>
      </div>

      {/* Navigation Options */}
      <div className="py-1">
        <button
          onClick={() => {
            onClose();
            navigate('/staff/profile');
          }}
          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
        >
          <User className="w-4 h-4 text-slate-400" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => {
            onClose();
            navigate('/self-service/settings');
          }}
          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>

      {/* Logout Action */}
      <div className="py-1">
        <button
          onClick={() => {
            onClose();
            onLogoutClick();
          }}
          className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
