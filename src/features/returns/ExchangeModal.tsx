import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, ArrowLeftRight } from 'lucide-react';

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Variant {
  id: number;
  sku: string;
  product_name?: string;
  selling_price: number;
  current_stock: number;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [saleData, setSaleData] = useState<any>(null);

  const [returnedVariantId, setReturnedVariantId] = useState<number>(0);
  const [replacementSearch, setReplacementSearch] = useState<string>('');
  const [selectedReplacement, setSelectedReplacement] = useState<Variant | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadVariants();
    }
  }, [isOpen]);

  const loadVariants = async () => {
    try {
      if (window.api && window.api.variants) {
        const list = await window.api.variants.getAll();
        setVariants(list);
      }
    } catch (err) {
      console.error('Failed to load variants for exchange:', err);
    }
  };

  if (!isOpen) return null;

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.sales) {
        const sales = await window.api.sales.getAll();
        const found = sales.find((s: any) => s.invoice_number.toLowerCase() === invoiceNumber.trim().toLowerCase());

        if (!found) {
          setError(`Invoice "${invoiceNumber}" not found.`);
          setSaleData(null);
        } else {
          const details = await window.api.sales.getDetails(found.id);
          if (details.success && details.data) {
            setSaleData(details.data);
            if (details.data.items.length > 0) {
              setReturnedVariantId(details.data.items[0].product_variant_id);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invoice search error.');
    } finally {
      setLoading(false);
    }
  };

  const returnedItem = saleData?.items.find((it: any) => it.product_variant_id === returnedVariantId);
  const returnedPrice = returnedItem ? returnedItem.unit_price : 0;
  const replacementPrice = selectedReplacement ? selectedReplacement.selling_price : 0;
  const priceDifference = replacementPrice - returnedPrice;

  const handleCompleteExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleData || !returnedVariantId || !selectedReplacement) {
      setError('Please select returned item and replacement variant.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.exchanges) {
        const res = await window.api.exchanges.create({
          original_sale_id: saleData.sale.id,
          returned_variant_id: returnedVariantId,
          returned_quantity: 1,
          replacement_variant_id: selectedReplacement.id,
          replacement_quantity: 1,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to complete exchange.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Exchange error.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVariants = variants.filter((v) => {
    if (!replacementSearch.trim()) return false;
    const term = replacementSearch.toLowerCase();
    return v.sku.toLowerCase().includes(term) || (v.product_name && v.product_name.toLowerCase().includes(term));
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[88vh] animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2818cf]">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Product Exchange Wizard</h3>
              <p className="text-xs text-slate-500 font-medium">Swap original sold item for replacement product and handle price difference</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearchInvoice} className="flex gap-2 mb-4">
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Enter Invoice Number..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
            required
          />
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Find Invoice</button>
        </form>

        {saleData && (
          <form onSubmit={handleCompleteExchange} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Return Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Return Item</label>
                <select
                  value={returnedVariantId}
                  onChange={(e) => setReturnedVariantId(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                >
                  {saleData.items.map((it: any) => (
                    <option key={it.id} value={it.product_variant_id}>
                      {it.sku} (₹{it.unit_price})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs font-extrabold text-slate-900">Credit Value: ₹{returnedPrice}</p>
              </div>

              {/* Replacement Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Replacement Variant</label>
                <input
                  type="text"
                  value={replacementSearch}
                  onChange={(e) => setReplacementSearch(e.target.value)}
                  placeholder="Search SKU..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                />

                {filteredVariants.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-36 overflow-y-auto mt-1 divide-y divide-slate-100">
                    {filteredVariants.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setSelectedReplacement(v);
                          setReplacementSearch('');
                        }}
                        className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between text-xs"
                      >
                        <span className="font-bold">{v.sku}</span>
                        <span className="font-extrabold text-[#2818cf]">₹{v.selling_price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedReplacement && (
                  <div className="mt-2 text-xs font-extrabold text-[#2818cf]">
                    Selected: {selectedReplacement.sku} (₹{selectedReplacement.selling_price})
                  </div>
                )}
              </div>
            </div>

            {/* Price Difference Summary */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Price Difference</p>
                <p className="text-lg font-extrabold text-[#2818cf]">
                  {priceDifference > 0
                    ? `Customer Pays ₹${priceDifference}`
                    : priceDifference < 0
                    ? `Refund Customer ₹${Math.abs(priceDifference)}`
                    : 'Even Exchange (₹0)'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedReplacement}
                className="px-5 py-2.5 bg-[#2818cf] hover:bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2818cf]/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Exchange</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
