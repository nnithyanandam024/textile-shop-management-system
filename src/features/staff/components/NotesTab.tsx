import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StickyNote, Plus, Trash2, User } from 'lucide-react';

interface NotesTabProps {
  notes: any[];
  onAddNote: () => void;
  onDeleteNote: (id: number) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
}) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Internal Staff Notes</h3>
            <p className="text-xs text-slate-500">Confidential internal management remarks & audit history</p>
          </div>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onAddNote}>
          Add Internal Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          No internal notes added for this staff member yet. Click "Add Internal Note" to record internal remarks.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{n.author_name || 'System Manager'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({n.created_at})</span>
                </div>

                <button
                  onClick={() => onDeleteNote(n.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                {n.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
