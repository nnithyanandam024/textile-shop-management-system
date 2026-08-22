import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CreateAnnouncementModal } from './modals/CreateAnnouncementModal';
import { SendMessageModal } from './modals/SendMessageModal';
import {
  Bell,
  Megaphone,
  MessageSquare,
  CheckCheck,
  Send,
  Clock,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

export const CommunicationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements' | 'messages' | 'preferences'>('notifications');

  // Data states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Modals
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api?.communication) {
        const notifs = await window.api.communication.getMyNotifications();
        setNotifications(notifs || []);
        const anns = await window.api.communication.getAnnouncements();
        setAnnouncements(anns || []);
        const msgs = await window.api.communication.getMyMessages();
        setMessages(msgs || []);
      }
      if (window.api?.staff) {
        const s = await window.api.staff.getAll({ limit: 500 });
        setStaffList(s.staff || []);
      }
    } catch (err) {
      console.error('Failed to load communication data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id: number) => {
    if (window.api?.communication) {
      await window.api.communication.markRead(id);
      fetchData();
    }
  };

  const handleMarkAllRead = async () => {
    if (window.api?.communication) {
      await window.api.communication.markAllRead();
      fetchData();
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2012ad] shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Communication & Notifications</h1>
            <p className="text-xs font-semibold text-slate-500">Centralized notification hub, company announcements & staff messaging</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<Send className="w-4 h-4" />} onClick={() => setIsMessageModalOpen(true)}>
            Send Message
          </Button>
          <Button variant="primary" icon={<Megaphone className="w-4 h-4" />} onClick={() => setIsAnnouncementModalOpen(true)}>
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Notifications</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{notifications.length}</p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-100">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Unread Alerts</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{unreadCount}</p>
        </Card>

        <Card className="p-4 bg-indigo-50/50 border border-indigo-100">
          <span className="text-[10px] font-extrabold text-[#2012ad] uppercase tracking-wider">Active Announcements</span>
          <p className="text-xl font-extrabold text-[#2012ad] mt-1">{announcements.length}</p>
        </Card>

        <Card className="p-4 bg-cyan-50/50 border border-cyan-100">
          <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider">Direct Messages</span>
          <p className="text-xl font-extrabold text-cyan-800 mt-1">{messages.length}</p>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notification Feed ({notifications.length})
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Announcements ({announcements.length})
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'messages'
                ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Direct Messages ({messages.length})
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'preferences'
                ? 'bg-indigo-50 text-[#2012ad] border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {activeTab === 'notifications' && unreadCount > 0 && (
          <Button size="sm" variant="outline" icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* TAB 1: NOTIFICATION FEED */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 font-semibold">
              No notifications found
            </Card>
          ) : (
            notifications.map((n) => (
              <Card
                key={n.id}
                className={`p-4 transition-all flex items-start gap-4 border ${
                  !n.is_read ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200/80'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-600'
                      : n.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-indigo-100 text-[#2012ad]'
                  }`}
                >
                  {n.priority === 'URGENT' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : n.priority === 'HIGH' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{n.title}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600">
                        {n.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{n.created_at}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-semibold">{n.message}</p>
                </div>

                {!n.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}>
                    Mark Read
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5 space-y-3 bg-white border border-slate-200/80">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-base">{a.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    a.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-700'
                      : a.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-50 text-[#2012ad]'
                  }`}
                >
                  {a.priority}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-relaxed">{a.content}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Target: {a.target_type}</span>
                <span>Published: {a.created_at?.slice(0, 10)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: DIRECT MESSAGES */}
      {activeTab === 'messages' && (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Message Preview</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.sender_name || 'System Manager'}</td>
                    <td className="py-3 px-4 font-bold text-[#2012ad]">{m.subject}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{m.message}</td>
                    <td className="py-3 px-4 font-bold">{m.priority}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{m.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: PREFERENCES & REPORTS */}
      {activeTab === 'preferences' && (
        <Card className="p-6 space-y-6 max-w-2xl bg-white border border-slate-200/80">
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Notification Preferences</h3>
            <p className="text-xs text-slate-500">Configure alert channels for in-app and native Electron desktop pop-ups</p>
          </div>

          <div className="space-y-4">
            {[
              { type: 'Shift & Schedule Alerts', desc: 'Shift reassignment and timing updates' },
              { type: 'Leave Request Status', desc: 'Approval and rejection notifications' },
              { type: 'Payroll & Payslip Alerts', desc: 'Salary processing and incentive announcements' },
              { type: 'Performance Evaluation Alerts', desc: 'Review cycle deadlines and appraisal recommendations' },
              { type: 'Document Expiry Warnings', desc: 'Compliance document expiry alerts' },
            ].map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.type}</p>
                  <p className="text-[11px] text-slate-500">{p.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#2012ad]" />
                    In-App
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#2012ad]" />
                    Desktop
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onSuccess={fetchData}
      />

      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onSuccess={fetchData}
        staffList={staffList}
      />
    </div>
  );
};
