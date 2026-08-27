import React, { useState, useEffect } from 'react';
import { StaffProfile } from '../../services/staffProfileService';
import { Phone, Mail, MapPin, Edit3, Check, X, AlertCircle } from 'lucide-react';

interface ContactInformationProps {
  profile: StaffProfile;
  onSave: (fields: {
    phone?: string;
    alternatePhone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }) => Promise<boolean>;
  isSaving: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  profile,
  onSave,
  isSaving,
  onDirtyChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile.phone || '');
  const [altPhone, setAltPhone] = useState(profile.alternatePhone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [addr1, setAddr1] = useState(profile.addressLine1 || '');
  const [addr2, setAddr2] = useState(profile.addressLine2 || '');
  const [city, setCity] = useState(profile.city || '');
  const [district, setDistrict] = useState(profile.district || '');
  const [state, setState] = useState(profile.state || '');
  const [pincode, setPincode] = useState(profile.pincode || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setPhone(profile.phone || '');
    setAltPhone(profile.alternatePhone || '');
    setEmail(profile.email || '');
    setAddr1(profile.addressLine1 || '');
    setAddr2(profile.addressLine2 || '');
    setCity(profile.city || '');
    setDistrict(profile.district || '');
    setState(profile.state || '');
    setPincode(profile.pincode || '');
  }, [profile]);

  const isDirty =
    phone !== (profile.phone || '') ||
    altPhone !== (profile.alternatePhone || '') ||
    email !== (profile.email || '') ||
    addr1 !== (profile.addressLine1 || '') ||
    addr2 !== (profile.addressLine2 || '') ||
    city !== (profile.city || '') ||
    district !== (profile.district || '') ||
    state !== (profile.state || '') ||
    pincode !== (profile.pincode || '');

  useEffect(() => {
    onDirtyChange?.(isEditing && isDirty);
  }, [isEditing, isDirty, onDirtyChange]);

  const handleCancel = () => {
    setPhone(profile.phone || '');
    setAltPhone(profile.alternatePhone || '');
    setEmail(profile.email || '');
    setAddr1(profile.addressLine1 || '');
    setAddr2(profile.addressLine2 || '');
    setCity(profile.city || '');
    setDistrict(profile.district || '');
    setState(profile.state || '');
    setPincode(profile.pincode || '');
    setValidationError(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate phone
    if (!phone.trim()) {
      setValidationError('Phone number is required.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-+()]/g, '');
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      setValidationError('Please enter a valid phone number (7-15 digits).');
      return;
    }

    // Validate email
    if (email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setValidationError('Please enter a valid email address.');
        return;
      }
    }

    // Validate address
    if (!addr1.trim()) {
      setValidationError('Address Line 1 cannot be empty.');
      return;
    }

    const ok = await onSave({
      phone: phone.trim(),
      alternatePhone: altPhone.trim() || undefined,
      email: email.trim() || undefined,
      addressLine1: addr1.trim(),
      addressLine2: addr2.trim() || undefined,
      city: city.trim() || undefined,
      district: district.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
    });

    if (ok) {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Contact & Address
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">
              Personal contact numbers, email, and physical residential address
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-[#2012ad] border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Fields */}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Primary Phone <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                disabled={isSaving}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {profile.phone}
            </p>
          )}
        </div>

        {/* Alternate Phone */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Alternate Phone
          </label>
          {isEditing ? (
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="Optional second number"
                disabled={isSaving}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100">
              {profile.alternatePhone || '—'}
            </p>
          )}
        </div>

        {/* Personal Email */}
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Personal / Work Email
          </label>
          {isEditing ? (
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@ratnavilas.com"
                disabled={isSaving}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {profile.email || '—'}
            </p>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={addr1}
                onChange={(e) => setAddr1(e.target.value)}
                placeholder="House / Door No, Street, Landmark"
                disabled={isSaving}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {profile.addressLine1 || '—'}
            </p>
          )}
        </div>

        {/* City & State & Pincode */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            City / Town
          </label>
          {isEditing ? (
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Coimbatore"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            />
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100">
              {profile.city || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            State
          </label>
          {isEditing ? (
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Tamil Nadu"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            />
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100">
              {profile.state || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            PIN Code / Postal Code
          </label>
          {isEditing ? (
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="641012"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            />
          ) : (
            <p className="text-xs font-bold text-slate-800 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-100 font-mono">
              {profile.pincode || '—'}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
