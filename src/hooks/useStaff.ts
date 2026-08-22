import { useState, useEffect, useCallback } from 'react';
import { staffApi, StaffProfileData } from '../api/staffApi';

export function useStaff() {
  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, dashRes] = await Promise.all([
        staffApi.getProfile(),
        staffApi.getDashboard(),
      ]);

      if (profRes.success && profRes.data) {
        setProfile(profRes.data);
      }
      if (dashRes.success && dashRes.data) {
        setDashboard(dashRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load staff data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (data: Partial<StaffProfileData>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.updateProfile(data);
      if (res.success && res.data) {
        setProfile(res.data);
        return { success: true, data: res.data };
      }
      throw new Error(res.error?.message || 'Failed to update profile.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    dashboard,
    loading,
    error,
    refresh: loadProfile,
    updateProfile,
    clearError: () => setError(null),
  };
}

export default useStaff;
