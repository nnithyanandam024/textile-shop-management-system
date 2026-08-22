import { useState, useEffect, useCallback, useRef } from 'react';
import {
  staffInventoryService,
  StaffProductListItem,
  StaffProductDetailsItem,
  StaffInventoryTaskItem,
  StaffTransferRequestItem,
  StaffPOReceivingItem,
  StaffInventoryHistoryItem,
  StaffInventoryMetrics,
  StockStatusType,
} from '../services/staffInventoryService';

export function useStaffInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | StockStatusType>('ALL');
  const [products, setProducts] = useState<StaffProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  const [lowStockItems, setLowStockItems] = useState<StaffProductListItem[]>([]);
  const [tasks, setTasks] = useState<StaffInventoryTaskItem[]>([]);
  const [transfers, setTransfers] = useState<StaffTransferRequestItem[]>([]);
  const [poReceivingList, setPoReceivingList] = useState<StaffPOReceivingItem[]>([]);
  const [history, setHistory] = useState<StaffInventoryHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<StaffInventoryMetrics>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingTasksCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<StaffProductDetailsItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<StaffPOReceivingItem | null>(null);

  const searchTimerRef = useRef<any>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [lowStock, taskList, transferList, poList, histList, metricData] = await Promise.all([
        staffInventoryService.getLowStockItems(),
        staffInventoryService.getInventoryTasks(),
        staffInventoryService.getTransferRequests(),
        staffInventoryService.getPurchaseOrdersForReceiving(),
        staffInventoryService.getInventoryHistory(),
        staffInventoryService.getMetrics(),
      ]);

      setLowStockItems(lowStock);
      setTasks(taskList);
      setTransfers(transferList);
      setPoReceivingList(poList);
      setHistory(histList);
      setMetrics(metricData);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory dashboard data.');
    }
  }, []);

  const executeProductSearch = useCallback(
    async (query: string, statusFilter: string, page: number) => {
      setSearching(true);
      try {
        const filters: any = {
          page,
          limit,
        };
        if (statusFilter !== 'ALL') {
          filters.stockStatus = statusFilter;
        }

        const res = await staffInventoryService.searchProducts(query, filters);
        setProducts(res.items);
        setTotalProducts(res.total);
      } catch (err: any) {
        setError(err.message || 'Failed to search products.');
      } finally {
        setSearching(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), executeProductSearch(searchQuery, stockStatusFilter, currentPage)]);
      setLoading(false);
    };
    init();
  }, [fetchDashboardData, executeProductSearch, stockStatusFilter, currentPage]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      executeProductSearch(query, stockStatusFilter, 1);
    }, 300);
  };

  const handleStatusFilterChange = (status: 'ALL' | StockStatusType) => {
    setStockStatusFilter(status);
    setCurrentPage(1);
    executeProductSearch(searchQuery, status, 1);
  };

  const handleViewProduct = async (variantId: number) => {
    try {
      const details = await staffInventoryService.getProductDetails(variantId);
      setSelectedProduct(details);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to open product details.');
    }
  };

  const handleOpenCountModal = (product?: StaffProductListItem | StaffProductDetailsItem) => {
    if (product) {
      setSelectedProduct(
        'recentMovements' in product
          ? (product as StaffProductDetailsItem)
          : { ...product, recentMovements: [] }
      );
    }
    setIsCountModalOpen(true);
  };

  const handleOpenTransferModal = (product?: StaffProductListItem | StaffProductDetailsItem) => {
    if (product) {
      setSelectedProduct(
        'recentMovements' in product
          ? (product as StaffProductDetailsItem)
          : { ...product, recentMovements: [] }
      );
    }
    setIsTransferModalOpen(true);
  };

  const handleOpenReceivingModal = (po: StaffPOReceivingItem) => {
    setActivePO(po);
    setIsReceivingModalOpen(true);
  };

  const handleSubmitStockCount = async (input: {
    product_variant_id: number;
    physical_quantity: number;
    reason: string;
    location_name?: string;
  }) => {
    try {
      const res = await staffInventoryService.submitStockCount(input);
      setSuccessMessage(res.message);
      setIsCountModalOpen(false);
      await fetchDashboardData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to submit stock count.');
      throw err;
    }
  };

  const handleSubmitTransferRequest = async (input: {
    product_variant_id: number;
    from_location: string;
    to_location: string;
    quantity: number;
    reason: string;
  }) => {
    try {
      const res = await staffInventoryService.createTransferRequest(input);
      setSuccessMessage(res.message);
      setIsTransferModalOpen(false);
      await fetchDashboardData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to submit transfer request.');
      throw err;
    }
  };

  const handleSubmitReceivingReport = async (input: {
    purchase_id: number;
    notes?: string;
    items: Array<{ product_variant_id: number; received_quantity: number; notes?: string }>;
  }) => {
    try {
      const res = await staffInventoryService.submitReceivingReport(input);
      setSuccessMessage(res.message);
      setIsReceivingModalOpen(false);
      await fetchDashboardData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to submit receiving report.');
      throw err;
    }
  };

  return {
    searchQuery,
    stockStatusFilter,
    products,
    totalProducts,
    currentPage,
    limit,
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
    onSearchChange: handleSearchChange,
    onStatusFilterChange: handleStatusFilterChange,
    onPageChange: setCurrentPage,
    onViewProduct: handleViewProduct,
    onOpenCountModal: handleOpenCountModal,
    onOpenTransferModal: handleOpenTransferModal,
    onOpenReceivingModal: handleOpenReceivingModal,
    submitStockCount: handleSubmitStockCount,
    submitTransferRequest: handleSubmitTransferRequest,
    submitReceivingReport: handleSubmitReceivingReport,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
    refresh: () => {
      fetchDashboardData();
      executeProductSearch(searchQuery, stockStatusFilter, currentPage);
    },
  };
}
