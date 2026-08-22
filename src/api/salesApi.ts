import apiClient, { ApiResponse } from './client';

export interface POSSaleItem {
  variantId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface POSPaymentTender {
  method: 'CASH' | 'UPI' | 'CARD';
  amount: number;
  referenceNumber?: string;
}

export interface POSSalePayload {
  customerId?: number;
  items: POSSaleItem[];
  payments: POSPaymentTender[];
  discountAmount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountReason?: string;
  notes?: string;
  heldSaleId?: number;
}

export interface SaleInvoice {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  customerName: string;
  customerId?: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  itemsCount: number;
  items?: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export const salesApi = {
  /**
   * Complete a POS Sale transaction with idempotency protection
   */
  async createSale(saleData: POSSalePayload, idempotencyKey?: string): Promise<ApiResponse<SaleInvoice>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.completeSale) {
      try {
        const res = await window.api.staffPOS.completeSale(saleData);
        if (res.success && res.data) {
          const invoice: SaleInvoice = {
            id: res.data.id,
            invoiceNumber: res.data.invoiceNumber,
            saleDate: res.data.saleDate,
            customerName: res.data.customerName,
            customerId: res.data.customerId,
            subtotal: res.data.subtotal,
            discount: res.data.discountAmount || 0,
            tax: res.data.taxAmount || 0,
            total: res.data.totalAmount ?? res.data.total ?? 0,
            paymentMethod: res.data.paymentMethod,
            itemsCount: res.data.items?.length || 0,
            items: res.data.items,
          };
          return { success: true, data: invoice, message: 'Sale completed successfully.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Sale failed.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.post<SaleInvoice>('/sales', saleData, { idempotencyKey });
  },

  /**
   * Retrieve invoice by ID
   */
  async getSale(saleId: number): Promise<ApiResponse<SaleInvoice>> {
    return apiClient.get<SaleInvoice>(`/sales/${saleId}`);
  },

  /**
   * Get authenticated staff's personal sales
   */
  async getMySales(filters?: { period?: string }): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.getMySales) {
      try {
        const res = await window.api.staffPOS.getMySales(filters);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/sales/my-sales', { params: filters });
  },

  /**
   * Get store sales history ledger
   */
  async getSalesHistory(filters?: any): Promise<ApiResponse<SaleInvoice[]>> {
    return apiClient.get<SaleInvoice[]>('/sales', { params: filters });
  },

  /**
   * Hold current active cart
   */
  async holdSale(input: { customerId?: number; referenceName?: string; cartData: any }): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.holdSale) {
      try {
        const res = await window.api.staffPOS.holdSale(input);
        if (res.success) {
          return { success: true, data: res, message: res.message || 'Cart held successfully.' };
        }
      } catch {}
    }
    return apiClient.post('/sales/hold', input);
  },

  /**
   * Get held cart sessions
   */
  async getHeldSales(): Promise<ApiResponse<any[]>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.getHeldSales) {
      try {
        const res = await window.api.staffPOS.getHeldSales();
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get('/sales/held');
  },

  /**
   * Resume held cart session
   */
  async resumeSale(heldSaleId: number): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.resumeSale) {
      try {
        const res = await window.api.staffPOS.resumeSale(heldSaleId);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.post(`/sales/held/${heldSaleId}/resume`);
  },

  /**
   * Cancel held cart session
   */
  async cancelSale(heldSaleId: number): Promise<ApiResponse<{ success: boolean }>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.cancelHeldSale) {
      try {
        const res = await window.api.staffPOS.cancelHeldSale(heldSaleId);
        if (res.success) {
          return { success: true, data: { success: true } };
        }
      } catch {}
    }
    return apiClient.delete(`/sales/held/${heldSaleId}`);
  },

  /**
   * Process customer sales return with condition audit
   */
  async createReturn(input: {
    saleId: number;
    reason: string;
    items: Array<{ saleItemId: number; variantId: number; quantity: number; refundAmount: number; condition: 'GOOD' | 'DAMAGED'; reason: string }>;
  }): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffPOS?.createReturn) {
      try {
        const res = await window.api.staffPOS.createReturn(input);
        if (res.success) {
          return { success: true, data: res, message: res.message || 'Return processed.' };
        }
      } catch {}
    }
    return apiClient.post('/sales/returns', input);
  },
};

export default salesApi;
