import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Database, ShieldCheck, User } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Header: React.FC = () => {
  const location = useLocation();
  const [dbStatus, setDbStatus] = useState<'online' | 'error' | 'checking'>('checking');
  const [version, setVersion] = useState<string>('0.1.0');

  useEffect(() => {
    if (window.api?.app) {
      window.api.app.getVersion().then(setVersion).catch(console.error);
    }
    if (window.api?.db) {
      window.api.db.checkStatus().then((res) => {
        setDbStatus(res.status);
      }).catch(() => setDbStatus('error'));
    }
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Business Dashboard';
      case '/billing': return 'Point of Sale (POS) Billing';
      case '/products': return 'Product & Variant Management';
      case '/inventory': return 'Inventory & Stock Control';
      case '/sales': return 'Sales Transactions';
      case '/customers': return 'Customer Directory';
      case '/suppliers': return 'Supplier Management';
      case '/purchases': return 'Purchase Orders';
      case '/returns': return 'Returns & Exchanges';
      case '/reports': return 'Reports & Analytics';
      case '/users': return 'User Access & Roles';
      case '/backup': return 'Database Backup & Restore';
      case '/settings': return 'System Settings';
      default: return 'Textile Shop Management';
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{getPageTitle(location.pathname)}</h2>
        <p className="text-xs text-slate-400">Textile Retail Management ERP</p>
      </div>

      <div className="flex items-center gap-4">
        {/* DB Status Badge */}
        <Badge variant={dbStatus === 'online' ? 'success' : dbStatus === 'error' ? 'danger' : 'warning'}>
          <Database className="w-3.5 h-3.5 mr-1.5" />
          {dbStatus === 'online' ? 'SQLite Connected' : dbStatus === 'error' ? 'DB Error' : 'Connecting DB...'}
        </Badge>

        {/* System Version */}
        <Badge variant="neutral">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
          v{version}
        </Badge>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">Admin User</p>
            <p className="text-[10px] text-slate-400">Owner Access</p>
          </div>
        </div>
      </div>
    </header>
  );
};
