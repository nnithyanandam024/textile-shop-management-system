import { useState, useEffect, useCallback } from 'react';
import {
  staffSettingsService,
  StaffPreferencesData,
  PrinterConfigItem,
  AppVersionInfo,
} from '../services/staffSettingsService';

export function useStaffSettings() {
  const [preferences, setPreferences] = useState<StaffPreferencesData | null>(null);
  const [printers, setPrinters] = useState<PrinterConfigItem[]>([]);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [prefs, printerList, version] = await Promise.all([
        staffSettingsService.getPreferences(),
        staffSettingsService.getPrinters(),
        staffSettingsService.getVersionInfo(),
      ]);
      setPreferences(prefs);
      setPrinters(printerList);
      setVersionInfo(version);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdatePreferences = async (newPrefs: Partial<StaffPreferencesData>) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await staffSettingsService.updatePreferences(newPrefs);
      setPreferences(updated);
      setSuccessMessage('Staff preferences saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async (printerName: string, printerType: string) => {
    setTestingPrint(true);
    setError(null);
    try {
      const res = await staffSettingsService.testPrint(printerName, printerType);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Test print failed.');
    } finally {
      setTestingPrint(false);
    }
  };

  const handleUpdatePassword = async (oldPass: string, newPass: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await staffSettingsService.updatePassword(oldPass, newPass);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    printers,
    versionInfo,
    loading,
    saving,
    testingPrint,
    error,
    successMessage,
    onUpdatePreferences: handleUpdatePreferences,
    onTestPrint: handleTestPrint,
    onUpdatePassword: handleUpdatePassword,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
    refresh: loadSettings,
  };
}
