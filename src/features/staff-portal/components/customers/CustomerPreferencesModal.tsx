import React, { useState } from 'react';
import { StaffCustomerPreferences } from '../../services/staffCustomerService';
import { X, Tag } from 'lucide-react';

interface CustomerPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreferences?: StaffCustomerPreferences;
  onSave: (preferences: StaffCustomerPreferences) => Promise<any>;
}

export const CustomerPreferencesModal: React.FC<CustomerPreferencesModalProps> = ({
  isOpen,
  onClose,
  initialPreferences,
  onSave,
}) => {
  const [categories, setCategories] = useState(initialPreferences?.preferredCategories || '');
  const [colors, setColors] = useState(initialPreferences?.preferredColors || '');
  const [sizes, setSizes] = useState(initialPreferences?.preferredSizes || '');
  const [brands, setBrands] = useState(initialPreferences?.preferredBrands || '');
  const [shoppingPreferences, setShoppingPreferences] = useState(initialPreferences?.shoppingPreferences || '');
  const [dob, setDob] = useState(initialPreferences?.dob || '');
  const [anniversary, setAnniversary] = useState(initialPreferences?.anniversary || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        preferredCategories: categories.trim() || undefined,
        preferredColors: colors.trim() || undefined,
        preferredSizes: sizes.trim() || undefined,
        preferredBrands: brands.trim() || undefined,
        shoppingPreferences: shoppingPreferences.trim() || undefined,
        dob: dob || undefined,
        anniversary: anniversary || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#2012ad] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Textile Shopping Preferences</h3>
              <p className="text-xs text-slate-400 font-semibold">
                Personalized retail styling & sizing details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700">Preferred Fabrics / Categories</label>
            <input
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="e.g. Kanchipuram Silk Sarees, Cotton Kurtis"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">Favorite Colors</label>
              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="e.g. Royal Blue, Crimson Red"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">Preferred Sizes</label>
              <input
                type="text"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="e.g. Free Size, L (40), XL"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700">Preferred Brands / Collections</label>
            <input
              type="text"
              value={brands}
              onChange={(e) => setBrands(e.target.value)}
              placeholder="e.g. Kanchipuram Silks, Banarasi, Royal Weaves"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700">Shopping Style / Preferences</label>
            <input
              type="text"
              value={shoppingPreferences}
              onChange={(e) => setShoppingPreferences(e.target.value)}
              placeholder="e.g. Festival shopper, Wedding collections, Prefers lightweight fabrics"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">Birthday (DOB)</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">Wedding Anniversary</label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-extrabold text-rose-700">
              {error}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#2012ad] hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
