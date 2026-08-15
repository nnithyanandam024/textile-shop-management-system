import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Save, Store, CheckCircle, AlertCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    if (window.api?.settings) {
      const res = await window.api.settings.getAll();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (window.api?.settings) {
        for (const [key, value] of Object.entries(settings)) {
          await window.api.settings.update(key, value);
        }
        setMessage({ type: 'success', text: 'Shop settings saved successfully to SQLite database!' });
      }
    } catch (_err) {
      setMessage({ type: 'error', text: 'Failed to save settings to database.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System & Shop Configuration</h2>
        <p className="text-xs font-medium text-slate-500">Configure business information, contact details, currency & tax settings</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card title="Shop Profile Details" subtitle="These details will appear on invoices and reports">
        {loading ? (
          <p className="text-sm text-slate-400 py-4">Loading configuration from SQLite...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Shop Name"
                value={settings.shop_name || ''}
                onChange={(e) => handleChange('shop_name', e.target.value)}
                icon={<Store className="w-4 h-4" />}
                required
              />
              <Input
                label="GST / Tax Identification Number"
                value={settings.gst_number || ''}
                onChange={(e) => handleChange('gst_number', e.target.value)}
                placeholder="e.g. 33AAAAA0000A1Z5"
              />
              <Input
                label="Contact Phone"
                value={settings.shop_phone || ''}
                onChange={(e) => handleChange('shop_phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Currency Symbol / Code"
                value={settings.currency || 'INR'}
                onChange={(e) => handleChange('currency', e.target.value)}
              />
            </div>
            <Input
              label="Shop Address"
              value={settings.shop_address || ''}
              onChange={(e) => handleChange('shop_address', e.target.value)}
              placeholder="Full business address"
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" isLoading={saving} icon={<Save className="w-4 h-4" />}>
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
