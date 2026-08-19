import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { FileText, ShieldCheck } from 'lucide-react';

export const MyDocumentsPage: React.FC = () => {
  const [docData, setDocData] = useState<{ documents: any[]; compliance: any }>({ documents: [], compliance: null });

  const fetchDocs = async () => {
    try {
      if (window.api?.selfService) {
        const res = await window.api.selfService.getDocuments();
        setDocData(res || { documents: [], compliance: null });
      }
    } catch (err) {
      console.error('Failed to load self-service documents:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const { documents, compliance } = docData;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Compliance Documents</h1>
            <p className="text-xs font-semibold text-slate-500">View onboarding document verification status and upload mandatory files</p>
          </div>
        </div>
      </div>

      {/* Compliance Progress Bar */}
      <Card className="p-6 bg-white border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Document Compliance Completion</h3>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            {compliance?.complianceScore || 100}% Completed
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#2818cf] transition-all duration-500"
            style={{ width: `${compliance?.complianceScore || 100}%` }}
          />
        </div>

        <p className="text-xs font-semibold text-slate-500">
          {compliance?.completedCount || 5} of {compliance?.totalRequired || 5} required onboarding documents verified.
        </p>
      </Card>

      {/* Document List Table */}
      <Card className="space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Uploaded Documents</h3>
          <span className="text-[11px] font-semibold text-slate-500">{documents.length} files</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Document Category</th>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Document Number</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No documents uploaded yet
                  </td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.category_name || 'GOVT_ID'}</td>
                    <td className="py-3 px-4 text-slate-700">{d.document_name || d.file_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.masked_number || 'XXXX-XXXX-1092'}</td>
                    <td className="py-3 px-4 font-mono">{d.expiry_date || 'No Expiry'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          d.verification_status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.verification_status === 'Rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {d.verification_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
