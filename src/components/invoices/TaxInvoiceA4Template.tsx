import React from 'react';

interface TaxInvoiceA4Props {
  invoiceData: any;
}

export const TaxInvoiceA4Template: React.FC<TaxInvoiceA4Props> = ({ invoiceData }) => {
  if (!invoiceData || !invoiceData.sale) return null;

  const {
    sale,
    items,
    payments,
    shopName,
    shopAddress,
    shopPhone,
    shopEmail,
    shopGst,
    amountInWords,
  } = invoiceData;

  const totalDiscount = sale.discount || 0;
  const taxAmount = sale.tax || 0;
  const cgstAmount = sale.cgst_amount || (taxAmount / 2);
  const sgstAmount = sale.sgst_amount || (taxAmount / 2);
  const roundOff = sale.round_off_amount || 0;
  const grandTotal = sale.total || 0;

  return (
    <div
      id="a4-tax-invoice-printable"
      className="w-full max-w-[800px] mx-auto bg-white p-8 border border-slate-300 shadow-sm rounded-xl text-slate-800 text-xs font-sans leading-normal"
    >
      {/* Top Header */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
        <div>
          <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded">
            TAX INVOICE
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-wide">
            {shopName || 'TEXORA TEXTILE HUB'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-sm">{shopAddress || '123 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012'}</p>
          <div className="flex gap-4 mt-1 text-slate-600 text-[11px] font-medium">
            <span>Ph: {shopPhone || '+91 98765 43210'}</span>
            <span>Email: {shopEmail || 'accounts@texora.shop'}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-extrabold text-slate-900">GSTIN: {shopGst || '33AAAAA0000A1Z5'}</span>
            <span className="text-slate-500 font-semibold">State Code: 33 (Tamil Nadu)</span>
          </div>
        </div>

        <div className="text-right border-l pl-6 border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase">INVOICE DETAILS</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{sale.invoice_number}</p>
          <p className="text-xs text-slate-600 mt-1">Date: <span className="font-bold text-slate-800">{new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
          <p className="text-xs text-slate-600">Time: <span className="font-bold text-slate-800">{new Date(sale.sale_date || sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></p>
          <p className="text-xs text-slate-600">Cashier: <span className="font-bold text-slate-800">{sale.cashier_name || 'Staff Terminal 1'}</span></p>
          <p className="text-[10px] text-slate-400 mt-2 italic">Original for Recipient</p>
        </div>
      </div>

      {/* Bill To / Consignee Section */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 bg-slate-50/60 p-3 rounded-lg mt-3">
        <div>
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">BILL TO (BUYER DETAILS)</p>
          <h3 className="text-sm font-bold text-slate-900 mt-1">{sale.customer_name || 'Walk-in Customer'}</h3>
          {sale.customer_phone && <p className="text-xs text-slate-600 mt-0.5">Phone: {sale.customer_phone}</p>}
          {sale.customer_address && <p className="text-xs text-slate-600 mt-0.5">{sale.customer_address}</p>}
          {sale.customer_gstin && <p className="text-xs font-bold text-indigo-900 mt-1">Buyer GSTIN: {sale.customer_gstin}</p>}
        </div>

        <div className="text-right">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">PAYMENT MODE & STATUS</p>
          <p className="text-xs font-bold text-slate-900 mt-1">Status: <span className="text-emerald-700 font-extrabold uppercase">{sale.status || 'PAID'}</span></p>
          <div className="mt-1 space-y-0.5">
            {payments && payments.length > 0 ? (
              payments.map((p: any, idx: number) => (
                <p key={idx} className="text-xs text-slate-700">
                  <span className="font-semibold">{p.payment_method}:</span> ₹{p.amount.toLocaleString('en-IN')} {p.reference_number ? `(${p.reference_number})` : ''}
                </p>
              ))
            ) : (
              <p className="text-xs text-slate-700">CASH: ₹{grandTotal.toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tax Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-300">
              <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
              <th className="p-2 border-r border-slate-300">Description of Goods</th>
              <th className="p-2 border-r border-slate-300 text-center w-16">HSN/SAC</th>
              <th className="p-2 border-r border-slate-300 text-center w-12">Qty</th>
              <th className="p-2 border-r border-slate-300 text-right w-16">Rate (₹)</th>
              <th className="p-2 border-r border-slate-300 text-right w-16">Disc (₹)</th>
              <th className="p-2 border-r border-slate-300 text-right w-20">Taxable (₹)</th>
              <th className="p-2 border-r border-slate-300 text-center w-12">GST %</th>
              <th className="p-2 text-right w-20">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item: any, i: number) => {
              const name = item.product_name || item.product_name_snapshot || 'Item';
              const sku = item.sku || item.sku_snapshot || '';
              const hsn = item.hsn_code_snapshot || '5208';
              const qty = item.quantity || 1;
              const rate = item.unit_price || 0;
              const disc = item.discount_amount || 0;
              const taxable = Math.max(0, (qty * rate) - disc);
              const taxRate = item.tax_rate || 5;
              const lineTotal = item.total || (taxable + (taxable * taxRate) / 100);

              return (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="p-2 border-r border-slate-300 text-center font-mono">{i + 1}</td>
                  <td className="p-2 border-r border-slate-300">
                    <p className="font-bold text-slate-900">{name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{sku} {item.color ? `• ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}</p>
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">{hsn}</td>
                  <td className="p-2 border-r border-slate-300 text-center font-bold">{qty}</td>
                  <td className="p-2 border-r border-slate-300 text-right">{rate.toFixed(2)}</td>
                  <td className="p-2 border-r border-slate-300 text-right">{disc > 0 ? disc.toFixed(2) : '-'}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-medium">{taxable.toFixed(2)}</td>
                  <td className="p-2 border-r border-slate-300 text-center">{taxRate}%</td>
                  <td className="p-2 text-right font-bold text-slate-900">{lineTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Matrix Section */}
      <div className="grid grid-cols-12 gap-4 mt-4 pt-3 border-t border-slate-200">
        <div className="col-span-7 space-y-2">
          {/* Amount in words */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase">AMOUNT CHARGEABLE IN WORDS:</p>
            <p className="text-xs font-black text-slate-900 mt-0.5">{amountInWords || 'Six Thousand and Ninety Rupees Only'}</p>
          </div>

          {/* GST Split Summary Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-1.5 border-r border-slate-200">Tax Type</th>
                  <th className="p-1.5 border-r border-slate-200 text-center">Rate</th>
                  <th className="p-1.5 text-right">Tax Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 border-r border-slate-200 font-semibold">Central GST (CGST)</td>
                  <td className="p-1.5 border-r border-slate-200 text-center">2.5%</td>
                  <td className="p-1.5 text-right">₹{cgstAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-1.5 border-r border-slate-200 font-semibold">State GST (SGST)</td>
                  <td className="p-1.5 border-r border-slate-200 text-center">2.5%</td>
                  <td className="p-1.5 text-right">₹{sgstAmount.toFixed(2)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-1.5 border-r border-slate-200">Total Tax Amount</td>
                  <td className="p-1.5 border-r border-slate-200 text-center">5.0%</td>
                  <td className="p-1.5 text-right">₹{taxAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-5 space-y-1.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-bold text-slate-900">₹{sale.subtotal?.toFixed(2)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200 text-rose-700 font-semibold">
              <span>Total Discount:</span>
              <span>-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">Total GST Tax (5%):</span>
            <span className="font-bold text-slate-900">+₹{taxAmount.toFixed(2)}</span>
          </div>

          {Math.abs(roundOff) > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
              <span>Round-off:</span>
              <span>{roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-t-2 border-slate-900 text-base font-black bg-slate-50 px-2 rounded-lg mt-2">
            <span className="text-slate-900 uppercase">GRAND TOTAL:</span>
            <span className="text-[#2012ad]">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Bank & Signature Footer */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-xs">
        <div>
          <p className="font-extrabold text-slate-900 uppercase text-[10px]">Bank Transfer Details:</p>
          <p className="text-slate-600 mt-0.5">Bank: <span className="font-bold text-slate-800">HDFC Bank Ltd, Gandhipuram</span></p>
          <p className="text-slate-600">A/C No: <span className="font-mono font-bold text-slate-800">50200084920193</span></p>
          <p className="text-slate-600">IFSC Code: <span className="font-mono font-bold text-slate-800">HDFC0001234</span></p>
        </div>

        <div className="text-right flex flex-col justify-between items-end">
          <p className="font-extrabold text-slate-900 text-[10px] uppercase">For {shopName || 'TEXORA TEXTILE HUB'}</p>
          <div className="pt-10">
            <p className="border-t border-slate-400 font-bold text-slate-800 px-6 inline-block">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
