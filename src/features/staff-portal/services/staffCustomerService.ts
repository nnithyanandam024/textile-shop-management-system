export interface StaffCustomerListItem {
  id: number;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  totalPurchases: number;
  ordersCount: number;
  lastPurchaseDate?: string;
  loyaltyPoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  createdAt: string;
}

export interface StaffCustomerPreferences {
  preferredCategories?: string;
  preferredColors?: string;
  preferredSizes?: string;
  preferredBrands?: string;
  shoppingPreferences?: string;
  dob?: string;
  anniversary?: string;
}

export interface StaffCustomerNoteItem {
  id: number;
  customerId: number;
  note: string;
  authorName: string;
  createdAt: string;
}

export interface StaffCustomerDetails {
  id: number;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  creditLimit: number;
  outstandingBalance: number;
  totalPurchases: number;
  ordersCount: number;
  averageOrderValue: number;
  lastPurchaseDate?: string;
  totalReturnsCount: number;
  loyaltyPoints: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  preferences: StaffCustomerPreferences;
  notes: StaffCustomerNoteItem[];
  createdAt: string;
}

export interface StaffCustomerPurchaseItem {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  itemsCount: number;
  items: Array<{
    id: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface StaffCustomerReturnItem {
  id: number;
  returnNumber: string;
  saleId: number;
  invoiceNumber: string;
  returnDate: string;
  refundAmount: number;
  status: string;
  reason?: string;
  items: Array<{
    productName: string;
    quantity: number;
    reason: string;
    condition: string;
  }>;
}

export interface StaffCustomerLoyaltyData {
  pointsBalance: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  earnedThisMonth: number;
  redeemedTotal: number;
  transactions: Array<{
    id: number;
    type: 'EARN' | 'REDEEM' | 'ADJUST' | 'EXPIRE';
    points: number;
    description: string;
    referenceType?: string;
    referenceId?: number;
    createdAt: string;
  }>;
}

export class StaffCustomerService {
  async searchCustomers(query?: string, filters?: any): Promise<StaffCustomerListItem[]> {
    if (window.api?.staffCustomer?.search) {
      const res = await window.api.staffCustomer.search(query, filters);
      if (!res.success) throw new Error(res.error || 'Failed to search customers.');
      return res.data || [];
    }
    return [];
  }

  async getCustomerDetails(customerId: number): Promise<StaffCustomerDetails> {
    if (window.api?.staffCustomer?.getDetails) {
      const res = await window.api.staffCustomer.getDetails(customerId);
      if (!res.success) throw new Error(res.error || 'Failed to load customer profile.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async createCustomer(input: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    dob?: string;
    anniversary?: string;
    notes?: string;
    preferences?: StaffCustomerPreferences;
  }): Promise<StaffCustomerDetails> {
    if (window.api?.staffCustomer?.create) {
      const res = await window.api.staffCustomer.create(input);
      if (!res.success) throw new Error(res.error || 'Failed to create customer.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async updateCustomer(customerId: number, input: any): Promise<StaffCustomerDetails> {
    if (window.api?.staffCustomer?.update) {
      const res = await window.api.staffCustomer.update(customerId, input);
      if (!res.success) throw new Error(res.error || 'Failed to update customer.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getPurchases(customerId: number): Promise<StaffCustomerPurchaseItem[]> {
    if (window.api?.staffCustomer?.purchases) {
      const res = await window.api.staffCustomer.purchases(customerId);
      if (!res.success) throw new Error(res.error || 'Failed to load purchases.');
      return res.data || [];
    }
    return [];
  }

  async getReturns(customerId: number): Promise<StaffCustomerReturnItem[]> {
    if (window.api?.staffCustomer?.returns) {
      const res = await window.api.staffCustomer.returns(customerId);
      if (!res.success) throw new Error(res.error || 'Failed to load returns.');
      return res.data || [];
    }
    return [];
  }

  async getLoyalty(customerId: number): Promise<StaffCustomerLoyaltyData> {
    if (window.api?.staffCustomer?.loyalty) {
      const res = await window.api.staffCustomer.loyalty(customerId);
      if (!res.success) throw new Error(res.error || 'Failed to load loyalty data.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async adjustLoyaltyPoints(customerId: number, points: number, type: 'EARN' | 'REDEEM' | 'ADJUST', description: string): Promise<StaffCustomerLoyaltyData> {
    if (window.api?.staffCustomer?.adjustLoyalty) {
      const res = await window.api.staffCustomer.adjustLoyalty(customerId, points, type, description);
      if (!res.success) throw new Error(res.error || 'Failed to adjust loyalty points.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async addNote(customerId: number, note: string): Promise<StaffCustomerNoteItem> {
    if (window.api?.staffCustomer?.addNote) {
      const res = await window.api.staffCustomer.addNote(customerId, note);
      if (!res.success) throw new Error(res.error || 'Failed to add note.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getNotes(customerId: number): Promise<StaffCustomerNoteItem[]> {
    if (window.api?.staffCustomer?.getNotes) {
      const res = await window.api.staffCustomer.getNotes(customerId);
      if (!res.success) throw new Error(res.error || 'Failed to load notes.');
      return res.data || [];
    }
    return [];
  }

  async updatePreferences(customerId: number, preferences: StaffCustomerPreferences): Promise<StaffCustomerPreferences> {
    if (window.api?.staffCustomer?.updatePreferences) {
      const res = await window.api.staffCustomer.updatePreferences(customerId, preferences);
      if (!res.success) throw new Error(res.error || 'Failed to update preferences.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }
}

export const staffCustomerService = new StaffCustomerService();
