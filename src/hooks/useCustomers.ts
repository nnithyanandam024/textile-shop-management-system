import { useState, useEffect, useCallback } from 'react';
import { customerApi, CustomerSummary } from '../api/customerApi';

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string = '', tier?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.searchCustomers(query, { tier });
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search();
  }, [search]);

  const fetchCustomer360 = useCallback(async (customerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getCustomer(customerId);
      if (res.success && res.data) {
        setActiveCustomer(res.data);
        return res.data;
      }
      throw new Error(res.error?.message || 'Customer profile not found.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (data: { name: string; phone: string; email?: string; address?: string; city?: string; pincode?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.createCustomer(data);
      if (res.success && res.data) {
        await search();
        return res.data;
      }
      throw new Error(res.error?.message || 'Failed to register customer.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [search]);

  const updateCustomer = useCallback(async (id: number, data: Partial<CustomerSummary>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.updateCustomer(id, data);
      if (res.success && res.data) {
        await search();
        if (activeCustomer?.id === id) {
          await fetchCustomer360(id);
        }
        return res.data;
      }
      throw new Error(res.error?.message || 'Failed to update customer.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeCustomer?.id, fetchCustomer360, search]);

  return {
    customers,
    activeCustomer,
    loading,
    error,
    search,
    fetchCustomer360,
    createCustomer,
    updateCustomer,
    clearError: () => setError(null),
  };
}

export default useCustomers;
