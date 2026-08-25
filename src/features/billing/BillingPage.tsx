import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Sparkles,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { PosRecommendationWidget } from '../../components/ai/recommendations/PosRecommendationWidget';
import { CustomerIntelligenceModal } from '../../components/ai/recommendations/CustomerIntelligenceModal';

interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
}

export const BillingPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([
    {
      variantId: 1,
      productId: 1,
      productName: 'Bridal Kanchipuram Pure Silk Saree',
      sku: 'SAR-KAN-001-RED-FS',
      price: 18999,
      quantity: 1,
    },
  ]);

  const [customerId, setCustomerId] = useState<number>(1); // Default to VIP patron Meenakshi
  const [showCustomerIntelligence, setShowCustomerIntelligence] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [billCompleted, setBillCompleted] = useState<boolean>(false);

  // Available quick add items
  const quickCatalog = [
    { variantId: 1, productId: 1, productName: 'Bridal Kanchipuram Pure Silk Saree', sku: 'SAR-KAN-001-RED-FS', price: 18999, category: 'Sarees' },
    { variantId: 2, productId: 2, productName: 'Soft Handloom Cotton Saree', sku: 'SAR-COT-002-BLU-FS', price: 2499, category: 'Sarees' },
    { variantId: 3, productId: 3, productName: 'Premium Egyptian Giza Cotton Shirt', sku: 'MSH-EGY-002-WHT-40', price: 2499, category: 'Men’s Wear' },
    { variantId: 4, productId: 4, productName: 'Traditional Raw Silk Men’s Kurta', sku: 'MKU-RAW-004-GLD-L', price: 3299, category: 'Men’s Wear' },
    { variantId: 101, productId: 101, productName: 'Matching Brocade Silk Blouse Piece', sku: 'ACC-BLU-001-RED-1M', price: 850, category: 'Dress Materials' },
    { variantId: 102, productId: 102, productName: 'Cotton Saree Shapewear / Petticoat', sku: 'ACC-PET-003-GLD-FS', price: 450, category: 'Accessories' },
  ];

  const handleAddToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === (item.variantId || item.id));
      if (existing) {
        return prev.map((i) =>
          i.variantId === (item.variantId || item.id)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          variantId: item.variantId || item.id,
          productId: item.productId || item.product_id || 1,
          productName: item.productName || item.product_name,
          sku: item.sku,
          price: item.price || item.selling_price || 999,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (variantId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.variantId === variantId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (variantId: number) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const netTotal = subtotal - discountAmount;
  const cartVariantIds = cart.map((i) => i.variantId);

  const handleCompleteSale = () => {
    setBillCompleted(true);
    setTimeout(() => {
      setBillCompleted(false);
      setCart([]);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Customer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#2012ad]" />
            <span>POS Billing Terminal</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcode scanning, live cart, and AI cross-sell assistant
          </p>
        </div>

        {/* Customer Selector & Intelligence Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <User className="w-4 h-4 text-[#2012ad] ml-1.5" />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-2"
            >
              <option value={1}>Meenakshi Sundaram (👑 VIP High-Value)</option>
              <option value={2}>Rajesh Kannan (🔄 Returning Regular)</option>
              <option value={3}>Walk-in Customer (🆕 New)</option>
            </select>
          </div>

          <button
            onClick={() => setShowCustomerIntelligence(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#2012ad] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/80"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Profile</span>
          </button>
        </div>
      </div>

      {/* Main POS Grid (Cart + Recommendations on Left, Summary on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Cart Table & Live Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Item Add / Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Scan barcode or type SKU (e.g. SAR-KAN-001)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 font-medium"
                />
              </div>
            </div>

            {/* Quick Catalog Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick Add:</span>
              {quickCatalog.map((item) => (
                <button
                  key={item.variantId}
                  onClick={() => handleAddToCart(item)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-[#2012ad] text-slate-700 text-xs font-bold transition-all shrink-0 flex items-center gap-1 border border-slate-200/60"
                >
                  <Plus className="w-3 h-3" />
                  <span>{item.productName} (₹{item.price})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Active Customer Bill ({cart.length} items)
              </h3>
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
              >
                Clear Cart
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">Bill is empty</p>
                <p>Scan a product barcode or select an item from quick add above</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {cart.map((item) => (
                  <div key={item.variantId} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-[280px]">
                      <h4 className="font-bold text-slate-900 leading-snug">{item.productName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{item.sku} • ₹{item.price?.toLocaleString()} each</p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Live Cross-Sell / Upsell Recommendations Drawer */}
          <PosRecommendationWidget
            cartVariantIds={cartVariantIds}
            customerId={customerId}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Right Side: Bill Summary & Checkout */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Payment & Checkout Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Gross Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Loyalty / Special Discount</span>
                <div className="flex items-center gap-1">
                  <select
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="p-1 rounded bg-slate-100 border border-slate-200 font-bold text-slate-900"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                  </select>
                  <span className="font-bold text-emerald-600">-₹{discountAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>GST (Inclusive)</span>
                <span className="font-bold text-slate-600">5.0%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">Net Amount Due</span>
              <span className="text-2xl font-black text-[#2012ad]">₹{netTotal.toLocaleString()}</span>
            </div>

            {/* Complete Sale Action */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || billCompleted}
              className={`w-full py-3.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                billCompleted
                  ? 'bg-emerald-600 text-white'
                  : cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#2012ad] to-[#4331e8] hover:from-[#1a0e90] hover:to-[#3826cb] text-white active:scale-98'
              }`}
            >
              {billCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bill Generated & Receipt Printed!</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Generate Bill & Thermal Print (₹{netTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Customer Intelligence Modal */}
      <CustomerIntelligenceModal
        customerId={customerId}
        isOpen={showCustomerIntelligence}
        onClose={() => setShowCustomerIntelligence(false)}
        onSelectProductToBill={handleAddToCart}
      />
    </div>
  );
};
