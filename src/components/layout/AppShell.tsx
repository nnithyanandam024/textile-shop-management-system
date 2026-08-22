import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9fafc] text-slate-800 print:block print:overflow-visible print:h-auto print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:block print:overflow-visible print:h-auto">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-8 bg-grid-pattern print:p-0 print:overflow-visible print:bg-white print:h-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
