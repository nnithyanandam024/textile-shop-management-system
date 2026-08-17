import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Phone, Mail, MapPin, Edit2 } from 'lucide-react';

interface ContactTabProps {
  staff: any;
  onEdit: () => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ staff, onEdit }) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Contact & Postal Address</h3>
            <p className="text-xs text-slate-500">Phone numbers, email address & complete location details</p>
          </div>
        </div>

        <Button variant="outline" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>
          Edit Contact Info
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
        <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Communication</h4>
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-[10px]">Primary Phone *</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {staff.phone}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Alternate Phone</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {staff.alternate_phone || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Email Address</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {staff.email || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential & Postal Address</h4>
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-[10px]">Full Address String</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{staff.address || 'Address not registered'}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <p className="text-slate-400 text-[10px]">City</p>
                <p className="font-bold text-slate-900">{staff.city || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">District</p>
                <p className="font-bold text-slate-900">{staff.district || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">State</p>
                <p className="font-bold text-slate-900">{staff.state || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Pincode</p>
                <p className="font-bold text-slate-900">{staff.pincode || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
