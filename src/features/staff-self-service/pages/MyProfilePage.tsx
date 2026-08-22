import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { RequestProfileChangeModal } from '../modals/RequestProfileChangeModal';
import { User, Lock, Edit2, Check } from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  // Editable form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (window.api?.selfService) {
        const p = await window.api.selfService.getProfile();
        setProfile(p);
        if (p) {
          setEmail(p.email || '');
          setPhone(p.phone || '');
          setAddressLine1(p.address_line_1 || '');
          setCity(p.city || '');
          setState(p.state || '');
          setPincode(p.pincode || '');
        }
        const reqs = await window.api.selfService.getProfileChangeRequests();
        setRequests(reqs || []);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveEditable = async () => {
    if (window.api?.selfService) {
      await window.api.selfService.updateProfile({
        email,
        phone,
        address_line_1: addressLine1,
        city,
        state,
        pincode,
      });
      setIsEditing(false);
      fetchProfile();
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-[#2012ad] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile & Employment</h1>
            <p className="text-xs font-semibold text-slate-500">View profile details and submit official record update requests</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <Button variant="primary" icon={<Check className="w-4 h-4" />} onClick={handleSaveEditable}>
              Save Contact Details
            </Button>
          ) : (
            <Button variant="outline" icon={<Edit2 className="w-4 h-4" />} onClick={() => setIsEditing(true)}>
              Edit Contact Info
            </Button>
          )}

          <Button variant="primary" icon={<Lock className="w-4 h-4" />} onClick={() => setIsChangeModalOpen(true)}>
            Request Official Change
          </Button>
        </div>
      </div>

      {/* Grid: Read-Only vs Editable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Read-Only Employment Record */}
        <Card className="p-5 space-y-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              Protected Employment Information (Read-Only)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Employee ID</span>
              <span className="font-extrabold text-slate-900 text-sm">{profile.staff_code}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Full Name</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {profile.first_name} {profile.last_name || ''}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Department</span>
              <span className="font-extrabold text-[#2012ad]">{profile.department_name || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Designation</span>
              <span className="font-extrabold text-[#2012ad]">{profile.designation_name || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Joining Date</span>
              <span className="font-extrabold text-slate-900">{profile.joining_date}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Manager</span>
              <span className="font-extrabold text-slate-900">{profile.manager_name || 'Store Director'}</span>
            </div>
          </div>
        </Card>

        {/* Editable Personal Contact Details */}
        <Card className="p-5 space-y-4 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Personal Contact Details</h3>
            {isEditing && <span className="text-[10px] font-bold text-emerald-600">Editing Enabled</span>}
          </div>

          <div className="space-y-3">
            <Input
              label="Personal Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />

            <Input
              label="Primary Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing}
            />

            <Input
              label="Address Line"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={!isEditing}
            />

            <div className="grid grid-cols-3 gap-2">
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={!isEditing} />
              <Input label="State" value={state} onChange={(e) => setState(e.target.value)} disabled={!isEditing} />
              <Input label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} disabled={!isEditing} />
            </div>
          </div>
        </Card>
      </div>

      {/* Change Requests History */}
      <Card className="space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Submitted Change Requests History</h3>
          <span className="text-[11px] font-semibold text-slate-500">{requests.length} requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Target Field</th>
                <th className="py-3 px-4">Old Value</th>
                <th className="py-3 px-4">Requested New Value</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No profile change requests submitted
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.field_name}</td>
                    <td className="py-3 px-4 text-slate-500">{r.old_value || '—'}</td>
                    <td className="py-3 px-4 font-bold text-[#2012ad]">{r.new_value}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{r.created_at?.slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RequestProfileChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        onSuccess={fetchProfile}
        currentValues={profile}
      />
    </div>
  );
};
