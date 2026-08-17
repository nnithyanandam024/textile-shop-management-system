import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Tab components
import { OverviewTab } from './components/OverviewTab';
import { PersonalTab } from './components/PersonalTab';
import { EmploymentTab } from './components/EmploymentTab';
import { ContactTab } from './components/ContactTab';
import { EmergencyTab } from './components/EmergencyTab';
import { DocumentsTab } from './components/DocumentsTab';
import { BankTab } from './components/BankTab';
import { HistoryTab } from './components/HistoryTab';
import { NotesTab } from './components/NotesTab';

// Modal components
import { EditPersonalModal } from './modals/EditPersonalModal';
import { EditEmploymentModal } from './modals/EditEmploymentModal';
import { EditContactModal } from './modals/EditContactModal';
import { EmergencyContactModal } from './modals/EmergencyContactModal';
import { BankDetailsModal } from './modals/BankDetailsModal';
import { UploadDocumentModal } from './modals/UploadDocumentModal';
import { AddNoteModal } from './modals/AddNoteModal';
import { PrintStaffProfileModal } from './modals/PrintStaffProfileModal';

import {
  ArrowLeft,
  Edit2,
  Printer,
  Power,
  AlertCircle
} from 'lucide-react';

export const StaffProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [staff, setStaff] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab Data State
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Reference data for modals
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);

  // Modal controls
  const [isEditPersonalOpen, setIsEditPersonalOpen] = useState(false);
  const [isEditEmploymentOpen, setIsEditEmploymentOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Deactivation confirmation modal
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const fetchStaffData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (window.api?.staff) {
        const s = await window.api.staff.getById(Number(id));
        setStaff(s || null);

        if (s) {
          const contacts = await window.api.staff.getEmergencyContacts(Number(id));
          setEmergencyContacts(contacts || []);

          const bank = await window.api.staff.getBankDetails(Number(id), false);
          setBankDetails(bank || null);

          const docs = await window.api.staff.getDocuments(Number(id));
          setDocuments(docs || []);

          const nList = await window.api.staff.getNotes(Number(id));
          setNotes(nList || []);

          const hList = await window.api.staff.getHistory(Number(id));
          setHistory(hList || []);
        }
      }
    } catch (err) {
      console.error('Failed to load staff profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      if (window.api?.department) {
        const depts = await window.api.department.getAll(false);
        setDepartments(depts);
      }
      if (window.api?.designation) {
        const desigs = await window.api.designation.getAll(undefined, false);
        setDesignations(desigs);
      }
      if (window.api?.staff) {
        const res = await window.api.staff.getAll({ limit: 100 });
        setAllStaff(res.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
    }
  };

  const handleRefreshBankDetails = async (revealFull: boolean) => {
    if (!id) return;
    if (window.api?.staff) {
      const bank = await window.api.staff.getBankDetails(Number(id), revealFull);
      setBankDetails(bank || null);
    }
  };

  useEffect(() => {
    fetchStaffData();
    fetchReferenceData();
  }, [id]);

  const handleConfirmDeactivate = async () => {
    if (!staff) return;
    setDeactivateError(null);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.deactivate('', staff.id);
        if (res.success) {
          setIsDeactivateConfirmOpen(false);
          fetchStaffData();
        } else {
          setDeactivateError(res.error || 'Failed to deactivate staff member.');
        }
      }
    } catch (err: any) {
      setDeactivateError(err.message || 'Action failed.');
    }
  };

  const handleDeleteEmergencyContact = async (contactId: number) => {
    if (window.api?.staff) {
      const res = await window.api.staff.deleteEmergencyContact('', contactId);
      if (res.success) fetchStaffData();
    }
  };

  const handleVerifyDocument = async (docId: number, status: 'Pending' | 'Verified' | 'Rejected') => {
    if (window.api?.staff) {
      const res = await window.api.staff.verifyDocument('', docId, status);
      if (res.success) fetchStaffData();
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (window.api?.staff) {
      const res = await window.api.staff.deleteDocument('', docId);
      if (res.success) fetchStaffData();
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (window.api?.staff) {
      const res = await window.api.staff.deleteNote('', noteId);
      if (res.success) fetchStaffData();
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-medium">
        Loading employee profile data...
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-500 text-sm font-semibold">Staff record not found.</p>
        <Button variant="outline" onClick={() => navigate('/staff')}>
          Back to Staff Directory
        </Button>
      </div>
    );
  }

  const fullName = `${staff.first_name} ${staff.last_name || ''}`.trim();
  const completion = staff.profile_completion || 0;

  const tabs = [
    'Overview',
    'Personal',
    'Employment',
    'Contact',
    'Emergency',
    'Documents',
    'Bank / Payroll',
    'History',
    'Notes',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Directory
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => setIsPrintModalOpen(true)}>
            Print Profile
          </Button>
          <Button variant="outline" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => setIsEditPersonalOpen(true)}>
            Edit Profile
          </Button>
          {staff.status === 'ACTIVE' && (
            <Button
              variant="outline"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              icon={<Power className="w-3.5 h-3.5" />}
              onClick={() => setIsDeactivateConfirmOpen(true)}
            >
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {/* Hero Banner Header Card */}
      <Card className="p-0 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[#2818cf] via-indigo-600 to-purple-600 p-6 flex items-start justify-between">
          <span className="px-3.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs font-extrabold tracking-wider uppercase font-mono">
            {staff.staff_code}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
              staff.status === 'ACTIVE'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-200'
            }`}
          >
            ● {staff.status}
          </span>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-end gap-5 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden shrink-0 font-bold text-3xl text-[#2818cf]">
              {staff.photo_path ? (
                <img src={`file://${staff.photo_path}`} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                staff.first_name[0]
              )}
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{fullName}</h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {staff.designation_name} — <span className="text-[#2818cf] font-bold">{staff.department_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <div>
              <p className="text-[10px] text-slate-400">Joined Date</p>
              <p className="font-bold text-slate-900">{staff.joining_date}</p>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-400">Employment</p>
              <p className="font-bold text-slate-900">{staff.employment_type?.replace('_', ' ')}</p>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-400">Profile Completion</p>
              <p className="font-bold text-[#2818cf] font-mono">{completion}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-1 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#2818cf] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Render Selected Tab */}
      {activeTab === 'Overview' && (
        <OverviewTab
          staff={staff}
          emergencyContacts={emergencyContacts}
          bankDetails={bankDetails}
          documents={documents}
          notes={notes}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'Personal' && (
        <PersonalTab staff={staff} onEdit={() => setIsEditPersonalOpen(true)} />
      )}

      {activeTab === 'Employment' && (
        <EmploymentTab staff={staff} onEdit={() => setIsEditEmploymentOpen(true)} />
      )}

      {activeTab === 'Contact' && (
        <ContactTab staff={staff} onEdit={() => setIsEditContactOpen(true)} />
      )}

      {activeTab === 'Emergency' && (
        <EmergencyTab
          contacts={emergencyContacts}
          onAdd={() => {
            setSelectedEmergency(null);
            setIsEmergencyModalOpen(true);
          }}
          onEdit={(c) => {
            setSelectedEmergency(c);
            setIsEmergencyModalOpen(true);
          }}
          onDelete={handleDeleteEmergencyContact}
        />
      )}

      {activeTab === 'Documents' && (
        <DocumentsTab
          documents={documents}
          onUpload={() => setIsUploadDocOpen(true)}
          onVerify={handleVerifyDocument}
          onDelete={handleDeleteDocument}
        />
      )}

      {activeTab === 'Bank / Payroll' && (
        <BankTab
          bankDetails={bankDetails}
          onEdit={() => setIsBankModalOpen(true)}
          onRefreshBank={handleRefreshBankDetails}
        />
      )}

      {activeTab === 'History' && <HistoryTab history={history} />}

      {activeTab === 'Notes' && (
        <NotesTab
          notes={notes}
          onAddNote={() => setIsAddNoteOpen(true)}
          onDeleteNote={handleDeleteNote}
        />
      )}

      {/* Modals */}
      <EditPersonalModal
        isOpen={isEditPersonalOpen}
        onClose={() => setIsEditPersonalOpen(false)}
        onSuccess={fetchStaffData}
        staff={staff}
      />

      <EditEmploymentModal
        isOpen={isEditEmploymentOpen}
        onClose={() => setIsEditEmploymentOpen(false)}
        onSuccess={fetchStaffData}
        staff={staff}
        departments={departments}
        designations={designations}
        allStaff={allStaff}
      />

      <EditContactModal
        isOpen={isEditContactOpen}
        onClose={() => setIsEditContactOpen(false)}
        onSuccess={fetchStaffData}
        staff={staff}
      />

      <EmergencyContactModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSuccess={fetchStaffData}
        staffId={staff.id}
        contact={selectedEmergency}
      />

      <BankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={fetchStaffData}
        staffId={staff.id}
        existingBank={bankDetails}
      />

      <UploadDocumentModal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        onSuccess={fetchStaffData}
        staffId={staff.id}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onSuccess={fetchStaffData}
        staffId={staff.id}
      />

      <PrintStaffProfileModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        staff={staff}
      />

      {/* Deactivation Confirmation Modal */}
      {isDeactivateConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deactivate Staff Member?</h3>
                <p className="text-xs text-slate-500">{staff.staff_code} — {fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              The staff master record will be preserved in inactive status. Historical records, attendance, and audit logs will continue to reference this employee.
            </p>

            {deactivateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {deactivateError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsDeactivateConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDeactivate}>
                Deactivate Staff
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
