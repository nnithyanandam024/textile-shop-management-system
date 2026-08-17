import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Upload, FileText } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffId: number;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffId,
}) => {
  const [docType, setDocType] = useState('Identity Proof');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds maximum limit of 10MB.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a document file to upload.');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileBase64 = reader.result as string;
        if (window.api?.staff) {
          const res = await window.api.staff.uploadDocument('', {
            staff_id: staffId,
            document_type: docType,
            file_name: file.name,
            file_base64: fileBase64,
          });

          if (res.success) {
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'Failed to upload document.');
          }
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Staff Document</h3>
              <p className="text-xs text-slate-500">ID proof, address proof, or contracts</p>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Document Category *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            >
              <option value="Identity Proof">Identity Proof (Aadhaar, PAN, Passport)</option>
              <option value="Address Proof">Address Proof (Ration card, Bill)</option>
              <option value="Employment Contract">Employment Contract</option>
              <option value="Joining Document">Joining Document</option>
              <option value="Education Certificate">Education Certificate</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select File *</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2818cf] transition-all bg-slate-50/50">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              {file ? (
                <div>
                  <p className="text-xs font-bold text-slate-900">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <label className="cursor-pointer text-xs font-bold text-[#2818cf] hover:underline">
                  Choose Document File (PDF, PNG, JPG)
                  <input type="file" onChange={handleFileSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Upload Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
