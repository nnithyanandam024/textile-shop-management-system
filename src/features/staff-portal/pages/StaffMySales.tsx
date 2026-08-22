import React, { useState } from 'react';
import { MySalesDashboard } from '../components/pos/MySalesDashboard';
import { POSReceiptModal } from '../components/pos/POSReceiptModal';
import { staffPOSService, StaffPOSInvoiceData } from '../services/staffPOSService';
import { TrendingUp } from 'lucide-react';

export const StaffMySales: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<StaffPOSInvoiceData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleOpenReceipt = async (saleId: number) => {
    try {
      const inv = await staffPOSService.getSaleInvoice(saleId);
      setSelectedInvoice(inv);
      setIsReceiptOpen(true);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2818cf] flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">My Sales & Commissions</h2>
          <p className="text-xs text-slate-400 font-semibold">
            Track your floor sales volume, order conversion, and monthly incentive commissions
          </p>
        </div>
      </div>

      {/* Dashboard View */}
      <MySalesDashboard onOpenReceipt={handleOpenReceipt} />

      {/* Invoice / Receipt Modal */}
      <POSReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
