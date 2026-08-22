import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UploadDocumentModal } from './modals/UploadDocumentModal';
import { DocumentPreviewModal } from './modals/DocumentPreviewModal';
import { RejectDocumentModal } from './modals/RejectDocumentModal';
import {
  FileText,
  Upload,
  AlertTriangle,
  Eye,
  Check,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'expiring' | 'categories'>('all');

  // Data states
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<any | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedDocForReject, setSelectedDocForReject] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api?.documents) {
        const cats = await window.api.documents.getCategories();
        setCategories(cats || []);
        const docs = await window.api.documents.getAll();
        setDocuments(docs || []);
        const exp = await window.api.documents.getExpiring(30);
        setExpiringDocs(exp || []);
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
      }
    } catch (err) {
      console.error('Failed to load document data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (docId: number) => {
    if (window.api?.documents) {
      const res = await window.api.documents.verify(docId);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Verification failed.');
      }
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (selectedDocForReject && window.api?.documents) {
      const res = await window.api.documents.reject({
        documentId: selectedDocForReject.id,
        reason,
      });
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Rejection failed.');
      }
    }
  };

  const verifiedCount = documents.filter((d) => d.verification_status === 'VERIFIED').length;
  const pendingCount = documents.filter((d) => d.verification_status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Document & Compliance Hub</h1>
            <p className="text-xs font-semibold text-slate-500">Secure local storage, document classification, verification queue & expiry tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" icon={<Upload className="w-4 h-4" />} onClick={() => setIsUploadModalOpen(true)}>
            Upload Document
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Documents</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{documents.length}</p>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Verified Documents</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{verifiedCount}</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-100">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Pending Verification</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{pendingCount}</p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border border-rose-100">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Expiring / Expired</span>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{expiringDocs.length}</p>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Documents ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Verification ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'expiring'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Expiring & Expired ({expiringDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Categories & Rules ({categories.length})
        </button>
      </div>

      {/* TAB 1: ALL DOCUMENTS */}
      {activeTab === 'all' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Document Number</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.staff_code} — {d.first_name} {d.last_name || ''}</td>
                    <td className="py-3 px-4 font-bold text-[#2012ad]">{d.document_name} (v{d.version})</td>
                    <td className="py-3 px-4">{d.category_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.masked_document_number || 'N/A'}</td>
                    <td className="py-3 px-4">{d.expiry_date || 'No Expiry'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          d.verification_status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.verification_status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {d.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedDocForPreview(d);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === 'pending' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Uploaded File</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {documents.filter((d) => d.verification_status === 'PENDING').map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.staff_code} — {d.first_name} {d.last_name || ''}</td>
                    <td className="py-3 px-4 font-bold text-[#2012ad]">{d.document_name}</td>
                    <td className="py-3 px-4">{d.category_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.file_name}</td>
                    <td className="py-3 px-4">{d.created_at}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedDocForPreview(d);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedDocForReject(d);
                            setIsRejectModalOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Check className="w-3.5 h-3.5" />}
                          onClick={() => handleVerify(d.id)}
                        >
                          Verify
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: EXPIRING & EXPIRED */}
      {activeTab === 'expiring' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status Alert</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {expiringDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.staff_code} — {d.first_name} {d.last_name || ''}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.document_name}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{d.expiry_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${d.expiry_status === 'EXPIRED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {d.expiry_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Upload className="w-3.5 h-3.5" />}
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        Request Renewal
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: CATEGORIES & RULES */}
      {activeTab === 'categories' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Allowed File Types</th>
                  <th className="py-3 px-4">Max Size</th>
                  <th className="py-3 px-4">Expiry Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2012ad]">{c.code}</td>
                    <td className="py-3 px-4">{c.allowed_file_types}</td>
                    <td className="py-3 px-4">{c.max_file_size_mb} MB</td>
                    <td className="py-3 px-4">{c.requires_expiry ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
        categories={categories}
      />

      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        document={selectedDocForPreview}
      />

      <RejectDocumentModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        documentName={selectedDocForReject?.document_name}
      />
    </div>
  );
};
