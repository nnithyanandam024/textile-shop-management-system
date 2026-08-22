import React from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Printer } from 'lucide-react';

interface PrintStaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
}

export const PrintStaffProfileModal: React.FC<PrintStaffProfileModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  if (!isOpen || !staff) return null;

  const fullName = `${staff.first_name} ${staff.last_name || ''}`.trim();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad]">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Printable Staff Profile</h3>
              <p className="text-xs text-slate-500">Official employee record sheet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print Now
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content Box */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 printable-area">
          {/* Shop Brand Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">TEXORA RETAIL</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Textile Shop Management System</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-[#2012ad] font-mono">{staff.staff_code}</span>
              <p className="text-[10px] text-slate-400">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Profile Basic Card */}
          <div className="flex items-center gap-6 p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 font-bold text-xl text-[#2012ad]">
              {staff.photo_path ? (
                <img src={`file://${staff.photo_path}`} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                staff.first_name[0]
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">{fullName}</h2>
              <p className="text-xs font-semibold text-slate-600">
                {staff.designation_name} — <span className="text-[#2012ad] font-bold">{staff.department_name}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-700">
                  Status: {staff.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 bg-slate-100 text-slate-700">
                  Type: {staff.employment_type?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Employment Overview</h4>
              <p><span className="font-bold">Staff ID:</span> {staff.staff_code}</p>
              <p><span className="font-bold">Joining Date:</span> {staff.joining_date}</p>
              <p><span className="font-bold">Confirmation:</span> {staff.confirmation_date || 'N/A'}</p>
              <p><span className="font-bold">Reporting Manager:</span> {staff.manager_name || 'N/A'}</p>
              <p><span className="font-bold">Work Location:</span> {staff.work_location || 'Main Store'}</p>
            </div>

            <div className="p-4 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Contact Details</h4>
              <p><span className="font-bold">Phone:</span> {staff.phone}</p>
              <p><span className="font-bold">Alt Phone:</span> {staff.alternate_phone || 'N/A'}</p>
              <p><span className="font-bold">Email:</span> {staff.email || 'N/A'}</p>
              <p><span className="font-bold">City/State:</span> {[staff.city, staff.state, staff.pincode].filter(Boolean).join(', ') || 'N/A'}</p>
              <p><span className="font-bold">Address:</span> {staff.address || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 text-center">
            This document is an official internal staff record generated by Texora Textile Management Software.
          </div>
        </div>
      </div>
    </div>
  );
};
