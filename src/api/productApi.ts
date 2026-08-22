import apiClient, { ApiResponse } from './client';

export interface ProductSummary {
  id: number;
  name: string;
  categoryName: string;
  brandName?: string;
  material?: string;
  sku: string;
  barcode: string;
  color?: string;
  size?: string;
  sellingPrice: number;
  currentStock: number;
}

export const productApi = {
  /**
   * Fast multi-criteria product search (for POS & inventory)
   */
  async searchProducts(query: string): Promise<ApiResponse<ProductSummary[]>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.searchProducts) {
      try {
        const res = await window.api.staffPOS.searchProducts(query);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<ProductSummary[]>('/products/search', { params: { query } });
  },

  /**
   * Lookup product details by ID
   */
  async getProduct(id: number): Promise<ApiResponse<any>> {
    return apiClient.get(`/products/${id}`);
  },

  /**
   * Lookup variant by barcode / SKU
   */
  async getProductVariant(skuOrBarcode: string): Promise<ApiResponse<ProductSummary>> {
    if (typeof window !== 'undefined' && window.api?.variants?.getByBarcode) {
      try {
        const res = await window.api.variants.getByBarcode(skuOrBarcode);
        if (res) return { success: true, data: res };
      } catch {}
    }
    return apiClient.get<ProductSummary>(`/products/variants/${skuOrBarcode}`);
  },

  /**
   * Barcode scanner quick lookup
   */
  async getBarcodeProduct(barcode: string): Promise<ApiResponse<ProductSummary>> {
    return this.getProductVariant(barcode);
  },
};

export default productApi;
