import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, User, Upload, Image as ImageIcon } from 'lucide-react';

interface EditPersonalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: any;
}

export const EditPersonalModal: React.FC<EditPersonalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('Prefer not to say');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (staff) {
      setFirstName(staff.first_name || '');
      setLastName(staff.last_name || '');
      setDob(staff.date_of_birth || '');
      setGender(staff.gender || 'Prefer not to say');
      setPhotoPreview(staff.photo_path ? `file://${staff.photo_path}` : null);
      setPhotoBase64(undefined);
    }
    setError('');
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoBase64(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.update('', staff.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob || undefined,
          gender,
          photo_base64: photoBase64,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to update personal details.');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Personal Information</h3>
              <p className="text-xs text-slate-500">{staff.staff_code} — Identity & Profile Photo</p>
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

          {/* Photo preview */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Staff" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-300" />
              )}
            </div>
            <label className="cursor-pointer text-xs font-bold text-[#2818cf] hover:underline flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Upload New Photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          <Input
            label="First Name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <Input
            label="Date of Birth"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Personal Info
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
