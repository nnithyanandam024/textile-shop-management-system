import React from 'react';
import { useStaffPOS } from '../hooks/useStaffPOS';
import { POSProductSearch } from '../components/pos/POSProductSearch';
import { POSProductGrid } from '../components/pos/POSProductGrid';
import { POSCart } from '../components/pos/POSCart';
import { POSCustomerSelector } from '../components/pos/POSCustomerSelector';
import { POSCustomerModal } from '../components/pos/POSCustomerModal';
import { POSDiscountPanel } from '../components/pos/POSDiscountPanel';
import { POSCartSummary } from '../components/pos/POSCartSummary';
import { POSPaymentModal } from '../components/pos/POSPaymentModal';
import { POSHeldSalesModal } from '../components/pos/POSHeldSalesModal';
import { POSReceiptModal } from '../components/pos/POSReceiptModal';
import { POSReturnModal } from '../components/pos/POSReturnModal';
import { ShoppingCart, RotateCcw, AlertCircle, CheckCircle2, Layers } from 'lucide-react';

export const StaffPOS: React.FC = () => {
  const {
    searchQuery,
    products,
    loadingProducts,
    cart,
    discountType,
    discountValue,
    customers,
    selectedCustomer,
    customerHistory,
    heldSales,
    subtotal,
    totalDiscount,
    totalTax,
    totalPayable,
    activeInvoice,
    isCustomerModalOpen,
    isPaymentModalOpen,
    isHeldSalesModalOpen,
    isReceiptModalOpen,
    isReturnModalOpen,
    error,
    successMessage,
    setDiscountType,
    setDiscountValue,
    setIsCustomerModalOpen,
    setIsPaymentModalOpen,
    setIsHeldSalesModalOpen,
    setIsReceiptModalOpen,
    setIsReturnModalOpen,
    onSearch,
    onAddToCart,
    onUpdateQuantity,
    onRemoveItem,
    onClearCart,
    onSelectCustomer,
    onQuickCreateCustomer,
    onHoldSale,
    onResumeSale,
    onCancelHeldSale,
    onCheckout,
    onProcessReturn,
    clearError,
    clearSuccess,
    refresh,
  } = useStaffPOS();

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Point of Sale (POS)</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Live textile billing counter • Fast barcode scanning & multi-tender checkout
            </p>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex items-center gap-2.5">
          {heldSales.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHeldSalesModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-4 h-4 text-amber-600" />
              <span>{heldSales.length} Held Carts</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReturnModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Sales Return</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-extrabold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={clearError} className="text-rose-500 hover:text-rose-800 text-sm">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs font-extrabold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={clearSuccess} className="text-emerald-500 hover:text-emerald-800 text-sm">
            ×
          </button>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Search & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <POSProductSearch
            query={searchQuery}
            onSearchChange={onSearch}
            onRefresh={refresh}
            searching={loadingProducts}
          />

          <POSProductGrid
            products={products}
            onAddToCart={onAddToCart}
            loading={loadingProducts}
          />
        </div>

        {/* Right Column: Customer + Cart + Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <POSCustomerSelector
            customers={customers}
            selectedCustomer={selectedCustomer}
            customerHistory={customerHistory}
            onSelectCustomer={onSelectCustomer}
            onOpenNewCustomerModal={() => setIsCustomerModalOpen(true)}
          />

          <POSCart
            cart={cart}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onClearCart={onClearCart}
          />

          {cart.length > 0 && (
            <POSDiscountPanel
              discountType={discountType}
              discountValue={discountValue}
              onDiscountTypeChange={setDiscountType}
              onDiscountValueChange={setDiscountValue}
              subtotal={subtotal}
            />
          )}

          <POSCartSummary
            subtotal={subtotal}
            discount={totalDiscount}
            tax={totalTax}
            total={totalPayable}
            itemsCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
            heldCount={heldSales.length}
            onHoldSale={() => onHoldSale()}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            onOpenHeldModal={() => setIsHeldSalesModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <POSCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaveCustomer={onQuickCreateCustomer}
      />

      <POSPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalPayable}
        onCompleteSale={onCheckout}
      />

      <POSHeldSalesModal
        isOpen={isHeldSalesModalOpen}
        onClose={() => setIsHeldSalesModalOpen(false)}
        heldSales={heldSales}
        onResume={onResumeSale}
        onDiscard={onCancelHeldSale}
      />

      <POSReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={activeInvoice}
      />

      <POSReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onProcessReturn={onProcessReturn}
      />
    </div>
  );
};
