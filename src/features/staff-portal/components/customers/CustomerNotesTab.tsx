import React, { useState } from 'react';
import { StaffCustomerNoteItem } from '../../services/staffCustomerService';
import { FileText, Send, User } from 'lucide-react';

interface CustomerNotesTabProps {
  notes: StaffCustomerNoteItem[];
  onAddNote: (note: string) => Promise<any>;
}

export const CustomerNotesTab: React.FC<CustomerNotesTabProps> = ({
  notes,
  onAddNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setError(null);
    setSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
    } catch (err: any) {
      setError(err.message || 'Failed to add note.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-2xl">
      {/* Add Note Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2012ad]" />
          <span>Add Staff Note / Customer Remarks</span>
        </h4>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="e.g. Requested notification when festive silk sarees arrive; Prefers lightweight fabrics."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2012ad] placeholder:text-slate-400"
          />

          {error && (
            <div className="text-rose-600 text-xs font-extrabold">{error}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newNote.trim()}
              className="px-5 py-2 bg-[#2012ad] hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Post Note'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notes Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900">Notes & Interactions Timeline</h4>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {notes.length} Notes
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-semibold">
            No notes have been posted for this customer yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notes.map((n) => (
              <div key={n.id} className="p-6 space-y-2 hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#2012ad] flex items-center justify-center text-[10px] font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {n.authorName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium pl-8">
                  "{n.note}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
