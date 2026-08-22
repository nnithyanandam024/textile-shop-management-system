import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2, RefreshCw } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  saleId: number | null;
  onClose: () => void;
  onNewSale: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  saleId,
  onClose,
  onNewSale,
}) => {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchInvoice();
    }
  }, [isOpen, saleId]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.sales) {
        const res = await window.api.sales.getDetails(saleId!);
        if (res.success) {
          setInvoiceData(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !saleId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[90vh] animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 print:hidden">
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-xs font-medium">Generating invoice receipt...</span>
          </div>
        ) : !invoiceData ? (
          <div className="p-8 text-center text-red-600 text-xs font-bold">
            Failed to load invoice details.
          </div>
        ) : (
          <>
            {/* Printable Receipt Layout */}
            <div id="printable-invoice" className="flex-1 overflow-y-auto pr-1 p-4 border border-slate-200 rounded-xl bg-white text-slate-800 space-y-4">
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">{invoiceData.shopName}</h2>
                <p className="text-xs text-slate-500">{invoiceData.shopAddress}</p>
                <p className="text-xs text-slate-500">Ph: {invoiceData.shopPhone} | GSTIN: {invoiceData.shopGst}</p>
              </div>

              {/* Invoice Meta */}
              <div className="flex justify-between text-xs font-medium pb-2 border-b border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Invoice: {invoiceData.sale.invoice_number}</p>
                  <p className="text-slate-500">Date: {new Date(invoiceData.sale.sale_date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">Customer: {invoiceData.sale.customer_name || 'Walk-in Customer'}</p>
                  <p className="text-slate-500">Status: {invoiceData.sale.status}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 font-bold uppercase text-slate-600">
                    <th className="py-1.5">Item</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Price</th>
                    <th className="py-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceData.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2">
                        <div className="font-bold text-slate-900">{item.product_name || 'Item'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.sku} ({item.color}/{item.size})</div>
                      </td>
                      <td className="py-2 text-center font-semibold">{item.quantity}</td>
                      <td className="py-2 text-right font-medium">₹{item.unit_price}</td>
                      <td className="py-2 text-right font-bold text-slate-900">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-xs font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{invoiceData.sale.subtotal}</span>
                </div>
                {invoiceData.sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{invoiceData.sale.discount}</span>
                  </div>
                )}
                {invoiceData.sale.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / GST</span>
                    <span>+₹{invoiceData.sale.tax}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                  <span>GRAND TOTAL</span>
                  <span className="text-[#2012ad]">₹{invoiceData.sale.total}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-2 text-[11px] font-semibold text-slate-600 border-t border-slate-200">
                <span>Paid via: </span>
                {invoiceData.payments.map((p: any, i: number) => (
                  <span key={i} className="mr-2 underline">
                    {p.payment_method} (₹{p.amount})
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[10px] text-slate-400 border-t border-slate-100">
                Thank you for shopping with us! Standard exchange policy applies within 7 days.
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex gap-3 pt-4 print:hidden">
              <button
                onClick={handlePrint}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => {
                  onNewSale();
                  onClose();
                }}
                className="w-1/2 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Start New Sale</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
