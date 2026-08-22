import React, { useState } from 'react';
import { useStaffSettings } from '../hooks/useStaffSettings';
import {
  Sliders,
  Printer,
  Shield,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Save,
  Volume2,
  Search,
  Receipt,
  FileSpreadsheet,
  Lock,
  Cpu,
  Database,
  Check,
} from 'lucide-react';

export const StaffSettings: React.FC = () => {
  const {
    preferences,
    printers,
    versionInfo,
    loading,
    saving,
    testingPrint,
    error,
    successMessage,
    onUpdatePreferences,
    onTestPrint,
    onUpdatePassword,
    clearError,
    clearSuccess,
  } = useStaffSettings();

  const [activeTab, setActiveTab] = useState<'POS' | 'PRINTERS' | 'SECURITY' | 'ABOUT'>('POS');

  // Form states for POS
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('CASH');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [scanSoundEnabled, setScanSoundEnabled] = useState(true);
  const [autoFocusSearch, setAutoFocusSearch] = useState(true);
  const [receiptPrinter, setReceiptPrinter] = useState('EPSON TM-T82 Thermal');
  const [invoicePrinter, setInvoicePrinter] = useState('HP LaserJet Pro A4');

  // Form states for Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Sync loaded preferences
  React.useEffect(() => {
    if (preferences) {
      setDefaultPaymentMethod(preferences.defaultPaymentMethod);
      setAutoPrintReceipt(preferences.autoPrintReceipt);
      setScanSoundEnabled(preferences.scanSoundEnabled);
      setAutoFocusSearch(preferences.autoFocusSearch);
      setReceiptPrinter(preferences.receiptPrinter);
      setInvoicePrinter(preferences.invoicePrinter);
    }
  }, [preferences]);

  const handleSavePOS = () => {
    onUpdatePreferences({
      defaultPaymentMethod,
      autoPrintReceipt,
      scanSoundEnabled,
      autoFocusSearch,
      receiptPrinter,
      invoicePrinter,
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    if (!oldPassword) {
      setPwdError('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    try {
      await onUpdatePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Failed to update password.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Staff Portal & Hardware Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-semibold">
          Configure personal checkout defaults, slip and invoice printer hardware, security credentials, and terminal diagnostics
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs font-extrabold text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={clearSuccess} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-extrabold text-rose-700 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={clearError} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading banner */}
      {loading && (
        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs font-extrabold text-[#2012ad] flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 animate-spin" />
          <span>Loading staff hardware & portal preferences...</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center bg-white p-1.5 rounded-3xl border border-slate-200/80 shadow-xs gap-1 overflow-x-auto">
        {[
          { id: 'POS', label: 'POS & Billing Defaults', icon: Sliders },
          { id: 'PRINTERS', label: 'Printer Configuration', icon: Printer },
          { id: 'SECURITY', label: 'Security & Password', icon: Shield },
          { id: 'ABOUT', label: 'System & About', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#2012ad] text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: POS PREFERENCES */}
      {activeTab === 'POS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">POS Checkout Preferences</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Customize your point-of-sale scanning speed and payment workflows
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {/* Default Payment Mode */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-900 block">
                  Default Payment Mode
                </label>
                <p className="text-[11px] text-slate-400 font-medium">
                  Pre-selected tender method during checkout
                </p>
              </div>
              <select
                value={defaultPaymentMethod}
                onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              >
                <option value="CASH">Cash Tender (₹)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="SPLIT">Split Multi-Tender</option>
              </select>
            </div>

            {/* Auto-print Receipts */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block">
                    Auto-Print Thermal Receipt on Complete
                  </label>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Automatically trigger thermal slip printing upon successful sale completion
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                className="w-4 h-4 rounded text-[#2012ad] focus:ring-[#2012ad] border-slate-300"
              />
            </div>

            {/* Barcode Scan Audio Tone */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block">
                    Barcode Scanner Audio Feedback
                  </label>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Play confirmation audio beep on successful barcode scan
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={scanSoundEnabled}
                onChange={(e) => setScanSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#2012ad] focus:ring-[#2012ad] border-slate-300"
              />
            </div>

            {/* Auto Focus Search */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block">
                    Auto-Focus Product Barcode Input
                  </label>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Automatically focus the barcode input cursor when navigating to the POS screen
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoFocusSearch}
                onChange={(e) => setAutoFocusSearch(e.target.checked)}
                className="w-4 h-4 rounded text-[#2012ad] focus:ring-[#2012ad] border-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={handleSavePOS}
              className="px-6 py-2.5 bg-[#2012ad] hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-[#2012ad]/20 transition-all"
            >
              {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save POS Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PRINTER CONFIGURATION */}
      {activeTab === 'PRINTERS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Hardware Printer Setup</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Assign default hardware printers for customer receipts, tax invoices, and test hardware connectivity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receipt Printer */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#2012ad]" />
                    <span>80mm Thermal Receipt Printer</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ONLINE
                  </span>
                </div>
                <select
                  value={receiptPrinter}
                  onChange={(e) => setReceiptPrinter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#2012ad]"
                >
                  {printers.filter((p) => p.printerType === 'RECEIPT').map((p) => (
                    <option key={p.id} value={p.printerName}>
                      {p.printerName} ({p.paperWidth} {p.connectionType})
                    </option>
                  ))}
                  <option value="EPSON TM-T82 Thermal">EPSON TM-T82 Thermal (80mm ESC/POS)</option>
                  <option value="Star TSP100 Thermal">Star TSP100 Thermal (80mm)</option>
                  <option value="Default System Printer">Default System Printer</option>
                </select>

                <button
                  type="button"
                  disabled={testingPrint}
                  onClick={() => onTestPrint(receiptPrinter, 'RECEIPT')}
                  className="w-full py-2 bg-white border border-slate-200/80 hover:border-[#2012ad] text-slate-700 hover:text-[#2012ad] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send Test Print Receipt</span>
                </button>
              </div>

              {/* A4 Invoice Printer */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>A4 Tax Invoice Laser Printer</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    READY
                  </span>
                </div>
                <select
                  value={invoicePrinter}
                  onChange={(e) => setInvoicePrinter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#2012ad]"
                >
                  {printers.filter((p) => p.printerType === 'INVOICE').map((p) => (
                    <option key={p.id} value={p.printerName}>
                      {p.printerName} ({p.paperWidth} {p.connectionType})
                    </option>
                  ))}
                  <option value="HP LaserJet Pro A4">HP LaserJet Pro M404n (A4 Network)</option>
                  <option value="Canon LBP2900B">Canon Laser Shot LBP2900B</option>
                  <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                </select>

                <button
                  type="button"
                  disabled={testingPrint}
                  onClick={() => onTestPrint(invoicePrinter, 'INVOICE')}
                  className="w-full py-2 bg-white border border-slate-200/80 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send Test Print A4 Invoice</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePOS}
                className="px-6 py-2.5 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-[#2012ad]/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Hardware Printer Assignments</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORD */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 max-w-xl">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Change Account Password</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Ensure your account is protected with a secure password
            </p>
          </div>

          {pwdError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-extrabold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current login password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#2012ad] hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#2012ad]/20 transition-all"
              >
                {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SYSTEM & ABOUT */}
      {activeTab === 'ABOUT' && versionInfo && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-[#2012ad] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">
                TX
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{versionInfo.appName}</h3>
                <span className="text-xs font-extrabold text-[#2012ad] font-mono block">
                  Version {versionInfo.version} (Build {versionInfo.buildDate})
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {versionInfo.licenseStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Platform Architecture
                </span>
                <span className="text-xs font-black text-slate-900 font-mono flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#2012ad]" />
                  <span>{versionInfo.platform}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Electron v{versionInfo.electronVersion} • Node v{versionInfo.nodeVersion}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Local Database Engine
                </span>
                <span className="text-xs font-black text-slate-900 font-mono flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{versionInfo.databaseEngine}</span>
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Status: {versionInfo.databaseStatus}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffSettings;
