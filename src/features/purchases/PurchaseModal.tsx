import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, AlertCircle, Loader2, ShoppingBag } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Supplier {
  id: number;
  company_name: string;
}

interface Variant {
  id: number;
  sku: string;
  product_name?: string;
  size?: string;
  color?: string;
  cost_price?: number;
}

interface PurchaseCartItem {
  variantId: number;
  sku: string;
  productName: string;
  size?: string;
  color?: string;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  // Header inputs
  const [supplierId, setSupplierId] = useState<number>(0);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<PurchaseCartItem[]>([]);
  const [variantSearch, setVariantSearch] = useState<string>('');

  // Payment
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      if (window.api) {
        const [sups, vars] = await Promise.all([
          window.api.suppliers.getAll(),
          window.api.variants.getAll(),
        ]);
        setSuppliers(sups);
        setVariants(vars);
        if (sups.length > 0) setSupplierId(sups[0].id);
      }
    } catch (err) {
      console.error('Failed to load purchase wizard data:', err);
    }
  };

  if (!isOpen) return null;

  const handleAddVariantToCart = (v: Variant) => {
    const existingIndex = cart.findIndex((item) => item.variantId === v.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          variantId: v.id,
          sku: v.sku,
          productName: v.product_name || v.sku,
          size: v.size,
          color: v.color,
          quantity: 1,
          unitCost: v.cost_price || 500,
          discount: 0,
          tax: 0,
        },
      ]);
    }
    setVariantSearch('');
  };

  const handleUpdateItem = (index: number, field: string, val: number) => {
    const updated = [...cart];
    if (field === 'quantity') updated[index].quantity = Math.max(1, val);
    if (field === 'unitCost') updated[index].unitCost = Math.max(0, val);
    if (field === 'discount') updated[index].discount = Math.max(0, val);
    setCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const total = Math.max(0, subtotal - totalDiscount);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a Supplier.');
      return;
    }
    if (cart.length === 0) {
      setError('Please add at least one item to purchase cart.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (window.api && window.api.purchases) {
        const res = await window.api.purchases.create({
          supplier_id: supplierId,
          supplier_invoice_number: supplierInvoiceNumber.trim(),
          items: cart.map((item) => ({
            product_variant_id: item.variantId,
            quantity: item.quantity,
            unit_cost: item.unitCost,
            discount: item.discount,
            tax: item.tax,
          })),
          subtotal,
          discount: totalDiscount,
          tax: 0,
          total,
          paid_amount: paidAmount,
          payment_method: paymentMethod,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save purchase entry.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Purchase checkout error.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVariants = variants.filter((v) => {
    if (!variantSearch.trim()) return false;
    const term = variantSearch.toLowerCase();
    return (
      v.sku.toLowerCase().includes(term) ||
      (v.product_name && v.product_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[90vh] animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">New Purchase Inward Entry</h3>
              <p className="text-xs text-slate-500 font-medium">Record stock inward from supplier and automatically increase inventory stock</p>
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

        <form onSubmit={handleSubmitPurchase} className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Header Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier Invoice / Ref #</label>
              <input
                type="text"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                placeholder="e.g. TEX-2026-981"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Product Variant Search */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Search Products / Variants to Purchase</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="Type SKU or Product Name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            {filteredVariants.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
                {filteredVariants.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleAddVariantToCart(v)}
                    className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{v.sku}</span>
                      <span className="text-slate-500 ml-2">({v.product_name || 'Item'})</span>
                    </div>
                    <span className="font-extrabold text-[#2012ad]">Cost: ₹{v.cost_price || 500}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase sticky top-0">
                <tr>
                  <th className="p-2.5">Variant SKU</th>
                  <th className="p-2.5">Qty</th>
                  <th className="p-2.5">Unit Cost (₹)</th>
                  <th className="p-2.5">Discount (₹)</th>
                  <th className="p-2.5">Total (₹)</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Cart is empty. Search variants above to add items.</td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        {item.sku}
                        <div className="text-[10px] text-slate-400 font-normal">{item.productName}</div>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          value={item.unitCost}
                          onChange={(e) => handleUpdateItem(index, 'unitCost', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          value={item.discount}
                          onChange={(e) => handleUpdateItem(index, 'discount', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold"
                        />
                      </td>
                      <td className="p-2.5 font-extrabold text-[#2012ad]">
                        ₹{item.quantity * item.unitCost - item.discount}
                      </td>
                      <td className="p-2.5 text-right">
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Breakdown & Submit */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Paid Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-extrabold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT">CREDIT / PAYABLE</option>
                </select>
              </div>
            </div>

            <div className="text-right flex items-center gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Grand Total</p>
                <p className="text-xl font-extrabold text-[#2012ad]">₹{total}</p>
              </div>
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="px-5 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2012ad]/20 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Purchase</span>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
