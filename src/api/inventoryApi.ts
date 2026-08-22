import apiClient, { ApiResponse } from './client';

export interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  categoryName: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  pattern?: string;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  isLowStock: boolean;
}

export const inventoryApi = {
  /**
   * Get store inventory list with filtering
   */
  async getInventory(filters?: { query?: string; categoryId?: number; lowStockOnly?: boolean }): Promise<ApiResponse<InventoryItem[]>> {
    if (typeof window !== 'undefined' && window.api?.staffInventory?.searchProducts) {
      try {
        const res = await window.api.staffInventory.searchProducts(filters?.query || '', {
          categoryId: filters?.categoryId,
          lowStockOnly: filters?.lowStockOnly,
        });
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<InventoryItem[]>('/inventory', { params: filters });
  },

  /**
   * Get live stock for specific variant
   */
  async getProductStock(variantId: number): Promise<ApiResponse<{ currentStock: number; minimumStock: number }>> {
    if (typeof window !== 'undefined' && window.api?.staffInventory?.getProduct) {
      try {
        const res = await window.api.staffInventory.getProduct(variantId);
        if (res.success && res.data) {
          return { success: true, data: { currentStock: res.data.current_stock || 0, minimumStock: res.data.minimum_stock || 0 } };
        }
      } catch {}
    }
    return apiClient.get(`/inventory/stock/${variantId}`);
  },

  /**
   * Get low stock alerts list
   */
  async getLowStock(): Promise<ApiResponse<InventoryItem[]>> {
    if (typeof window !== 'undefined' && window.api?.staffInventory?.getLowStock) {
      try {
        const res = await window.api.staffInventory.getLowStock();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<InventoryItem[]>('/inventory/low-stock');
  },

  /**
   * Get stock movement audit transactions
   */
  async getStockMovements(_variantId?: number): Promise<ApiResponse<any[]>> {
    if (typeof window !== 'undefined' && window.api?.staffInventory?.getHistory) {
      try {
        const res = await window.api.staffInventory.getHistory();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<any[]>('/inventory/movements', { params: { variantId: _variantId } });
  },

  /**
   * Submit physical stock audit count
   */
  async createStockCount(input: { variantId: number; physicalCount: number; notes?: string }): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffInventory?.submitCount) {
      try {
        const res = await window.api.staffInventory.submitCount({
          productVariantId: input.variantId,
          physicalCount: input.physicalCount,
          notes: input.notes,
        });
        if (res.success) {
          return { success: true, data: res, message: res.message || 'Stock count recorded.' };
        }
      } catch {}
    }
    return apiClient.post('/inventory/counts', input);
  },

  /**
   * Submit stock transfer request between store sections
   */
  async createTransferRequest(input: { sourceLocation: string; destinationLocation: string; items: any[]; reason?: string }): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffInventory?.createTransfer) {
      try {
        const res = await window.api.staffInventory.createTransfer(input);
        if (res.success) {
          return { success: true, data: res, message: res.message || 'Transfer request submitted.' };
        }
      } catch {}
    }
    return apiClient.post('/inventory/transfers', input);
  },
};

export default inventoryApi;
