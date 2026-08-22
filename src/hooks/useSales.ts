import { useState, useEffect, useCallback } from 'react';
import { salesApi, POSSalePayload, SaleInvoice } from '../api/salesApi';

export function useSales() {
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [heldRes, mySalesRes] = await Promise.all([
        salesApi.getHeldSales(),
        salesApi.getMySales(),
      ]);

      if (heldRes.success && heldRes.data) setHeldSales(heldRes.data);
      if (mySalesRes.success && mySalesRes.data) setSalesSummary(mySalesRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const processSale = useCallback(async (saleData: POSSalePayload): Promise<SaleInvoice> => {
    setProcessing(true);
    setError(null);
    try {
      const res = await salesApi.createSale(saleData);
      if (res.success && res.data) {
        await loadSalesData();
        return res.data;
      }
      throw new Error(res.error?.message || 'Failed to complete sale.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [loadSalesData]);

  const holdCurrentSale = useCallback(async (cartData: any, customerId?: number, referenceName?: string) => {
    setProcessing(true);
    setError(null);
    try {
      const res = await salesApi.holdSale({ cartData, customerId, referenceName });
      if (res.success) {
        await loadSalesData();
        return { success: true };
      }
      throw new Error(res.error?.message || 'Failed to hold cart.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [loadSalesData]);

  const resumeHeldSale = useCallback(async (heldSaleId: number) => {
    setProcessing(true);
    setError(null);
    try {
      const res = await salesApi.resumeSale(heldSaleId);
      if (res.success && res.data) {
        await loadSalesData();
        return res.data;
      }
      throw new Error(res.error?.message || 'Failed to resume held cart.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [loadSalesData]);

  const cancelHeldSale = useCallback(async (heldSaleId: number) => {
    try {
      const res = await salesApi.cancelSale(heldSaleId);
      if (res.success) {
        await loadSalesData();
        return { success: true };
      }
      throw new Error(res.error?.message || 'Failed to cancel held cart.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [loadSalesData]);

  const processReturn = useCallback(async (input: { saleId: number; reason: string; items: any[] }) => {
    setProcessing(true);
    setError(null);
    try {
      const res = await salesApi.createReturn(input);
      if (res.success && res.data) {
        await loadSalesData();
        return res.data;
      }
      throw new Error(res.error?.message || 'Failed to process return.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [loadSalesData]);

  return {
    heldSales,
    salesSummary,
    loading,
    processing,
    error,
    processSale,
    holdCurrentSale,
    resumeHeldSale,
    cancelHeldSale,
    processReturn,
    refresh: loadSalesData,
    clearError: () => setError(null),
  };
}

export default useSales;
