import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Phone } from 'lucide-react';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: any;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
}) => {
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (staff) {
      setPhone(staff.phone || '');
      setAltPhone(staff.alternate_phone || '');
      setEmail(staff.email || '');
      setAddr1(staff.address_line_1 || staff.address || '');
      setAddr2(staff.address_line_2 || '');
      setCity(staff.city || '');
      setDistrict(staff.district || '');
      setState(staff.state || '');
      setPincode(staff.pincode || '');
    }
    setError('');
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Primary phone number is required.');
      return;
    }

    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      setError('Invalid 6-digit pincode format.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        const fullAddr = [addr1, addr2, city, district, state, pincode].filter(Boolean).join(', ');
        const res = await window.api.staff.update('', staff.id, {
          phone: phone.trim(),
          alternate_phone: altPhone.trim() || undefined,
          email: email.trim() || undefined,
          address: fullAddr,
          address_line_1: addr1.trim() || undefined,
          address_line_2: addr2.trim() || undefined,
          city: city.trim() || undefined,
          district: district.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to update contact details.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Contact Information</h3>
              <p className="text-xs text-slate-500">{staff.staff_code} — Phones, Email & Postal Address</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Alternate Phone"
              value={altPhone}
              onChange={(e) => setAltPhone(e.target.value)}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Address Line 1"
            placeholder="Door No, Street name"
            value={addr1}
            onChange={(e) => setAddr1(e.target.value)}
          />

          <Input
            label="Address Line 2"
            placeholder="Area, Landmark"
            value={addr2}
            onChange={(e) => setAddr2(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="District"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
            <Input
              label="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Contact Info
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
