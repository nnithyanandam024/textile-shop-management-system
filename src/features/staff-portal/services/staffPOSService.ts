export interface StaffPOSProductItem {
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
  taxRate: number;
  currentStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StaffPOSCartItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  taxRate: number;
  discountPercent?: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
}

export interface StaffPOSCustomerItem {
  id: number;
  customer_code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface StaffPOSInvoiceData {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  staffId: number;
  staffName: string;
  staffCode: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  items: Array<{
    id: number;
    variantId: number;
    productName: string;
    sku: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    referenceNumber?: string;
  }>;
}

export interface StaffPOSHeldSaleItem {
  id: number;
  staffId: number;
  referenceName: string;
  customerId?: number;
  customerName?: string;
  cartData: any;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'HELD' | 'RESUMED' | 'CANCELLED';
  createdAt: string;
}

export interface StaffMySalesSummary {
  period: string;
  totalSalesVolume: number;
  totalOrdersCount: number;
  totalItemsSoldCount: number;
  totalReturnsCount: number;
  commissionRate: number;
  commissionEarned: number;
  recentSales: Array<{
    id: number;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    itemsCount: number;
    saleDate: string;
  }>;
}

export class StaffPOSService {
  async searchProducts(query?: string, categoryId?: number): Promise<StaffPOSProductItem[]> {
    if (window.api?.staffPOS?.searchProducts) {
      const res = await window.api.staffPOS.searchProducts(query, categoryId);
      if (!res.success) throw new Error(res.error || 'Failed to search products.');
      return res.data || [];
    }
    return [];
  }

  async getProductByBarcode(barcode: string): Promise<StaffPOSProductItem | null> {
    if (window.api?.staffPOS?.getByBarcode) {
      const res = await window.api.staffPOS.getByBarcode(barcode);
      if (!res.success) throw new Error(res.error || 'Barcode lookup failed.');
      return res.data || null;
    }
    return null;
  }

  async getCustomers(query?: string): Promise<StaffPOSCustomerItem[]> {
    if (window.api?.staffPOS?.getCustomers) {
      const res = await window.api.staffPOS.getCustomers(query);
      if (!res.success) throw new Error(res.error || 'Failed to load customers.');
      return res.data || [];
    }
    return [];
  }

  async quickCreateCustomer(input: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<{ success: boolean; customer: StaffPOSCustomerItem }> {
    if (window.api?.staffPOS?.quickCustomer) {
      const res = await window.api.staffPOS.quickCustomer(input);
      if (!res.success) throw new Error(res.error || 'Failed to create customer.');
      return { success: true, customer: res.customer };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getCustomerHistory(customerId: number): Promise<{ orderCount: number; lifetimeSpend: number; lastPurchaseDate?: string }> {
    if (window.api?.staffPOS?.customerHistory) {
      const res = await window.api.staffPOS.customerHistory(customerId);
      if (!res.success) throw new Error(res.error || 'Failed to load customer history.');
      return res.data;
    }
    return { orderCount: 0, lifetimeSpend: 0 };
  }

  async calculateCartTotals(input: {
    items: Array<{ variantId: number; quantity: number; unitPrice: number; discountPercent?: number }>;
    discountType?: 'PERCENT' | 'FIXED';
    discountValue?: number;
    customerId?: number;
  }): Promise<{
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    itemBreakdowns: Array<{ variantId: number; lineSubtotal: number; lineDiscount: number; lineTax: number; lineTotal: number }>;
  }> {
    if (window.api?.staffPOS?.calculateTotals) {
      const res = await window.api.staffPOS.calculateTotals(input);
      if (!res.success) throw new Error(res.error || 'Failed to calculate cart totals.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async completeSale(input: {
    customerId: number;
    items: Array<{ variantId: number; quantity: number; unitPrice: number; discountPercent?: number }>;
    discountType?: 'PERCENT' | 'FIXED';
    discountValue?: number;
    payments: Array<{ method: string; amount: number; referenceNumber?: string }>;
    notes?: string;
  }): Promise<StaffPOSInvoiceData> {
    if (window.api?.staffPOS?.completeSale) {
      const res = await window.api.staffPOS.completeSale(input);
      if (!res.success) throw new Error(res.error || 'Checkout failed.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async holdSale(input: {
    referenceName?: string;
    customerId?: number;
    cartData: any;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }): Promise<{ success: boolean; heldId: number; message: string }> {
    if (window.api?.staffPOS?.holdSale) {
      const res = await window.api.staffPOS.holdSale(input);
      if (!res.success) throw new Error(res.error || 'Failed to hold sale.');
      return { success: true, heldId: res.heldId || 0, message: res.message || 'Cart held.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getHeldSales(): Promise<StaffPOSHeldSaleItem[]> {
    if (window.api?.staffPOS?.getHeldSales) {
      const res = await window.api.staffPOS.getHeldSales();
      if (!res.success) throw new Error(res.error || 'Failed to load held sales.');
      return res.data || [];
    }
    return [];
  }

  async resumeSale(heldId: number): Promise<StaffPOSHeldSaleItem> {
    if (window.api?.staffPOS?.resumeSale) {
      const res = await window.api.staffPOS.resumeSale(heldId);
      if (!res.success) throw new Error(res.error || 'Failed to resume held sale.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async cancelHeldSale(heldId: number): Promise<{ success: boolean; message: string }> {
    if (window.api?.staffPOS?.cancelHeldSale) {
      const res = await window.api.staffPOS.cancelHeldSale(heldId);
      if (!res.success) throw new Error(res.error || 'Failed to cancel held sale.');
      return { success: true, message: res.message || 'Held cart cancelled.' };
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getMySales(filters?: { period?: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' }): Promise<StaffMySalesSummary> {
    if (window.api?.staffPOS?.getMySales) {
      const res = await window.api.staffPOS.getMySales(filters);
      if (!res.success) throw new Error(res.error || 'Failed to load personal sales summary.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async getSaleInvoice(saleId: number): Promise<StaffPOSInvoiceData> {
    if (window.api?.staffPOS?.getInvoice) {
      const res = await window.api.staffPOS.getInvoice(saleId);
      if (!res.success) throw new Error(res.error || 'Failed to load invoice.');
      return res.data;
    }
    throw new Error('IPC Bridge unavailable.');
  }

  async createReturnRequest(input: {
    saleId: number;
    items: Array<{ saleItemId: number; variantId: number; quantity: number; reason: string; condition?: string }>;
    notes?: string;
  }): Promise<{ success: boolean; returnId: number; returnNumber: string; refundAmount: number; message: string }> {
    if (window.api?.staffPOS?.createReturn) {
      const res = await window.api.staffPOS.createReturn(input);
      if (!res.success) throw new Error(res.error || 'Failed to process return.');
      return {
        success: true,
        returnId: res.returnId || 0,
        returnNumber: res.returnNumber || '',
        refundAmount: res.refundAmount || 0,
        message: res.message || 'Return completed.',
      };
    }
    throw new Error('IPC Bridge unavailable.');
  }
}

export const staffPOSService = new StaffPOSService();
