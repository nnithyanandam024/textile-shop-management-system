import React, { useState } from 'react';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { ProfileDropdown } from './ProfileDropdown';
import { LogoutDialog } from './LogoutDialog';
import { Bell, ChevronDown, Sparkles } from 'lucide-react';

export const StaffHeader: React.FC = () => {
  const { currentStaffUser, logout } = useStaffAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
              TEXORA
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Staff Portal
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications Placeholder */}
          <div className="relative flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="ml-1.5 text-xs font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full border border-slate-200">
              0
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile Dropdown Trigger */}
          {currentStaffUser && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl transition-all select-none"
              >
                <div className="w-7 h-7 rounded-xl bg-[#2818cf] text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                  {currentStaffUser.displayName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    {currentStaffUser.displayName}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 font-mono">
                    {currentStaffUser.employeeCode}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <ProfileDropdown
                user={currentStaffUser}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                onLogoutClick={() => setIsLogoutDialogOpen(true)}
              />
            </div>
          )}
        </div>
      </header>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
};
