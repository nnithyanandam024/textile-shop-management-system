import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { HeartHandshake, Plus, Edit2, Trash2, Phone, Star } from 'lucide-react';

interface EmergencyTabProps {
  contacts: any[];
  onAdd: () => void;
  onEdit: (contact: any) => void;
  onDelete: (id: number) => void;
}

export const EmergencyTab: React.FC<EmergencyTabProps> = ({
  contacts,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Emergency Contacts</h3>
            <p className="text-xs text-slate-500">Designated family & emergency contact directory</p>
          </div>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onAdd}>
          Add Emergency Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          No emergency contacts registered. Click "Add Emergency Contact" to configure primary contact info.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border transition-all ${
                c.is_primary
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-slate-50/60 border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                  {c.is_primary ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-rose-600" />
                      Primary Contact
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-semibold text-slate-700">
                <p><span className="text-slate-400 text-[10px]">Relationship:</span> {c.relationship}</p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone: {c.phone} {c.alternate_phone ? `/ ${c.alternate_phone}` : ''}</span>
                </p>
                {c.address && <p className="text-[11px] text-slate-500">{c.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
