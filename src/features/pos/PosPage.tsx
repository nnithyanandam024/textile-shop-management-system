import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Trash2, Pause, AlertCircle, RefreshCw, Plus, Minus, Tag, UserPlus, Sparkles } from 'lucide-react';
import { PaymentModal, CheckoutPaymentEntry } from './PaymentModal';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { InvoiceModal } from './InvoiceModal';
import { BillingCalculationEngine, BillCalculationResult } from './billingCalculation';
import { InvoicePdfService } from '../../services/invoicePdfService';

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
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  taxRate: number;
}

interface Variant {
  id: number;
  product_id: number;
  product_name?: string;
  category_name?: string;
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
  total_purchases?: number;
  outstanding_balance?: number;
}

interface HeldCart {
  id: string;
  customerName: string;
  timestamp: string;
  items: CartItem[];
  billDiscountPercent: number;
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

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bill Discounts & Tax
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [defaultTaxRate] = useState<number>(5.0);

  // Modals & Completion States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);
  const [completedInvoiceNum, setCompletedInvoiceNum] = useState<string>('');
  const [completedGrandTotal, setCompletedGrandTotal] = useState<number>(0);
  const [completedPaymentMethods, setCompletedPaymentMethods] = useState<string[]>([]);
  const [completedInvoiceData, setCompletedInvoiceData] = useState<any>(null);
  const [invoiceTemplateType, setInvoiceTemplateType] = useState<'thermal' | 'a4'>('thermal');

  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Keyboard Shortcuts Listener (F2: Search, F4: Customer, F6/F9: Checkout, F8: Hold)
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
  }, [cart, billDiscountPercent]);

  const fetchMetadata = async () => {
    try {
      if (window.api) {
        const vList = await window.api.variants.getAll();
        const cList = await window.api.customers.getAll();
        setVariants(vList.filter((v: any) => v.is_active === 1));
        setCustomers(cList || []);
      }
    } catch (err) {
      console.error('Failed to load POS metadata:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.trim().toLowerCase();
    // Match exact barcode or SKU first
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
      setError(`Item '${variant.sku}' is out of stock.`);
      return;
    }

    setError('');
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.current_stock) {
          setError(`Cannot add more. Max warehouse stock for '${variant.sku}' is ${variant.current_stock}.`);
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
            discountType: 'FIXED',
            discountValue: 0,
            taxRate: defaultTaxRate,
          },
        ];
      }
    });
  };

  const updateQuantity = (variantId: number, delta: number) => {
    setError('');
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            if (newQty > item.availableStock) {
              setError(`Only ${item.availableStock} units available for ${item.sku}.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const updateItemDiscount = (variantId: number, discountVal: number) => {
    setCart((prev) =>
      prev.map((it) => (it.variantId === variantId ? { ...it, discountValue: Math.max(0, discountVal) } : it))
    );
  };

  const removeFromCart = (variantId: number) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscountPercent(0);
    setError('');
  };

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHold: HeldCart = {
      id: Date.now().toString(),
      customerName: cust ? cust.name : 'Walk-in Customer',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      billDiscountPercent,
    };
    setHeldCarts((prev) => [...prev, newHold]);
    setCart([]);
    setBillDiscountPercent(0);
  };

  const resumeHeldCart = (held: HeldCart) => {
    setCart(held.items);
    setBillDiscountPercent(held.billDiscountPercent || 0);
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
          await fetchMetadata();
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

  // Perform deterministic calculation using Centralized Calculation Engine
  const calculationResult: BillCalculationResult = BillingCalculationEngine.calculateBill({
    items: cart.map((i) => ({
      variantId: i.variantId,
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountType: i.discountType,
      discountValue: i.discountValue,
      taxRate: i.taxRate,
    })),
    billDiscountType: 'PERCENT',
    billDiscountValue: billDiscountPercent,
    defaultTaxRate,
  });

  const handleCompleteCheckout = async (payments: CheckoutPaymentEntry[], approvedBy?: number) => {
    if (cart.length === 0) return;

    if (window.api && window.api.sales) {
      const checkoutRequest = {
        customerId: selectedCustomerId || 0,
        calculationInput: {
          items: cart.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountType: i.discountType,
            discountValue: i.discountValue,
            taxRate: i.taxRate,
          })),
          billDiscountType: 'PERCENT' as const,
          billDiscountValue: billDiscountPercent,
          defaultTaxRate,
        },
        payments,
        approvedBy,
      };

      const res = await window.api.sales.checkout(checkoutRequest);

      if (res.success && res.saleId) {
        setShowPaymentModal(false);
        setCompletedSaleId(res.saleId);
        setCompletedInvoiceNum(res.invoiceNumber || 'INV-COMPLETED');
        setCompletedGrandTotal(res.grandTotal || calculationResult.grandTotal);
        setCompletedPaymentMethods(payments.map((p) => p.payment_method));

        // Fetch full invoice data for instant action triggers
        const invDetails = await window.api.sales.getDetails(res.saleId);
        if (invDetails.success) {
          setCompletedInvoiceData(invDetails.data);
        }

        setShowSuccessModal(true);
        clearCart();
        fetchMetadata(); // Refresh real-time stock
      } else {
        throw new Error(res.error || 'Checkout failed.');
      }
    }
  };

  // Trigger Thermal Print
  const handlePrintThermal = () => {
    setInvoiceTemplateType('thermal');
    setShowInvoiceModal(true);
  };

  // Trigger A4 Tax Invoice Print
  const handlePrintA4 = () => {
    setInvoiceTemplateType('a4');
    setShowInvoiceModal(true);
  };

  // Direct PDF Download
  const handleDownloadPdf = () => {
    if (completedInvoiceData) {
      InvoicePdfService.downloadInvoiceFile(completedInvoiceData, invoiceTemplateType);
    }
  };

  // Direct WhatsApp Share
  const handleShareWhatsApp = () => {
    if (completedInvoiceData) {
      InvoicePdfService.shareViaWhatsApp(completedInvoiceData);
    }
  };

  // Start New Bill
  const handleStartNewBill = () => {
    setShowSuccessModal(false);
    setShowInvoiceModal(false);
    clearCart();
    setSelectedCustomerId(0);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Filter products for live POS grid
  const filteredSearchVariants = variants.filter((v) => {
    const matchesCategory = selectedCategory === 'ALL' || v.category_name === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (v.product_name && v.product_name.toLowerCase().includes(term)) ||
      v.sku.toLowerCase().includes(term) ||
      (v.barcode && v.barcode.includes(term)) ||
      (v.color && v.color.toLowerCase().includes(term)) ||
      (v.size && v.size.toLowerCase().includes(term))
    );
  });

  const categoriesList = Array.from(new Set(variants.map((v) => v.category_name).filter(Boolean))) as string[];
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#2012ad]">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">POS Billing & Checkout Terminal</h1>
            <p className="text-[11px] text-slate-500 font-medium">Shortcuts: F2 (Search) • F4 (Customer) • F6 / F9 (Pay & Bill) • F8 (Hold)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {heldCarts.length > 0 && (
            <button
              onClick={() => setShowHeldModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Pause className="w-4 h-4 text-amber-600" />
              <span>{heldCarts.length} Held Bill(s)</span>
            </button>
          )}

          <button
            onClick={fetchMetadata}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Main Terminal Grid: Left (Catalog) + Right (Cart & Calculation) */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* LEFT PANEL: PRODUCT SEARCH & CATALOG (Col-span 7) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden">
          {/* Fast Search & Barcode Input */}
          <div className="flex gap-2 mb-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan Barcode or Search SKU / Product Name... (F2)"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              />
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-[#2012ad] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items ({variants.length})
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#2012ad] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredSearchVariants.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Search className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-xs font-semibold">No matching textile products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredSearchVariants.map((v) => {
                  const isOutOfStock = v.current_stock <= 0;
                  const isLowStock = v.current_stock > 0 && v.current_stock <= 5;

                  return (
                    <button
                      key={v.id}
                      onClick={() => addToCart(v)}
                      disabled={isOutOfStock}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                        isOutOfStock
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-[#2012ad] hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold text-slate-500">{v.sku}</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isOutOfStock ? 'OUT' : `${v.current_stock} left`}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-1 group-hover:text-[#2012ad]">
                          {v.product_name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {v.color ? `${v.color} ` : ''}{v.size ? `(${v.size})` : ''}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">₹{v.selling_price.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-bold text-indigo-700 group-hover:underline">+ Add</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CART, CUSTOMER & CALCULATION (Col-span 5) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden">
          {/* Customer Selection Bar */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-100">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer (F4)</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
              >
                <option value={0}>👤 Walk-in Retail Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="mt-4 p-2 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] rounded-xl border border-indigo-200 shrink-0"
              title="Add New Customer"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {selectedCustomer && selectedCustomer.id > 0 && (
            <div className="mb-2 p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">Total Spend: ₹{(selectedCustomer.total_purchases || 0).toLocaleString()}</span>
              {(selectedCustomer.outstanding_balance || 0) > 0 && (
                <span className="font-bold text-rose-700">Due: ₹{(selectedCustomer.outstanding_balance || 0).toLocaleString()}</span>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <ShoppingCart className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-xs font-semibold">Cart is currently empty</p>
                <p className="text-[11px] text-slate-400">Scan or select items on the left to start billing</p>
              </div>
            ) : (
              cart.map((item) => {
                const lineTotal = item.quantity * item.unitPrice - (item.discountValue || 0);

                return (
                  <div key={item.variantId} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{item.sku} {item.color ? `• ${item.color}` : ''}</span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.variantId, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Discount */}
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <input
                          type="number"
                          value={item.discountValue || ''}
                          onChange={(e) => updateItemDiscount(item.variantId, Number(e.target.value))}
                          placeholder="Disc ₹"
                          className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-right"
                        />
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">₹{lineTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary & Calculations Box */}
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal ({calculationResult.totalUnitsCount} units):</span>
              <span className="font-semibold text-slate-900">₹{calculationResult.subtotal.toFixed(2)}</span>
            </div>

            {/* Bill Discount Input */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1 text-slate-700">
                <span className="font-semibold">Bill Discount (%):</span>
                <select
                  value={billDiscountPercent}
                  onChange={(e) => setBillDiscountPercent(Number(e.target.value))}
                  className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                >
                  <option value={0}>0% (None)</option>
                  <option value={5}>5% (Cashier Limit)</option>
                  <option value={10}>10% (Manager)</option>
                  <option value={15}>15% (Special)</option>
                  <option value={20}>20% (Festive)</option>
                </select>
              </div>
              <span className="font-bold text-rose-600">-₹{calculationResult.totalDiscount.toFixed(2)}</span>
            </div>

            {/* Tax Breakdown */}
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>GST Tax (CGST 2.5% + SGST 2.5%):</span>
              <span className="font-semibold text-slate-900">+₹{calculationResult.totalTaxAmount.toFixed(2)}</span>
            </div>

            {Math.abs(calculationResult.roundOffAmount) > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round-off:</span>
                <span>{calculationResult.roundOffAmount >= 0 ? `+₹${calculationResult.roundOffAmount}` : `-₹${Math.abs(calculationResult.roundOffAmount)}`}</span>
              </div>
            )}

            {/* Grand Total Box */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">NET PAYABLE TOTAL</span>
                <p className="text-2xl font-black text-[#2012ad]">₹{calculationResult.grandTotal.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleHoldCart}
                  disabled={cart.length === 0}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-1"
                  title="Hold Cart (F8)"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Hold</span>
                </button>
              </div>
            </div>

            {/* Main Pay & Bill CTA Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[#2012ad] hover:bg-[#1a0e91] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-extrabold shadow-lg shadow-[#2012ad]/20 flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>PAY & GENERATE BILL (F6 / F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Payment Checkout Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        totalAmount={calculationResult.grandTotal}
        discountPercentage={billDiscountPercent}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleCompleteCheckout}
      />

      {/* MODAL 2: Payment Success Screen */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        invoiceNumber={completedInvoiceNum}
        totalAmount={completedGrandTotal}
        customerName={selectedCustomer?.name}
        paymentMethods={completedPaymentMethods}
        onPrintThermal={handlePrintThermal}
        onPrintA4={handlePrintA4}
        onDownloadPdf={handleDownloadPdf}
        onShareWhatsApp={handleShareWhatsApp}
        onNewSale={handleStartNewBill}
      />

      {/* MODAL 3: Full Dual Template Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        saleId={completedSaleId}
        initialTemplate={invoiceTemplateType}
        onClose={() => setShowInvoiceModal(false)}
        onNewSale={handleStartNewBill}
      />

      {/* MODAL 4: Quick Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Customer (F4)</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Senthil Kumar"
                  autoFocus
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#2012ad] text-white text-xs font-bold rounded-xl"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Held Carts List */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Resume Held Bills</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {heldCarts.map((held) => (
                <div key={held.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{held.customerName}</h4>
                    <p className="text-[10px] text-slate-500">{held.items.length} items • Held at {held.timestamp}</p>
                  </div>
                  <button
                    onClick={() => resumeHeldCart(held)}
                    className="px-3 py-1.5 bg-[#2012ad] text-white rounded-lg text-xs font-bold"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHeldModal(false)}
              className="w-full mt-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
