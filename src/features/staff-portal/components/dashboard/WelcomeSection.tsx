import React from 'react';
import { Sparkles, RotateCw, Calendar } from 'lucide-react';

interface WelcomeSectionProps {
  firstName: string;
  employeeCode: string;
  roleName: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  firstName,
  employeeCode,
  roleName,
  onRefresh,
  isRefreshing = false,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="p-7 sm:p-8 bg-gradient-to-r from-[#2818cf] via-indigo-600 to-indigo-800 text-white rounded-3xl shadow-xl shadow-[#2818cf]/15 relative overflow-hidden">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-32 h-32 bg-indigo-400/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold text-indigo-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" /> Staff Self-Service Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 font-semibold max-w-xl">
            Here's your work summary for today.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-200">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              {getFormattedDate()}
            </span>
            <span className="text-indigo-300 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
              {employeeCode} • {roleName}
            </span>
          </div>
        </div>

        {/* Refresh Button */}
        <div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-2xl text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
