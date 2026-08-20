import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Welcome Banner Skeleton */}
      <div className="p-8 bg-slate-200/80 rounded-3xl h-32 w-full" />

      {/* Top 3 Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-56 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-10 bg-slate-100 rounded-xl mt-4" />
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-56 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-10 bg-slate-100 rounded-xl mt-4" />
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-56 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-10 bg-slate-100 rounded-xl mt-4" />
        </div>
      </div>

      {/* Document Status Bar Skeleton */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 h-40 space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded-full w-full" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="h-24 bg-white border border-slate-200 rounded-2xl p-4" />
        <div className="h-24 bg-white border border-slate-200 rounded-2xl p-4" />
        <div className="h-24 bg-white border border-slate-200 rounded-2xl p-4" />
        <div className="h-24 bg-white border border-slate-200 rounded-2xl p-4" />
      </div>

      {/* 2 Column Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-64" />
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-64" />
      </div>
    </div>
  );
};
