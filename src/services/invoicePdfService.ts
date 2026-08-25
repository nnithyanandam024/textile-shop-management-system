export class InvoicePdfService {
  /**
   * Triggers browser / Electron native print dialog
   */
  public static printDocument(_elementId?: string): void {
    window.print();
  }

  /**
   * Generates a downloadable text/HTML snapshot invoice file
   */
  public static downloadInvoiceFile(invoiceData: any, templateType: 'thermal' | 'a4' = 'a4'): void {
    if (!invoiceData || !invoiceData.sale) return;

    const invoiceNo = invoiceData.sale.invoice_number || 'INV-UNKNOWN';
    const filename = `${invoiceNo}_${templateType.toUpperCase()}.html`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoiceNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="bg-slate-100 p-8 flex flex-col items-center">
        <div class="no-print mb-4 flex gap-4">
          <button onclick="window.print()" class="px-6 py-2 bg-indigo-700 text-white font-bold rounded-lg shadow">Print Document</button>
        </div>
        <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl">
          <div class="border-b pb-4 flex justify-between">
            <div>
              <h1 class="text-2xl font-black">${invoiceData.shopName || 'TEXORA TEXTILE HUB'}</h1>
              <p class="text-sm text-slate-500">${invoiceData.shopAddress || ''}</p>
              <p class="text-sm text-slate-500">GSTIN: ${invoiceData.shopGst || ''}</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold">${invoiceNo}</h2>
              <p class="text-sm text-slate-500">${new Date(invoiceData.sale.sale_date || invoiceData.sale.created_at).toLocaleString()}</p>
              <p class="text-sm font-bold text-emerald-600">${invoiceData.sale.status}</p>
            </div>
          </div>
          <div class="my-6">
            <h3 class="font-bold text-slate-700 mb-2">Customer: ${invoiceData.sale.customer_name || 'Walk-in'}</h3>
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b">
                  <th class="py-2">Item</th>
                  <th class="py-2 text-center">Qty</th>
                  <th class="py-2 text-right">Price</th>
                  <th class="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${invoiceData.items.map((it: any) => `
                  <tr>
                    <td class="py-2"><b>${it.product_name || it.product_name_snapshot}</b> (${it.sku || it.sku_snapshot})</td>
                    <td class="py-2 text-center">${it.quantity}</td>
                    <td class="py-2 text-right">₹${Number(it.unit_price).toFixed(2)}</td>
                    <td class="py-2 text-right font-bold">₹${Number(it.total).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="border-t pt-4 text-right space-y-1">
            <p>Subtotal: ₹${Number(invoiceData.sale.subtotal).toFixed(2)}</p>
            ${invoiceData.sale.discount > 0 ? `<p class="text-rose-600 font-bold">Discount: -₹${Number(invoiceData.sale.discount).toFixed(2)}</p>` : ''}
            <p>GST Tax: ₹${Number(invoiceData.sale.tax).toFixed(2)}</p>
            <p class="text-xl font-black text-indigo-900 mt-2">Grand Total: ₹${Number(invoiceData.sale.total).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Formats a clean WhatsApp share message
   */
  public static shareViaWhatsApp(invoiceData: any): void {
    if (!invoiceData || !invoiceData.sale) return;

    const { sale, items, shopName, shopPhone } = invoiceData;
    const invNo = sale.invoice_number;
    const total = sale.total?.toLocaleString('en-IN');
    const custName = sale.customer_name || 'Valued Customer';
    const dateStr = new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-IN');

    let text = `🧾 *INVOICE FROM ${shopName.toUpperCase()}*\n`;
    text += `📅 Date: ${dateStr}\n`;
    text += `🔢 Invoice: *${invNo}*\n`;
    text += `👤 Customer: ${custName}\n\n`;
    text += `*ITEMS PURCHASED:*\n`;

    items.forEach((item: any, i: number) => {
      const name = item.product_name || item.product_name_snapshot;
      text += `${i + 1}. ${name} (${item.quantity}x) — ₹${item.total}\n`;
    });

    text += `\n💰 *Total Amount: ₹${total}*\n`;
    text += `✅ Status: ${sale.status}\n\n`;
    text += `Thank you for shopping with us! For enquiries call ${shopPhone}.`;

    const encodedText = encodeURIComponent(text);
    const phone = sale.customer_phone ? sale.customer_phone.replace(/[^0-9]/g, '') : '';

    const waUrl = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank');
  }
}
