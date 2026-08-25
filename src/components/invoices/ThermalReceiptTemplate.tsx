import React from 'react';

interface ThermalReceiptProps {
  invoiceData: any;
}

export const ThermalReceiptTemplate: React.FC<ThermalReceiptProps> = ({ invoiceData }) => {
  if (!invoiceData || !invoiceData.sale) return null;

  const { sale, items, payments, shopName, shopAddress, shopPhone, shopGst } = invoiceData;

  const totalDiscount = sale.discount || 0;
  const taxAmount = sale.tax || 0;
  const roundOff = sale.round_off_amount || 0;
  const grandTotal = sale.total || 0;

  return (
    <div
      id="thermal-receipt-printable"
      className="w-full max-w-[320px] mx-auto bg-white p-4 font-mono text-[11px] text-black leading-tight select-none border border-dashed border-slate-300 rounded-lg"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Shop Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="text-base font-black uppercase tracking-wider">{shopName || 'TEXORA TEXTILE HUB'}</h2>
        <p className="text-[10px] mt-0.5">{shopAddress || '123 Cross Cut Rd, Coimbatore, TN'}</p>
        <p className="text-[10px]">Ph: {shopPhone || '+91 98765 43210'}</p>
        <p className="text-[10px] font-bold">GSTIN: {shopGst || '33AAAAA0000A1Z5'}</p>
      </div>

      {/* Invoice Meta */}
      <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span className="font-bold">Bill No: {sale.invoice_number}</span>
          <span>{new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span>Time: {new Date(sale.sale_date || sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Cashier: {sale.cashier_name || 'Counter-1'}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Customer: {sale.customer_name || 'Walk-in'}</span>
          <span>{sale.customer_phone || ''}</span>
        </div>
      </div>

      {/* Items Table Header */}
      <div className="py-1 border-b border-dashed border-black text-[10px] font-bold flex justify-between uppercase">
        <span className="w-1/2">Item</span>
        <span className="w-1/6 text-center">Qty</span>
        <span className="w-1/6 text-right">Rate</span>
        <span className="w-1/6 text-right">Amt</span>
      </div>

      {/* Items List */}
      <div className="py-1 border-b border-dashed border-black space-y-1.5 text-[10px]">
        {items.map((item: any, i: number) => {
          const name = item.product_name || item.product_name_snapshot || 'Item';
          const sku = item.sku || item.sku_snapshot || '';
          const qty = item.quantity || 1;
          const rate = item.unit_price || 0;
          const lineTotal = item.total || (qty * rate);

          return (
            <div key={i}>
              <div className="flex justify-between font-bold">
                <span className="w-1/2 truncate">{name}</span>
                <span className="w-1/6 text-center">{qty}</span>
                <span className="w-1/6 text-right">{rate.toFixed(0)}</span>
                <span className="w-1/6 text-right">{lineTotal.toFixed(0)}</span>
              </div>
              <div className="text-[9px] text-slate-600 flex justify-between">
                <span>{sku} {item.color ? `| ${item.color}` : ''} {item.size ? `(${item.size})` : ''}</span>
                {item.discount_amount > 0 && <span>Disc: -₹{item.discount_amount}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculation Breakdown */}
      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Total Units: {items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)}</span>
          <span>Subtotal: ₹{sale.subtotal?.toFixed(2)}</span>
        </div>

        {totalDiscount > 0 && (
          <div className="flex justify-between font-bold">
            <span>Discount:</span>
            <span>-₹{totalDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>GST Tax (5%):</span>
          <span>+₹{taxAmount.toFixed(2)}</span>
        </div>

        {Math.abs(roundOff) > 0 && (
          <div className="flex justify-between text-[9px]">
            <span>Round-off:</span>
            <span>{roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-black">
          <span>NET PAYABLE:</span>
          <span>₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="font-bold uppercase">Payment Breakdown:</div>
        {payments && payments.length > 0 ? (
          payments.map((p: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span>• {p.payment_method} {p.reference_number ? `(${p.reference_number})` : ''}:</span>
              <span className="font-bold">₹{p.amount.toLocaleString('en-IN')}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between">
            <span>• CASH:</span>
            <span className="font-bold">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Receipt Footer */}
      <div className="text-center pt-3 text-[9px] space-y-1">
        <p className="font-bold">Exchange allowed within 7 days with bill.</p>
        <p>No exchange on altered goods & sarees with cut blouse.</p>
        <p className="text-[10px] font-extrabold mt-1">*** THANK YOU! VISIT AGAIN ***</p>
      </div>
    </div>
  );
};
