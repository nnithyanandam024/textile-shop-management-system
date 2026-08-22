import React from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { ProductSearch } from '../components/inventory/ProductSearch';
import { ProductGrid } from '../components/inventory/ProductGrid';
import { ProductDetailsModal } from '../components/inventory/ProductDetailsModal';
import { LowStockWidget } from '../components/inventory/LowStockWidget';
import { InventoryTasks } from '../components/inventory/InventoryTasks';
import { StockCountModal } from '../components/inventory/StockCountModal';
import { ReceiveStockModal } from '../components/inventory/ReceiveStockModal';
import { StockMovementModal } from '../components/inventory/StockMovementModal';
import { TransferRequestList } from '../components/inventory/TransferRequestList';
import { InventoryHistory } from '../components/inventory/InventoryHistory';
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  RotateCw,
} from 'lucide-react';

export const StaffInventory: React.FC = () => {
  const {
    searchQuery,
    stockStatusFilter,
    products,
    totalProducts,
    lowStockItems,
    tasks,
    transfers,
    poReceivingList,
    history,
    metrics,
    loading,
    searching,
    error,
    successMessage,
    selectedProduct,
    isDetailsModalOpen,
    isCountModalOpen,
    isTransferModalOpen,
    isReceivingModalOpen,
    activePO,
    setIsDetailsModalOpen,
    setIsCountModalOpen,
    setIsTransferModalOpen,
    setIsReceivingModalOpen,
    onSearchChange,
    onStatusFilterChange,
    onViewProduct,
    onOpenCountModal,
    onOpenTransferModal,
    onOpenReceivingModal,
    submitStockCount,
    submitTransferRequest,
    submitReceivingReport,
    clearError,
    clearSuccess,
    refresh,
  } = useStaffInventory();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <StaffHeader />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Inventory & Stock Operations
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Browse products, check live availability, perform stock counts, and submit transfer requests
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refresh}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Notifications & Error Banners */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button type="button" onClick={clearError} className="text-red-700 hover:text-red-900">
                  ✕
                </button>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button type="button" onClick={clearSuccess} className="text-emerald-700 hover:text-emerald-900">
                  ✕
                </button>
              </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Products
                  </span>
                  <strong className="text-xl font-extrabold text-slate-900 font-mono">
                    {metrics.totalProducts}
                  </strong>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    Low Stock Alert
                  </span>
                  <strong className="text-xl font-extrabold text-amber-600 font-mono">
                    {metrics.lowStockCount}
                  </strong>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                    Out of Stock
                  </span>
                  <strong className="text-xl font-extrabold text-rose-600 font-mono">
                    {metrics.outOfStockCount}
                  </strong>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pending Tasks
                  </span>
                  <strong className="text-xl font-extrabold text-[#2012ad] font-mono">
                    {metrics.pendingTasksCount}
                  </strong>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Low Stock Urgent Widget */}
            <LowStockWidget
              lowStockItems={lowStockItems}
              onCountStock={onOpenCountModal}
              onViewAll={() => onStatusFilterChange('LOW_STOCK')}
            />

            {/* Inventory Tasks & Inward Receiving */}
            <InventoryTasks
              tasks={tasks}
              poReceivingList={poReceivingList}
              onOpenReceiving={onOpenReceivingModal}
              onOpenCount={() => onOpenCountModal(products[0])}
              onOpenTransfer={() => onOpenTransferModal(products[0])}
            />

            {/* Product Search & Filter Bar */}
            <ProductSearch
              query={searchQuery}
              onQueryChange={onSearchChange}
              statusFilter={stockStatusFilter}
              onStatusFilterChange={onStatusFilterChange}
              totalResults={totalProducts}
              searching={searching}
            />

            {/* Products Catalog Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-48 bg-slate-200 rounded-3xl" />
                ))}
              </div>
            ) : (
              <ProductGrid
                products={products}
                onViewDetails={onViewProduct}
                onCountStock={onOpenCountModal}
                onTransfer={onOpenTransferModal}
              />
            )}

            {/* Transfer Requests Table */}
            <TransferRequestList transfers={transfers} />

            {/* Inventory History Timeline */}
            <InventoryHistory history={history} />
          </div>
        </main>
      </div>

      {/* Modals */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onCountStock={onOpenCountModal}
        onTransfer={onOpenTransferModal}
      />

      <StockCountModal
        product={selectedProduct}
        isOpen={isCountModalOpen}
        onClose={() => setIsCountModalOpen(false)}
        onSubmitCount={submitStockCount}
      />

      <ReceiveStockModal
        po={activePO}
        isOpen={isReceivingModalOpen}
        onClose={() => setIsReceivingModalOpen(false)}
        onSubmitReceiving={submitReceivingReport}
      />

      <StockMovementModal
        product={selectedProduct}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmitTransfer={submitTransferRequest}
      />
    </div>
  );
};
