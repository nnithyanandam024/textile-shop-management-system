import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, FileText, Download } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('application/pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && document) {
      setLoading(true);
      setError('');
      if (window.api?.documents) {
        window.api.documents.readBase64(document.id)
          .then((res) => {
            if (res.success && res.base64) {
              setBase64Data(res.base64);
              setMimeType(res.mimeType || 'application/pdf');
            } else {
              setError(res.error || 'Failed to load document content.');
            }
          })
          .catch((err) => setError(err.message || 'Error reading file.'))
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const dataUri = base64Data ? `data:${mimeType};base64,${base64Data}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{document.document_name}</h3>
              <p className="text-xs text-slate-500">
                {document.staff_code} — {document.first_name} {document.last_name || ''} ({document.category_name})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dataUri && (
              <a href={dataUri} download={document.file_name}>
                <Button size="sm" variant="outline" icon={<Download className="w-4 h-4" />}>
                  Download
                </Button>
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-6 flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
          {loading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-[#2818cf] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Loading document preview...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center">
              {error}
            </div>
          ) : mimeType.startsWith('image/') ? (
            <img src={dataUri} alt={document.document_name} className="max-w-full max-h-[65vh] rounded-xl shadow-md object-contain" />
          ) : (
            <iframe src={dataUri} title={document.document_name} className="w-full h-[65vh] rounded-xl border border-slate-200" />
          )}
        </div>
      </div>
    </div>
  );
};
