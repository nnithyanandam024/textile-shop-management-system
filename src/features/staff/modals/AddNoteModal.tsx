import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, StickyNote } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffId: number;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffId,
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!note.trim()) {
      setError('Note text cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.staff) {
        const res = await window.api.staff.addNote('', {
          staff_id: staffId,
          note: note.trim(),
        });

        if (res.success) {
          setNote('');
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to save note.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
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
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Internal Staff Note</h3>
              <p className="text-xs text-slate-500">Internal management remarks & notes</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Note Content *</label>
            <textarea
              rows={4}
              placeholder="e.g. Handles VIP customers. Assigned to morning shift."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf] resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Note
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
