import React from 'react';
import { StaffPOSInvoiceData } from '../../services/staffPOSService';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: StaffPOSInvoiceData | null;
}

export const POSReceiptModal: React.FC<POSReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Sale Completed</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Preview */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-slate-800 space-y-4 select-none print:m-0 print:border-none print:shadow-none">
          {/* Brand & Store Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <h3 className="text-sm font-black tracking-widest uppercase">TEXORA TEXTILES</h3>
            <p className="text-[10px] text-slate-500 font-sans">
              Main Store • 100 Feet Ring Road, Chennai
            </p>
            <p className="text-[10px] text-slate-400">GSTIN: 33AAAAA0000A1Z5</p>
          </div>

          {/* Invoice Meta */}
          <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{new Date(invoice.saleDate).toLocaleDateString('en-IN')} {new Date(invoice.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Staff:</span>
              <span>{invoice.staffName} ({invoice.staffCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span>{invoice.customerName}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Item</span>
              <span>Qty × Price</span>
              <span>Total</span>
            </div>

            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between items-baseline gap-2">
                <span className="truncate flex-1">{item.productName}</span>
                <span className="text-slate-500 shrink-0">
                  {item.quantity} × {item.unitPrice}
                </span>
                <span className="font-bold shrink-0">₹{item.total}</span>
              </div>
            ))}
          </div>

          {/* Totals & Payments */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">GST Tax:</span>
              <span>+₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200">
              <span>NET TOTAL:</span>
              <span>₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>Payment Mode ({invoice.paymentMethod}):</span>
              <span>₹{invoice.paidAmount.toLocaleString('en-IN')}</span>
            </div>
            {invoice.changeAmount > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                <span>Change Returned:</span>
                <span>₹{invoice.changeAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 space-y-0.5">
            <p>Thank you for shopping with us!</p>
            <p>Goods once sold can be exchanged within 7 days.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Done
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-2xl bg-[#2012ad] hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
