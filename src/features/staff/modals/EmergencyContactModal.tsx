import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, HeartHandshake } from 'lucide-react';

interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffId: number;
  contact?: any;
}

export const EmergencyContactModal: React.FC<EmergencyContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffId,
  contact,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setRelationship(contact.relationship || 'Parent');
      setPhone(contact.phone || '');
      setAltPhone(contact.alternate_phone || '');
      setAddress(contact.address || '');
      setIsPrimary(!!contact.is_primary);
    } else {
      setName('');
      setRelationship('Parent');
      setPhone('');
      setAltPhone('');
      setAddress('');
      setIsPrimary(true);
    }
    setError('');
  }, [contact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Contact name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.saveEmergencyContact('', {
          id: contact?.id,
          staff_id: staffId,
          name: name.trim(),
          relationship,
          phone: phone.trim(),
          alternate_phone: altPhone.trim() || undefined,
          address: address.trim() || undefined,
          is_primary: isPrimary,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save emergency contact.');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h3>
              <p className="text-xs text-slate-500">Configure emergency contact details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <Input
            label="Contact Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Relationship *</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
            >
              <option value="Parent">Parent</option>
              <option value="Spouse">Spouse</option>
              <option value="Sibling">Sibling</option>
              <option value="Relative">Relative</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>

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
            label="Address"
            placeholder="City or full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded text-[#2012ad] border-slate-300 focus:ring-[#2012ad]"
            />
            <span className="text-xs font-semibold text-slate-700">Set as Primary Emergency Contact</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
