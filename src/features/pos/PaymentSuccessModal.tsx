import React from 'react';
import { CheckCircle2, Printer, FileText, Download, Share2, PlusCircle } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  invoiceNumber: string;
  totalAmount: number;
  customerName?: string;
  paymentMethods: string[];
  onPrintThermal: () => void;
  onPrintA4: () => void;
  onDownloadPdf: () => void;
  onShareWhatsApp: () => void;
  onNewSale: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  invoiceNumber,
  totalAmount,
  customerName,
  paymentMethods,
  onPrintThermal,
  onPrintA4,
  onDownloadPdf,
  onShareWhatsApp,
  onNewSale,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 text-center animate-scale-up">
        {/* Animated Green Badge */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-50/60 shadow-sm animate-bounce-short">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Payment Confirmed
        </span>

        <h2 className="text-3xl font-black text-slate-900 mt-2">₹{totalAmount.toLocaleString('en-IN')}</h2>
        <p className="text-xs font-mono font-bold text-slate-600 mt-1">Invoice: {invoiceNumber}</p>

        {customerName && (
          <p className="text-xs text-slate-500 mt-0.5">Billed to: <span className="font-semibold text-slate-700">{customerName}</span></p>
        )}

        <div className="mt-3 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-600">
          <span className="font-semibold">Payment Mode:</span>
          <span className="font-bold text-slate-900 uppercase">{paymentMethods.join(' + ') || 'CASH'}</span>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            onClick={onPrintThermal}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Thermal Slip (80mm)</span>
          </button>

          <button
            onClick={onPrintA4}
            className="p-3 bg-[#2012ad] hover:bg-[#1a0e91] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Tax Invoice (A4)</span>
          </button>

          <button
            onClick={onDownloadPdf}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#2012ad]" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onShareWhatsApp}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Share</span>
          </button>
        </div>

        {/* Start New Bill Main CTA */}
        <button
          onClick={onNewSale}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Bill (F2)</span>
        </button>

        <p className="text-[10px] text-slate-400 mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">F2</kbd> or click to begin next customer checkout
        </p>
      </div>
    </div>
  );
};
