export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED';

export interface StaffProductListItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  barcode?: string;
  categoryName?: string;
  brandName?: string;
  color?: string;
  size?: string;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  status: StockStatusType;
  locationName: string;
}

export interface StaffProductDetailsItem extends StaffProductListItem {
  material?: string;
  description?: string;
  pattern?: string;
  purchasePrice?: number;
  recentMovements: Array<{
    id: number;
    transactionType: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    notes?: string;
    createdAt: string;
  }>;
}

export interface StaffInventoryTaskItem {
  id: number;
  staffId: number;
  taskType: 'STOCK_COUNT' | 'STOCK_RECEIVING' | 'TRANSFER_DISPATCH' | 'REORDER_CHECK';
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  referenceId?: number;
  createdAt: string;
}

export interface StaffTransferRequestItem {
  id: number;
  staffId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface StaffPOReceivingItem {
  id: number;
  purchaseNumber: string;
  supplierName: string;
  purchaseDate: string;
  items: Array<{
    id: number;
    productVariantId: number;
    productName: string;
    sku: string;
    orderedQuantity: number;
  }>;
}

export interface StaffInventoryHistoryItem {
  id: number;
  type: 'STOCK_COUNT' | 'TRANSFER_REQUEST' | 'RECEIVING_REPORT';
  title: string;
  details: string;
  status: string;
  date: string;
}

export interface StaffInventoryMetrics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingTasksCount: number;
}

export class StaffInventoryService {
  async searchProducts(
    query?: string,
    filters?: { categoryId?: number; brandId?: number; stockStatus?: string; page?: number; limit?: number }
  ): Promise<{ items: StaffProductListItem[]; total: number; page: number; limit: number }> {
    if (window.api?.staffInventory?.searchProducts) {
      const res = await window.api.staffInventory.searchProducts(query, filters);
      if (!res.success) throw new Error(res.error || 'Failed to search products.');
      return res.data || { items: [], total: 0, page: 1, limit: 25 };
    }
    return { items: [], total: 0, page: 1, limit: 25 };
  }

  async getProductDetails(variantId: number): Promise<StaffProductDetailsItem> {
    if (window.api?.staffInventory?.getProduct) {
      const res = await window.api.staffInventory.getProduct(variantId);
      if (!res.success) throw new Error(res.error || 'Failed to load product details.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getLowStockItems(): Promise<StaffProductListItem[]> {
    if (window.api?.staffInventory?.getLowStock) {
      const res = await window.api.staffInventory.getLowStock();
      if (!res.success) throw new Error(res.error || 'Failed to load low stock items.');
      return res.data || [];
    }
    return [];
  }

  async getInventoryTasks(): Promise<StaffInventoryTaskItem[]> {
    if (window.api?.staffInventory?.getTasks) {
      const res = await window.api.staffInventory.getTasks();
      if (!res.success) throw new Error(res.error || 'Failed to load inventory tasks.');
      return res.data || [];
    }
    return [];
  }

  async submitStockCount(input: {
    product_variant_id: number;
    physical_quantity: number;
    reason: string;
    location_name?: string;
  }): Promise<{ success: boolean; id: number; difference: number; message: string }> {
    if (window.api?.staffInventory?.submitCount) {
      const res = await window.api.staffInventory.submitCount(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit stock count.');
      return {
        success: true,
        id: res.id || 0,
        difference: res.difference ?? 0,
        message: res.message || 'Stock count submitted successfully.',
      };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async createTransferRequest(input: {
    product_variant_id: number;
    from_location: string;
    to_location: string;
    quantity: number;
    reason: string;
  }): Promise<{ success: boolean; id: number; message: string }> {
    if (window.api?.staffInventory?.createTransfer) {
      const res = await window.api.staffInventory.createTransfer(input);
      if (!res.success) throw new Error(res.error || 'Failed to create transfer request.');
      return {
        success: true,
        id: res.id || 0,
        message: res.message || 'Transfer request submitted successfully.',
      };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getTransferRequests(): Promise<StaffTransferRequestItem[]> {
    if (window.api?.staffInventory?.getTransfers) {
      const res = await window.api.staffInventory.getTransfers();
      if (!res.success) throw new Error(res.error || 'Failed to load transfer requests.');
      return res.data || [];
    }
    return [];
  }

  async getPurchaseOrdersForReceiving(): Promise<StaffPOReceivingItem[]> {
    if (window.api?.staffInventory?.getPoReceiving) {
      const res = await window.api.staffInventory.getPoReceiving();
      if (!res.success) throw new Error(res.error || 'Failed to load purchase orders for receiving.');
      return res.data || [];
    }
    return [];
  }

  async submitReceivingReport(input: {
    purchase_id: number;
    notes?: string;
    items: Array<{ product_variant_id: number; received_quantity: number; notes?: string }>;
  }): Promise<{ success: boolean; id: number; message: string }> {
    if (window.api?.staffInventory?.submitReceiving) {
      const res = await window.api.staffInventory.submitReceiving(input);
      if (!res.success) throw new Error(res.error || 'Failed to submit receiving report.');
      return {
        success: true,
        id: res.id || 0,
        message: res.message || 'Receiving report submitted successfully.',
      };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getInventoryHistory(): Promise<StaffInventoryHistoryItem[]> {
    if (window.api?.staffInventory?.getHistory) {
      const res = await window.api.staffInventory.getHistory();
      if (!res.success) throw new Error(res.error || 'Failed to load inventory history.');
      return res.data || [];
    }
    return [];
  }

  async getMetrics(): Promise<StaffInventoryMetrics> {
    if (window.api?.staffInventory?.getMetrics) {
      const res = await window.api.staffInventory.getMetrics();
      if (!res.success) throw new Error(res.error || 'Failed to load inventory metrics.');
      return res.data || { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, pendingTasksCount: 0 };
    }
    return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, pendingTasksCount: 0 };
  }
}

export const staffInventoryService = new StaffInventoryService();
