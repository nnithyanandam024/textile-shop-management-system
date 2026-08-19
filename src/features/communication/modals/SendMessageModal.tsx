import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { X, Send, AlertCircle } from 'lucide-react';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: any[];
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
}) => {
  const [recipientStaffId, setRecipientStaffId] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !message.trim()) {
      setError('Subject and message content are required.');
      return;
    }

    setLoading(true);
    try {
      if (window.api?.communication) {
        const res = await window.api.communication.sendMessage({
          recipient_staff_id: recipientStaffId ? Number(recipientStaffId) : undefined,
          subject: subject.trim(),
          message: message.trim(),
          priority,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to send message.');
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
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Send Direct Message</h3>
              <p className="text-xs text-slate-500">Send private message to staff member</p>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Employee</label>
              <select
                value={recipientStaffId}
                onChange={(e) => setRecipientStaffId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="">Select Employee...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_code} — {s.first_name} {s.last_name || ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <Input
            label="Subject *"
            placeholder="e.g. Schedule Update for Tomorrow"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Message Body *</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Type your message..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2818cf]/20 focus:border-[#2818cf]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
