import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
  categories: any[];
  initialStaffId?: number;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  categories,
  initialStaffId,
}) => {
  const [staffId, setStaffId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [documentName, setDocumentName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStaffId(initialStaffId || (staffList.length > 0 ? staffList[0].id : ''));
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setDocumentName('');
      setDocumentNumber('');
      setIssueDate('');
      setExpiryDate('');
      setSelectedFile(null);
      setError('');
    }
  }, [isOpen, initialStaffId, staffList, categories]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 10) {
        setError('Selected file size exceeds 10 MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId || !categoryId) {
      setError('Staff member and document category are required.');
      return;
    }
    if (!documentName.trim()) {
      setError('Document name is required.');
      return;
    }
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (window.api?.documents) {
        const res = await window.api.documents.upload({
          staff_id: Number(staffId),
          category_id: Number(categoryId),
          document_name: documentName.trim(),
          document_number: documentNumber.trim() || undefined,
          issue_date: issueDate || undefined,
          expiry_date: expiryDate || undefined,
          file_name: selectedFile.name,
          buffer,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to upload document.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
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
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Staff Document</h3>
              <p className="text-xs text-slate-500">Store compliance documents in secure local storage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Employee *</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="">Select Staff...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_code} — {s.first_name} {s.last_name || ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Document Title *"
            placeholder="e.g. Aadhaar Card / Employment Agreement"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            required
          />

          <Input
            label="Document Number (Masked in Roster)"
            placeholder="e.g. 5432-8765-1092"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload File (PDF/Image, Max 10MB) *</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                required
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-xs font-bold text-[#2818cf]">
                {selectedFile ? selectedFile.name : 'Click or Drag File to Upload'}
              </span>
              {selectedFile && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
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
