import { useState, useEffect, useCallback } from 'react';
import { inventoryApi, InventoryItem } from '../api/inventoryApi';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async (query?: string, categoryId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, lowRes] = await Promise.all([
        inventoryApi.getInventory({ query, categoryId }),
        inventoryApi.getLowStock(),
      ]);

      if (invRes.success && invRes.data) setItems(invRes.data);
      if (lowRes.success && lowRes.data) setLowStockItems(lowRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const search = useCallback((query: string, categoryId?: number) => {
    return loadInventory(query, categoryId);
  }, [loadInventory]);

  const recordCount = useCallback(async (variantId: number, count: number, notes?: string) => {
    try {
      const res = await inventoryApi.createStockCount({ variantId, physicalCount: count, notes });
      if (res.success) {
        await loadInventory();
        return { success: true };
      }
      throw new Error(res.error?.message || 'Failed to record stock count.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [loadInventory]);

  const requestTransfer = useCallback(async (input: { sourceLocation: string; destinationLocation: string; items: any[]; reason?: string }) => {
    try {
      const res = await inventoryApi.createTransferRequest(input);
      if (res.success) return { success: true };
      throw new Error(res.error?.message || 'Transfer request failed.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    items,
    lowStockItems,
    loading,
    error,
    search,
    recordCount,
    requestTransfer,
    refresh: () => loadInventory(),
    clearError: () => setError(null),
  };
}

export default useInventory;
