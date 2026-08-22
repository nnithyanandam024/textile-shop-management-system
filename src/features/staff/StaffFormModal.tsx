import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, UserPlus, Upload, Image as ImageIcon } from 'lucide-react';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff?: any;
  departments: any[];
  designations: any[];
  users?: any[];
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
  departments,
  designations,
  users = [],
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designationId, setDesignationId] = useState<number | ''>('');
  const [employmentType, setEmploymentType] = useState<string>('FULL_TIME');
  const [userId, setUserId] = useState<number | ''>('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [availableDesignations, setAvailableDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form fields when editing or opening
  useEffect(() => {
    if (staff) {
      setFirstName(staff.first_name || '');
      setLastName(staff.last_name || '');
      setPhone(staff.phone || '');
      setEmail(staff.email || '');
      setAddress(staff.address || '');
      setJoiningDate(staff.joining_date || new Date().toISOString().split('T')[0]);
      setDepartmentId(staff.department_id || '');
      setDesignationId(staff.designation_id || '');
      setEmploymentType(staff.employment_type || 'FULL_TIME');
      setUserId(staff.user_id || '');
      setPhotoPreview(staff.photo_path || null);
    } else {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setDepartmentId(departments.length > 0 ? departments[0].id : '');
      setDesignationId('');
      setEmploymentType('FULL_TIME');
      setUserId('');
      setPhotoBase64(undefined);
      setPhotoPreview(null);
    }
    setError('');
  }, [staff, isOpen, departments]);

  // Dynamic Designation Dropdown filtering by Department
  useEffect(() => {
    if (departmentId) {
      const filtered = designations.filter((d) => d.department_id === Number(departmentId));
      setAvailableDesignations(filtered);

      // If current selected designation doesn't belong to new department, reset it or pick first
      if (designationId && !filtered.some((d) => d.id === Number(designationId))) {
        setDesignationId(filtered.length > 0 ? filtered[0].id : '');
      } else if (!designationId && filtered.length > 0) {
        setDesignationId(filtered[0].id);
      }
    } else {
      setAvailableDesignations([]);
      setDesignationId('');
    }
  }, [departmentId, designations]);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo file size must be less than 5MB.');
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
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!joiningDate) {
      setError('Joining date is required.');
      return;
    }
    if (!departmentId) {
      setError('Please select a department.');
      return;
    }
    if (!designationId) {
      setError('Please select a designation.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        let res;
        const payload = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          joining_date: joiningDate,
          department_id: Number(departmentId),
          designation_id: Number(designationId),
          employment_type: employmentType,
          user_id: userId ? Number(userId) : undefined,
          photo_base64: photoBase64,
        };

        if (staff) {
          res = await window.api.staff.update('', staff.id, payload);
        } else {
          res = await window.api.staff.create('', payload);
        }

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save staff record.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {staff ? `Edit Staff (${staff.staff_code})` : 'Add New Staff Member'}
              </h3>
              <p className="text-xs text-slate-500">Configure personal & employment details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Photo & Basic Info Row */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group">
              {photoPreview ? (
                <img src={photoPreview} alt="Staff Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
              <label className="absolute inset-0 bg-slate-900/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-[10px] font-bold">
                <Upload className="w-4 h-4 mb-0.5" />
                Upload
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            <div className="flex-1 w-full space-y-1">
              <h4 className="text-xs font-bold text-slate-900">Employee Photo</h4>
              <p className="text-[11px] text-slate-500">Supported formats: JPG, PNG, WEBP. Max size 5MB.</p>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              placeholder="e.g. Arun"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Kumar"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input
              label="Phone Number *"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              placeholder="e.g. arun@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Address</label>
            <input
              type="text"
              placeholder="Street address, City, State, Pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
            />
          </div>

          {/* Employment Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Input
              label="Joining Date *"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Employment Type *</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation *</label>
              <select
                value={designationId}
                onChange={(e) => setDesignationId(Number(e.target.value))}
                required
                disabled={!departmentId}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all disabled:opacity-50"
              >
                <option value="">Select Designation...</option>
                {availableDesignations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Linkage */}
          {users.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Link to Application Login User Account (Optional)
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2012ad]/20 focus:border-[#2012ad] transition-all"
              >
                <option value="">No System User Account Linked</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.username} - {u.role_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {staff ? 'Update Staff Member' : 'Save Staff Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
