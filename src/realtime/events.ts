/**
 * Phase 14 — Standardized Real-Time Event System Constants & Interfaces
 */

export const REALTIME_EVENTS = {
  // Sales Events
  SALE_CREATED: 'SALE_CREATED',
  SALE_UPDATED: 'SALE_UPDATED',
  SALE_CANCELLED: 'SALE_CANCELLED',
  SALE_RETURNED: 'SALE_RETURNED',

  // Inventory & Stock Events
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',
  STOCK_ADJUSTED: 'STOCK_ADJUSTED',
  LOW_STOCK_DETECTED: 'LOW_STOCK_DETECTED',
  OUT_OF_STOCK: 'OUT_OF_STOCK',

  // Customer Management Events
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',

  // Staff & Attendance Events
  ATTENDANCE_CHECKED_IN: 'ATTENDANCE_CHECKED_IN',
  ATTENDANCE_CHECKED_OUT: 'ATTENDANCE_CHECKED_OUT',
  STAFF_UPDATED: 'STAFF_UPDATED',

  // Leave Management Events
  LEAVE_CREATED: 'LEAVE_CREATED',
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',

  // Notification & System Events
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  NOTIFICATION_READ: 'NOTIFICATION_READ',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
} as const;

export type RealtimeEventType = keyof typeof REALTIME_EVENTS;

export interface RealtimeEventMetadata {
  eventId: string;
  type: RealtimeEventType;
  timestamp: number;
  version: number;
  branchId?: number | string;
  actorUserId?: number;
  actorStaffId?: number;
  actorName?: string;
  targetRole?: string | string[];
  targetStaffId?: number;
  targetUserId?: number;
}

export interface RealtimeEvent<T = any> {
  meta: RealtimeEventMetadata;
  data: T;
}

/**
 * Event-specific payload interfaces
 */

export interface SaleCreatedPayload {
  saleId: number;
  invoiceNumber: string;
  totalAmount: number;
  itemsCount: number;
  customerName?: string;
  paymentMethod: string;
  staffName: string;
  items: Array<{
    variantId: number;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface SaleReturnedPayload {
  returnId: number;
  returnNumber: string;
  saleId: number;
  refundAmount: number;
  itemsCount: number;
  reason: string;
}

export interface InventoryUpdatedPayload {
  variantId: number;
  sku: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  changeQuantity: number;
  reason: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface LowStockPayload {
  variantId: number;
  sku: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
}

export interface OutOfStockPayload {
  variantId: number;
  sku: string;
  productName: string;
}

export interface AttendancePayload {
  attendanceId: number;
  staffId: number;
  staffName: string;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
}

export interface LeaveEventPayload {
  leaveRequestId: number;
  staffId: number;
  staffName: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewerName?: string;
}

export interface CustomerEventPayload {
  customerId: number;
  name: string;
  phone?: string;
  tier?: string;
}

export interface NotificationEventPayload {
  id: number;
  title: string;
  message: string;
  type: string;
  recipientStaffId?: number;
  recipientUserId?: number;
  createdAt: string;
}
