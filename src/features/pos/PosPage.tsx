import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Barcode, Trash2, User, Pause, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { InvoiceModal } from './InvoiceModal';

interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  discount: number;
  tax: number;
}

interface Variant {
  id: number;
  product_id: number;
  product_name?: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  selling_price: number;
  current_stock: number;
  is_active: number;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
}

interface HeldCart {
  id: string;
  customerName: string;
  timestamp: string;
  items: CartItem[];
}

export const PosPage: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Customer Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bill Discounts & Tax
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [taxPercent] = useState<number>(5);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Keyboard Shortcuts Listener (F2, F4, F6, F8, F9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowAddCustomerModal(true);
      } else if (e.key === 'F6' || e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleHoldCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const fetchMetadata = async () => {
    try {
      if (window.api) {
        const vList = await window.api.variants.getAll();
        const cList = await window.api.customers.getAll();
        setVariants(vList.filter((v) => v.is_active === 1));
        setCustomers(cList);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.trim().toLowerCase();
    // Try exact Barcode or SKU match
    const exactMatch = variants.find(
      (v) => (v.barcode && v.barcode.toLowerCase() === term) || v.sku.toLowerCase() === term
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setSearchTerm('');
    }
  };

  const addToCart = (variant: Variant) => {
    if (variant.current_stock <= 0) {
      setError(`Item '${variant.sku}' is OUT OF STOCK.`);
      return;
    }

    setError('');
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.current_stock) {
          setError(`Cannot add more. Max stock for '${variant.sku}' is ${variant.current_stock}.`);
          return prev;
        }
        return prev.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            variantId: variant.id,
            productId: variant.product_id,
            productName: variant.product_name || 'Textile Item',
            sku: variant.sku,
            barcode: variant.barcode,
            color: variant.color,
            size: variant.size,
            unitPrice: variant.selling_price,
            quantity: 1,
            availableStock: variant.current_stock,
            discount: 0,
            tax: 0,
          },
        ];
      }
    });
  };

  const updateQuantity = (variantId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            if (newQty > item.availableStock) {
              setError(`Only ${item.availableStock} units available.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (variantId: number) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscount(0);
    setError('');
  };

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHold: HeldCart = {
      id: Date.now().toString(),
      customerName: cust ? cust.name : 'Walk-in Customer',
      timestamp: new Date().toLocaleTimeString(),
      items: [...cart],
    };
    setHeldCarts((prev) => [...prev, newHold]);
    setCart([]);
  };

  const resumeHeldCart = (held: HeldCart) => {
    setCart(held.items);
    setHeldCarts((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeldModal(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      if (window.api && window.api.customers) {
        const res = await window.api.customers.create({ name: newCustName.trim(), phone: newCustPhone.trim() });
        if (res.success && res.id) {
          fetchMetadata();
          setSelectedCustomerId(res.id);
          setNewCustName('');
          setNewCustPhone('');
          setShowAddCustomerModal(false);
        }
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = Math.round(((subtotal - billDiscount) * taxPercent) / 100);
  const finalTotal = Math.max(0, subtotal - billDiscount + taxAmount);

  const filteredSearchVariants = variants.filter((v) => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      (v.product_name && v.product_name.toLowerCase().includes(term)) ||
      v.sku.toLowerCase().includes(term) ||
      (v.barcode && v.barcode.includes(term)) ||
      (v.color && v.color.toLowerCase().includes(term)) ||
      (v.size && v.size.toLowerCase().includes(term))
    );
  });

  const handleCompleteCheckout = async (payments: any[]) => {
    if (cart.length === 0) return;

    if (window.api && window.api.sales) {
      const res = await window.api.sales.create({
        customer_id: selectedCustomerId || undefined,
        items: cart.map((i) => ({
          product_variant_id: i.variantId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          discount: i.discount,
        })),
        payments,
        subtotal,
        discount: billDiscount,
        tax: taxAmount,
        total: finalTotal,
      });

      if (res.success && res.saleId) {
        setShowPaymentModal(false);
        setCompletedSaleId(res.saleId);
        setShowInvoiceModal(true);
        fetchMetadata(); // Refresh stock
      } else {
        throw new Error(res.error || 'Checkout failed.');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad]">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">POS Billing Terminal</h1>
            <p className="text-[11px] text-slate-500 font-medium">Shortcuts: F2 (Search) | F4 (Customer) | F6 / F9 (Pay) | F8 (Hold)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {heldCarts.length > 0 && (
            <button
              onClick={() => setShowHeldModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Pause className="w-4 h-4" />
              <span>{heldCarts.length} Held Cart(s)</span>
            </button>
          )}

          <button
            onClick={fetchMetadata}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200"
            title="Refresh Products"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 font-bold">×</button>
        </div>
      )}

      {/* Main 2-Column POS Workspace */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Product Search & Variant Results */}
        <div className="w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 min-h-0 overflow-hidden">
          {/* Barcode Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Scan Barcode or Search Product / SKU... (F2)"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              autoFocus
            />
            <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Variants Search Results List */}
          <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-xl p-2 custom-scrollbar">
            {searchTerm.trim() === '' ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                <Barcode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span>Scan barcode or type product name to list matching variants</span>
              </div>
            ) : filteredSearchVariants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No active variants matching "{searchTerm}"
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredSearchVariants.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => addToCart(v)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2012ad]">{v.product_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {v.sku} ({v.color} / {v.size})
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">₹{v.selling_price}</div>
                      <div className={`text-[11px] font-bold ${v.current_stock <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {v.current_stock <= 0 ? 'Out of Stock' : `${v.current_stock} in stock`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Cart, Customer & Summary */}
        <div className="w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 min-h-0 overflow-hidden">
          {/* Customer Selection Row */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3 shrink-0">
            <div className="flex items-center gap-2 flex-1">
              <User className="w-4 h-4 text-slate-500" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none flex-1"
              >
                <option value={0}>Walk-in Customer (Default)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#2012ad] transition-all"
            >
              + New (F4)
            </button>
          </div>

          {/* Cart Items Grid */}
          <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-xl mb-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span>Cart is empty. Add products from search column.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5">Price</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <tr key={item.variantId} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-900">
                        <div>{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{item.sku} ({item.color}/{item.size})</div>
                      </td>
                      <td className="p-2.5 font-medium">₹{item.unitPrice}</td>
                      <td className="p-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.variantId, -1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-900 min-w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, 1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-slate-900">
                        ₹{item.quantity * item.unitPrice}
                      </td>
                      <td className="p-2.5 text-center">
                        <button onClick={() => removeFromCart(item.variantId)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary & Checkout Controls */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 shrink-0 text-xs">
            <div className="flex justify-between font-semibold text-slate-600">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Discount (₹):</span>
              <input
                type="number"
                value={billDiscount}
                onChange={(e) => setBillDiscount(Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-0.5 bg-white border border-slate-200 rounded text-right font-bold"
              />
            </div>

            <div className="flex justify-between font-semibold text-slate-600">
              <span>Tax ({taxPercent}%):</span>
              <span>+₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>FINAL TOTAL:</span>
              <span className="text-[#2012ad]">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleHoldCart}
                disabled={cart.length === 0}
                className="w-1/4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold transition-all text-xs"
              >
                Hold (F8)
              </button>
              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-1/4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-xs"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="w-1/2 py-2.5 bg-[#2012ad] hover:bg-[#1a0e91] text-white rounded-xl font-bold shadow-lg shadow-[#2012ad]/20 transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>PAY (F6 / F9)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        totalAmount={finalTotal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleCompleteCheckout}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        saleId={completedSaleId}
        onClose={() => setShowInvoiceModal(false)}
        onNewSale={() => {
          clearCart();
          setShowInvoiceModal(false);
        }}
      />

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 mb-3">Quick Add Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="w-1/2 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-2 bg-[#2012ad] text-white text-xs font-bold rounded-xl shadow-md">Save & Select</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Held Carts Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pending Held Carts</h3>
              <button onClick={() => setShowHeldModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {heldCarts.map((h) => (
                <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{h.customerName}</h4>
                    <p className="text-[10px] text-slate-500">{h.timestamp} — {h.items.length} item(s)</p>
                  </div>
                  <button
                    onClick={() => resumeHeldCart(h)}
                    className="px-3 py-1.5 bg-[#2012ad] text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
