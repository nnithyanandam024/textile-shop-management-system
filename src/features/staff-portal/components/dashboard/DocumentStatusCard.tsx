import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { FileCheck, ArrowRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface DocumentItem {
  name: string;
  verified: boolean;
  status: string;
}

interface DocumentStatusCardProps {
  totalRequired: number;
  verifiedCount: number;
  completionPercentage: number;
  items: DocumentItem[];
  expiringAlert?: {
    documentName: string;
    daysRemaining: number;
    expiryDate: string;
  };
}

export const DocumentStatusCard: React.FC<DocumentStatusCardProps> = ({
  totalRequired = 5,
  verifiedCount = 5,
  completionPercentage = 100,
  items = [],
  expiringAlert,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 shadow-sm">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Document Compliance Status
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              {verifiedCount} of {totalRequired} documents verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-[#2818cf] font-mono">
            {completionPercentage}%
          </span>
          <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                completionPercentage === 100 ? 'bg-emerald-500' : 'bg-[#2818cf]'
              }`}
              style={{ width: `${Math.max(5, completionPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expiring Alert Banner if any */}
      {expiringAlert && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-800 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span>
              1 document needs attention: <strong>{expiringAlert.documentName}</strong> expires in{' '}
              {expiringAlert.daysRemaining} days ({expiringAlert.expiryDate}).
            </span>
          </div>
        </div>
      )}

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {items.map((doc, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              doc.verified
                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                : 'bg-slate-50 border-slate-200/80 text-slate-600'
            }`}
          >
            {doc.verified ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="truncate">{doc.name}</span>
          </div>
        ))}
      </div>

      {/* Bottom Trigger */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={() => navigate('/self-service/documents')}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-indigo-50/80 text-slate-700 hover:text-[#2818cf] border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all group"
        >
          <span>View Documents</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
};
