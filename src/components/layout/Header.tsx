import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, Lock, LogOut, KeyRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { ChangePasswordModal } from '../../features/auth/ChangePasswordModal';
import { NotificationBell } from './NotificationBell';
import { ConnectionStatusIndicator } from '../common/ConnectionStatusIndicator';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, lockScreen, logout } = useAuth();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showChangePass, setShowChangePass] = useState<boolean>(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
      {/* Left: Global Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, invoices, customers... (Ctrl + K)"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2818cf] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time Status Indicator */}
        <ConnectionStatusIndicator />

        {/* Quick History Button */}
        <button
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
          title="Recent History"
        >
          <History className="w-5 h-5" />
        </button>

        {/* Notifications Bell */}
        <NotificationBell />

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 p-1.5 pl-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf] font-bold text-xs">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.displayName || 'Store Staff'}
              </div>
              <div className="text-[10px] font-semibold text-slate-500">
                {currentUser?.roleName || 'Cashier'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu Popup */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.displayName}</p>
                <p className="text-[10px] text-slate-500 font-mono">@{currentUser?.username}</p>
              </div>

              <button
                onClick={() => {
                  setShowMenu(false);
                  lockScreen();
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-[#2818cf] flex items-center gap-2 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Station</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowChangePass(true);
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-[#2818cf] flex items-center gap-2 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={async () => {
                  setShowMenu(false);
                  await logout();
                  navigate('/', { replace: true });
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal isOpen={showChangePass} onClose={() => setShowChangePass(false)} />
    </header>
  );
};
