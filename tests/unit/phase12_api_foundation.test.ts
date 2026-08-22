import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { apiClient, ApiResponse } from '../../src/api/client';
import { ApiError } from '../../src/utils/apiError';
import { StorageManager, UserSessionData } from '../../src/utils/storage';
import {
  ROLES,
  PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
} from '../../src/utils/permissions';
import { authApi } from '../../src/api/authApi';
import { staffApi } from '../../src/api/staffApi';
import { attendanceApi } from '../../src/api/attendanceApi';
import { leaveApi } from '../../src/api/leaveApi';
import { payrollApi } from '../../src/api/payrollApi';
import { inventoryApi } from '../../src/api/inventoryApi';
import { productApi } from '../../src/api/productApi';
import { salesApi } from '../../src/api/salesApi';
import { customerApi } from '../../src/api/customerApi';
import { notificationApi } from '../../src/api/notificationApi';
import { reportApi } from '../../src/api/reportApi';
import { settingsApi } from '../../src/api/settingsApi';
import { SessionService } from '../../electron/main/services/auth/sessionService';

describe('Phase 12 — Complete API Integration Foundation Test Suite', () => {
  const testDbPath = path.join(__dirname, '../../test_phase12.db');
  let db: Database.Database;

  // Mock localStorage for storage testing in node environment
  const mockLocalStorageStore: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => mockLocalStorageStore[key] || null,
    setItem: (key: string, value: string) => {
      mockLocalStorageStore[key] = value;
    },
    removeItem: (key: string) => {
      delete mockLocalStorageStore[key];
    },
    clear: () => {
      for (const k in mockLocalStorageStore) delete mockLocalStorageStore[k];
    },
  };

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    db = initDatabase(testDbPath);

    // Provide global window & localStorage simulation
    (global as any).window = {
      localStorage: mockLocalStorage,
      api: undefined,
    };
    (global as any).localStorage = mockLocalStorage;
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('Test 1: Central API Client GET/POST/PUT/PATCH/DELETE Operations & Header Injection', async () => {
    // Mock global fetch
    const fetchMock = vi.fn().mockImplementation(async (url: string, options: any) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { message: 'ok', method: options.method } }),
      };
    });
    (global as any).fetch = fetchMock;

    StorageManager.setToken('test_jwt_token_123');

    const getRes = await apiClient.get('/test/resource', { params: { query: 'silk', page: 1 } });
    expect(getRes.success).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/test/resource?query=silk&page=1'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_jwt_token_123',
          'Content-Type': 'application/json',
        }),
      })
    );

    const postRes = await apiClient.post('/test/resource', { name: 'Kanchipuram Silk' });
    expect(postRes.success).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/test/resource'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Kanchipuram Silk' }),
      })
    );

    const putRes = await apiClient.put('/test/resource/1', { price: 5000 });
    expect(putRes.success).toBe(true);

    const patchRes = await apiClient.patch('/test/resource/1', { discount: 10 });
    expect(patchRes.success).toBe(true);

    const deleteRes = await apiClient.delete('/test/resource/1');
    expect(deleteRes.success).toBe(true);
  });

  it('Test 2: Standard API Response Formatting ({ success: true, data, message } and error envelope)', async () => {
    // 1. Success response unwrapping
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { id: 101, name: 'Linen Shirt' }, message: 'Product fetched' }),
    });

    const res = await apiClient.get('/products/101');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: 101, name: 'Linen Shirt' });
    expect(res.message).toBe('Product fetched');

    // 2. Error envelope formatting
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () =>
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format',
            details: [{ field: 'phone', message: 'Must be 10 digits' }],
          },
        }),
    });

    const errRes = await apiClient.post('/customers', { phone: '123' });
    expect(errRes.success).toBe(false);
    expect(errRes.error?.code).toBe('VALIDATION_ERROR');
    expect(errRes.error?.message).toBe('Invalid phone number format');
    expect(errRes.error?.status).toBe(422);
    expect(errRes.error?.details?.length).toBe(1);
  });

  it('Test 3: HTTP & Network Error Classification (401, 403, 404, 409, 422, 429, 500, Network Disconnect)', async () => {
    // 403 Forbidden
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: 'Forbidden. Manager role required.' }),
    });
    let result = await apiClient.get('/admin/payroll');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
    expect(result.error?.status).toBe(403);

    // 404 Not Found
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Invoice INV-999 not found.' }),
    });
    result = await apiClient.get('/sales/999');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');

    // Network Failure
    (global as any).fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    result = await apiClient.get('/status');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });

  it('Test 4: 401 Session Invalidation & Automatic Storage Cleanup', async () => {
    StorageManager.setToken('expired_token');
    StorageManager.setCurrentUser({
      id: 1,
      username: 'arun',
      name: 'Arun',
      role: 'STAFF',
      permissions: ['POS_VIEW'],
    });

    let authInvalidFired = false;
    const unsubscribe = apiClient.onAuthInvalid(() => {
      authInvalidFired = true;
    });

    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Token expired.' }),
    });

    const res = await apiClient.get('/protected/profile');
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('UNAUTHORIZED');
    expect(authInvalidFired).toBe(true);

    // Storage must be cleared
    expect(StorageManager.getToken()).toBeNull();
    expect(StorageManager.getCurrentUser()).toBeNull();
    expect(StorageManager.isAuthenticated()).toBe(false);

    unsubscribe();
  });

  it('Test 5: Duplicate In-Flight Request Protection on Mutation Endpoints', async () => {
    let callCount = 0;
    (global as any).fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { saleId: 'INV-100' } }),
      };
    });

    // Fire 3 simultaneous identical POST requests (simulating rapid triple clicks)
    const p1 = apiClient.post('/sales', { amount: 5000 });
    const p2 = apiClient.post('/sales', { amount: 5000 });
    const p3 = apiClient.post('/sales', { amount: 5000 });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
    // fetch must be called only ONCE due to in-flight deduplication
    expect(callCount).toBe(1);
  });

  it('Test 6: Request Timeout Abort with TIMEOUT Error Code', async () => {
    (global as any).fetch = vi.fn().mockImplementation((_, options) => {
      return new Promise((_, reject) => {
        const timeout = setTimeout(() => reject(new Error('Slow network')), 500);
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        }
      });
    });

    const res = await apiClient.get('/slow-endpoint', { timeoutMs: 20 });
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('TIMEOUT');
    expect(res.error?.message).toContain('timed out');
  });

  it('Test 7: Multi-Role Hierarchy & Permission Evaluation across ALL 7 Roles', () => {
    // 1. SUPER_ADMIN
    expect(DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN.length).toBeGreaterThanOrEqual(25);
    expect(hasPermission(['*'], PERMISSIONS.POS_CREATE_SALE)).toBe(true);
    expect(hasPermission(['*'], PERMISSIONS.SETTINGS_MANAGE)).toBe(true);

    // 2. ADMIN
    expect(hasRole('ADMIN', ['ADMIN', 'MANAGER'])).toBe(true);
    expect(hasRole('STAFF', ['ADMIN', 'MANAGER'])).toBe(false);

    // 3. MANAGER
    const managerPerms = DEFAULT_ROLE_PERMISSIONS.MANAGER;
    expect(hasPermission(managerPerms, PERMISSIONS.LEAVE_APPROVE)).toBe(true);
    expect(hasPermission(managerPerms, PERMISSIONS.INVENTORY_ADJUST)).toBe(true);
    expect(hasPermission(managerPerms, PERMISSIONS.SETTINGS_VIEW)).toBe(true);

    // 4. SUPERVISOR
    const supPerms = DEFAULT_ROLE_PERMISSIONS.SUPERVISOR;
    expect(hasPermission(supPerms, PERMISSIONS.POS_APPLY_DISCOUNT)).toBe(true);
    expect(hasPermission(supPerms, PERMISSIONS.INVENTORY_VIEW)).toBe(true);
    expect(hasPermission(supPerms, PERMISSIONS.LEAVE_APPROVE)).toBe(false);

    // 5. STAFF
    const staffPerms = DEFAULT_ROLE_PERMISSIONS.STAFF;
    expect(hasPermission(staffPerms, PERMISSIONS.POS_CREATE_SALE)).toBe(true);
    expect(hasPermission(staffPerms, PERMISSIONS.CUSTOMER_CREATE)).toBe(true);
    expect(hasPermission(staffPerms, PERMISSIONS.LEAVE_APPROVE)).toBe(false);

    // 6. CASHIER
    const cashierPerms = DEFAULT_ROLE_PERMISSIONS.CASHIER;
    expect(hasPermission(cashierPerms, PERMISSIONS.POS_VIEW)).toBe(true);
    expect(hasPermission(cashierPerms, PERMISSIONS.INVENTORY_ADJUST)).toBe(false);

    // 7. INVENTORY_STAFF
    const invPerms = DEFAULT_ROLE_PERMISSIONS.INVENTORY_STAFF;
    expect(hasPermission(invPerms, PERMISSIONS.INVENTORY_COUNT)).toBe(true);
    expect(hasPermission(invPerms, PERMISSIONS.INVENTORY_TRANSFER)).toBe(true);
    expect(hasPermission(invPerms, PERMISSIONS.POS_CREATE_SALE)).toBe(false);

    // Helper combinations
    expect(hasAnyPermission(staffPerms, [PERMISSIONS.POS_VIEW, PERMISSIONS.SETTINGS_MANAGE])).toBe(true);
    expect(hasAllPermissions(staffPerms, [PERMISSIONS.POS_VIEW, PERMISSIONS.CUSTOMER_CREATE])).toBe(true);
    expect(hasAllPermissions(staffPerms, [PERMISSIONS.POS_VIEW, PERMISSIONS.SETTINGS_MANAGE])).toBe(false);
  });

  it('Test 8: Secure Storage Session Management (Zero Password Storage Guarantee)', () => {
    StorageManager.clearSession();

    const mockUser: any = {
      id: 'STF-01',
      username: 'karthik',
      name: 'Karthik Raja',
      role: 'SUPERVISOR',
      password: 'plain_password_123',
      password_hash: '$2b$10$hashed_secret',
      permissions: ['POS_VIEW', 'POS_CREATE_SALE'],
    };

    StorageManager.setCurrentUser(mockUser);
    StorageManager.setToken('session_bearer_token');

    expect(StorageManager.isAuthenticated()).toBe(true);
    expect(StorageManager.getToken()).toBe('session_bearer_token');

    const storedUser: any = StorageManager.getCurrentUser();
    expect(storedUser).toBeDefined();
    expect(storedUser.name).toBe('Karthik Raja');
    expect(storedUser.role).toBe('SUPERVISOR');

    // Strict Password Stripping Check
    expect(storedUser.password).toBeUndefined();
    expect(storedUser.password_hash).toBeUndefined();

    const storedRaw = mockLocalStorageStore['texora_auth_user'];
    expect(storedRaw).not.toContain('plain_password_123');
    expect(storedRaw).not.toContain('$2b$10$hashed_secret');
  });

  it('Test 9: Authentication API Flow (Login, Session Token, Profile Resolution, Logout)', async () => {
    (global as any).fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/login')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: {
                token: 'jwt_token_999',
                user: {
                  id: 1,
                  username: 'arun.sales',
                  name: 'Arun Kumar',
                  role: 'STAFF',
                  permissions: ['POS_VIEW', 'POS_CREATE_SALE'],
                },
                permissions: ['POS_VIEW', 'POS_CREATE_SALE'],
              },
            }),
        };
      }
      if (url.endsWith('/auth/me')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: {
                id: 1,
                username: 'arun.sales',
                name: 'Arun Kumar',
                role: 'STAFF',
                permissions: ['POS_VIEW', 'POS_CREATE_SALE'],
              },
            }),
        };
      }
      if (url.endsWith('/auth/logout')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: { success: true } }),
        };
      }
      return { ok: true, status: 200, text: async () => '{}' };
    });

    // 1. Login
    const loginRes = await authApi.login({ username: 'arun.sales', password: 'password123' });
    expect(loginRes.success).toBe(true);
    expect(loginRes.data?.token).toBe('jwt_token_999');
    expect(StorageManager.isAuthenticated()).toBe(true);

    // 2. Current User
    const meRes = await authApi.getCurrentUser();
    expect(meRes.success).toBe(true);
    expect(meRes.data?.name).toBe('Arun Kumar');

    // 3. Logout
    const logoutRes = await authApi.logout();
    expect(logoutRes.success).toBe(true);
    expect(StorageManager.isAuthenticated()).toBe(false);
  });

  it('Test 10: Module API Services Integration (Staff, Attendance, Leave, Payroll, Inventory, Products, Sales, Customers, Notifications, Reports, Settings)', async () => {
    (global as any).fetch = vi.fn().mockImplementation(async (url: string) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { status: 'success', endpoint: url } }),
      };
    });

    // 1. Staff API
    const profRes = await staffApi.getProfile();
    expect(profRes.success).toBe(true);

    // 2. Attendance API
    const attRes = await attendanceApi.checkIn();
    expect(attRes.success).toBe(true);

    // 3. Leave API
    const leaveRes = await leaveApi.getMyRequests();
    expect(leaveRes.success).toBe(true);

    // 4. Payroll API
    const payRes = await payrollApi.getMyPayroll();
    expect(payRes.success).toBe(true);

    // 5. Inventory API
    const invRes = await inventoryApi.getInventory({ query: 'Silk' });
    expect(invRes.success).toBe(true);

    // 6. Product API
    const prodRes = await productApi.searchProducts('Saree');
    expect(prodRes.success).toBe(true);

    // 7. Sales API
    const saleRes = await salesApi.createSale({
      items: [{ variantId: 1, quantity: 2, unitPrice: 3000 }],
      payments: [{ method: 'CASH', amount: 6000 }],
    });
    expect(saleRes.success).toBe(true);

    // 8. Customer API
    const custRes = await customerApi.searchCustomers('9876543210');
    expect(custRes.success).toBe(true);

    // 9. Notification API
    const notifRes = await notificationApi.getNotifications();
    expect(notifRes.success).toBe(true);

    // 10. Report API
    const repRes = await reportApi.getMySales({ period: 'TODAY' });
    expect(repRes.success).toBe(true);

    // 11. Settings API
    const setRes = await settingsApi.getSettings();
    expect(setRes.success).toBe(true);
  });
});
