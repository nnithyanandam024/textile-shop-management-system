import { useState, useEffect, useCallback } from 'react';
import { staffDashboardService, StaffDashboardData } from '../services/staffDashboardService';

export const useStaffDashboard = () => {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffDashboardService.getDashboardSummary();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load staff dashboard summary.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to dashboard service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refresh: fetchDashboard,
  };
};
