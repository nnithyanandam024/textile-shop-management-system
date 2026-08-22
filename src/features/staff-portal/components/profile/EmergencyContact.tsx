import React, { useState } from 'react';
import { EmergencyContact as ContactType } from '../../services/staffProfileService';
import { HeartPulse, Plus, Edit3, Trash2, Check, X, Phone, User, AlertCircle } from 'lucide-react';

interface EmergencyContactProps {
  contacts: ContactType[];
  onSaveContact: (input: {
    id?: number;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    isPrimary?: boolean;
  }) => Promise<boolean>;
  onDeleteContact: (id: number) => Promise<boolean>;
  isSaving: boolean;
}

export const EmergencyContact: React.FC<EmergencyContactProps> = ({
  contacts,
  onSaveContact,
  onDeleteContact,
  isSaving,
}) => {
  const [editingId, setEditingId] = useState<number | 'NEW' | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Father');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const startEdit = (c?: ContactType) => {
    setValidationError(null);
    if (c) {
      setEditingId(c.id);
      setName(c.name);
      setRelationship(c.relationship);
      setPhone(c.phone);
      setAltPhone(c.alternate_phone || '');
      setAddress(c.address || '');
    } else {
      setEditingId('NEW');
      setName('');
      setRelationship('Father');
      setPhone('');
      setAltPhone('');
      setAddress('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setValidationError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Contact name is required.');
      return;
    }
    if (!relationship.trim()) {
      setValidationError('Relationship is required.');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Phone number is required.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-+()]/g, '');
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      setValidationError('Please enter a valid phone number (7-15 digits).');
      return;
    }

    const ok = await onSaveContact({
      id: editingId === 'NEW' ? undefined : (editingId as number),
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      alternatePhone: altPhone.trim() || undefined,
      address: address.trim() || undefined,
      isPrimary: contacts.length === 0 || editingId === contacts[0]?.id,
    });

    if (ok) {
      setEditingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Emergency Contacts
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">
              Immediate point of contact for medical or urgent shop situations
            </p>
          </div>
        </div>

        {editingId === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-[#2012ad] border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Editing Form (New or Update) */}
      {editingId !== null && (
        <form onSubmit={handleSave} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              {editingId === 'NEW' ? 'Add New Emergency Contact' : 'Edit Emergency Contact'}
            </h3>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {validationError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                disabled={isSaving}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] cursor-pointer"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Guardian">Guardian</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                disabled={isSaving}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Alternate Phone
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="Optional second number"
                disabled={isSaving}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residence / City"
                disabled={isSaving}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Contact</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      {contacts.length === 0 && editingId === null ? (
        <div className="p-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <HeartPulse className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">No emergency contacts listed</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Add a family member or trusted contact for emergencies
          </p>
          <button
            type="button"
            onClick={() => startEdit()}
            className="mt-3 px-3.5 py-1.5 bg-[#2012ad] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#2012ad] flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{c.name}</p>
                      <span className="text-[10px] font-bold text-slate-500">
                        {c.relationship} {c.is_primary ? '• Primary Contact' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="p-1 text-slate-400 hover:text-[#2012ad] transition-colors"
                      title="Edit Contact"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteContact(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  {c.alternate_phone && (
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span className="w-3.5" />
                      <span>Alt: {c.alternate_phone}</span>
                    </div>
                  )}
                  {c.address && (
                    <p className="text-[11px] text-slate-500 pl-5 truncate">
                      {c.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
