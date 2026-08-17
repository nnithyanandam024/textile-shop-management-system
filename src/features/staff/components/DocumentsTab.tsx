import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FileText, Plus, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

interface DocumentsTabProps {
  documents: any[];
  onUpload: () => void;
  onVerify: (id: number, status: 'Pending' | 'Verified' | 'Rejected') => void;
  onDelete: (id: number) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onUpload,
  onVerify,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredDocs =
    selectedCategory === 'ALL'
      ? documents
      : documents.filter((d) => d.document_type === selectedCategory);

  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Staff Documents Repository</h3>
            <p className="text-xs text-slate-500">Identity proofs, contracts, address proofs & certificates</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Document Types</option>
            <option value="Identity Proof">Identity Proof</option>
            <option value="Address Proof">Address Proof</option>
            <option value="Employment Contract">Employment Contract</option>
            <option value="Joining Document">Joining Document</option>
            <option value="Education Certificate">Education Certificate</option>
            <option value="Other">Other</option>
          </select>

          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onUpload}>
            Upload Document
          </Button>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          No documents found. Click "Upload Document" to upload identity proofs or employment contracts.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Document Category</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded Info</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-all">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {doc.document_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#2818cf]">
                    {doc.file_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {(doc.file_size / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-900">{doc.uploader_name || 'System'}</p>
                    <p className="text-[10px] text-slate-400">{doc.uploaded_at}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.verification_status === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.verification_status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {doc.verification_status === 'Verified' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                      {doc.verification_status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-500" />}
                      {doc.verification_status === 'Pending' && <Clock className="w-3 h-3 text-amber-500" />}
                      {doc.verification_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {doc.verification_status !== 'Verified' && (
                        <button
                          onClick={() => onVerify(doc.id, 'Verified')}
                          className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100"
                        >
                          Verify
                        </button>
                      )}
                      {doc.verification_status !== 'Rejected' && (
                        <button
                          onClick={() => onVerify(doc.id, 'Rejected')}
                          className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
