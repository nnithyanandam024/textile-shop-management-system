import React from 'react';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Profile Header Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-200 shrink-0" />
        <div className="space-y-3 w-full text-center sm:text-left">
          <div className="h-6 bg-slate-200 rounded-lg w-48 mx-auto sm:mx-0" />
          <div className="h-4 bg-slate-100 rounded-lg w-36 mx-auto sm:mx-0" />
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <div className="h-5 bg-slate-200 rounded-full w-24" />
            <div className="h-5 bg-slate-200 rounded-full w-20" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-40" />
          <div className="space-y-3 pt-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-40" />
          <div className="space-y-3 pt-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
