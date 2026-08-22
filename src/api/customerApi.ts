import apiClient, { ApiResponse } from './client';

export interface CustomerSummary {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  email?: string;
  totalSpend: number;
  ordersCount: number;
  loyaltyTier: string;
  pointsBalance: number;
  lastPurchaseDate?: string;
}

export const customerApi = {
  /**
   * Search customer directory by name, normalized mobile, code
   */
  async searchCustomers(query: string, filters?: { tier?: string }): Promise<ApiResponse<CustomerSummary[]>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.search) {
      try {
        const res = await window.api.staffCustomer.search(query, filters);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get<CustomerSummary[]>('/customers/search', { params: { query, ...filters } });
  },

  /**
   * Get 360° customer profile details
   */
  async getCustomer(id: number): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.getDetails) {
      try {
        const res = await window.api.staffCustomer.getDetails(id);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get(`/customers/${id}`);
  },

  /**
   * Register new customer with duplicate phone prevention
   */
  async createCustomer(data: { name: string; phone: string; email?: string; address?: string; city?: string; pincode?: string }): Promise<ApiResponse<CustomerSummary>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.create) {
      try {
        const res = await window.api.staffCustomer.create(data);
        if (res.success && res.data) {
          return { success: true, data: res.data, message: 'Customer registered successfully.' };
        }
        return { success: false, error: { code: 'VALIDATION_ERROR', message: res.error || 'Failed to create customer.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SERVER_ERROR', message: err.message } };
      }
    }
    return apiClient.post<CustomerSummary>('/customers', data);
  },

  /**
   * Update customer profile info
   */
  async updateCustomer(id: number, data: Partial<CustomerSummary>): Promise<ApiResponse<CustomerSummary>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.update) {
      try {
        const res = await window.api.staffCustomer.update(id, data);
        if (res.success && res.data) {
          return { success: true, data: res.data, message: 'Customer updated.' };
        }
      } catch {}
    }
    return apiClient.patch<CustomerSummary>(`/customers/${id}`, data);
  },

  /**
   * Get customer sales invoice history
   */
  async getPurchaseHistory(id: number): Promise<ApiResponse<any[]>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.purchases) {
      try {
        const res = await window.api.staffCustomer.purchases(id);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get(`/customers/${id}/purchases`);
  },

  /**
   * Get customer return history
   */
  async getReturnHistory(id: number): Promise<ApiResponse<any[]>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.returns) {
      try {
        const res = await window.api.staffCustomer.returns(id);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get(`/customers/${id}/returns`);
  },

  /**
   * Get customer loyalty points ledger
   */
  async getLoyalty(id: number): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.loyalty) {
      try {
        const res = await window.api.staffCustomer.loyalty(id);
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      } catch {}
    }
    return apiClient.get(`/customers/${id}/loyalty`);
  },

  /**
   * Add staff note on customer profile
   */
  async addNote(id: number, note: string): Promise<ApiResponse<any>> {
    if (typeof window !== 'undefined' && window.api?.staffCustomer?.addNote) {
      try {
        const res = await window.api.staffCustomer.addNote(id, note);
        if (res.success && res.data) {
          return { success: true, data: res.data, message: 'Note recorded.' };
        }
      } catch {}
    }
    return apiClient.post(`/customers/${id}/notes`, { note });
  },
};

export default customerApi;
