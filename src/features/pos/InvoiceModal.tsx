import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Share2, PlusCircle, RefreshCw, FileText, Receipt } from 'lucide-react';
import { ThermalReceiptTemplate } from '../../components/invoices/ThermalReceiptTemplate';
import { TaxInvoiceA4Template } from '../../components/invoices/TaxInvoiceA4Template';
import { InvoicePdfService } from '../../services/invoicePdfService';

interface InvoiceModalProps {
  isOpen: boolean;
  saleId: number | null;
  initialTemplate?: 'thermal' | 'a4';
  onClose: () => void;
  onNewSale: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  saleId,
  initialTemplate = 'thermal',
  onClose,
  onNewSale,
}) => {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [templateType, setTemplateType] = useState<'thermal' | 'a4'>(initialTemplate);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchInvoice();
      setTemplateType(initialTemplate);
    }
  }, [isOpen, saleId, initialTemplate]);

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
    InvoicePdfService.printDocument(templateType === 'thermal' ? 'thermal-receipt-printable' : 'a4-tax-invoice-printable');
  };

  const handleDownload = () => {
    InvoicePdfService.downloadInvoiceFile(invoiceData, templateType);
  };

  const handleShare = () => {
    InvoicePdfService.shareViaWhatsApp(invoiceData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[95vh] animate-scale-up">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Document Preview:</span>
            {invoiceData?.sale && (
              <span className="px-2.5 py-0.5 bg-indigo-50 text-[#2012ad] text-xs font-mono font-bold rounded-lg border border-indigo-200">
                {invoiceData.sale.invoice_number}
              </span>
            )}
          </div>

          {/* Template Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTemplateType('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                templateType === 'thermal'
                  ? 'bg-white text-[#2012ad] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Slip (80mm)</span>
            </button>

            <button
              onClick={() => setTemplateType('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                templateType === 'a4'
                  ? 'bg-white text-[#2012ad] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GST Tax Invoice (A4)</span>
            </button>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2012ad] mx-auto mb-2" />
            <span className="text-xs font-semibold">Rendering high-precision invoice...</span>
          </div>
        ) : !invoiceData ? (
          <div className="p-12 text-center text-red-600 text-xs font-bold">
            Failed to load invoice details.
          </div>
        ) : (
          <>
            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-y-auto pr-1 p-4 bg-slate-100/60 rounded-2xl border border-slate-200 flex justify-center">
              {templateType === 'thermal' ? (
                <ThermalReceiptTemplate invoiceData={invoiceData} />
              ) : (
                <TaxInvoiceA4Template invoiceData={invoiceData} />
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print {templateType === 'thermal' ? 'Receipt' : 'A4 Invoice'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-[#2012ad]" />
                  <span>Download Document</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Share</span>
                </button>
              </div>

              <button
                onClick={onNewSale}
                className="px-5 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-[#2012ad]/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Next Customer (F2)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
