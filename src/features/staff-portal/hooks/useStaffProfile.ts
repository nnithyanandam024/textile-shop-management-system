import { useState, useEffect, useCallback } from 'react';
import {
  staffProfileService,
  StaffProfile,
  EmergencyContact,
  ProfileActivityItem,
  ProfileChangeRequest,
} from '../services/staffProfileService';

export function useStaffProfile() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [activities, setActivities] = useState<ProfileActivityItem[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, contacts, acts, reqs] = await Promise.all([
        staffProfileService.getMyProfile(),
        staffProfileService.getEmergencyContacts(),
        staffProfileService.getActivity(),
        staffProfileService.getChangeRequests(),
      ]);
      setProfile(p);
      setEmergencyContacts(contacts);
      setActivities(acts);
      setChangeRequests(reqs);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const updateProfile = async (fields: Partial<StaffProfile>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.updateMyProfile(fields);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveEmergencyContact = async (input: {
    id?: number;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    isPrimary?: boolean;
  }): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.saveEmergencyContact(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to save emergency contact.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteEmergencyContact = async (id: number): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.deleteEmergencyContact(id);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete emergency contact.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (dataUrl: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.uploadPhoto(dataUrl);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.removePhoto();
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove photo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (curr: string, next: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.changePassword(curr, next);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const requestChange = async (input: {
    fieldName: string;
    oldValue?: string;
    newValue: string;
    reason: string;
  }): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffProfileService.requestChange(input);
      showSuccess(res.message);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit change request.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    emergencyContacts,
    activities,
    changeRequests,
    loading,
    saving,
    error,
    successMessage,
    updateProfile,
    saveEmergencyContact,
    deleteEmergencyContact,
    uploadPhoto,
    removePhoto,
    changePassword,
    requestChange,
    refresh: fetchAll,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
  };
}
