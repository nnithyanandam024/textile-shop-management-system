import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      if (window.api?.communication) {
        const count = await window.api.communication.getUnreadCount();
        setUnreadCount(count || 0);
        const list = await window.api.communication.getMyNotifications({ isRead: 0 });
        setNotifications(list || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (window.api?.communication) {
      await window.api.communication.markAllRead();
      fetchUnread();
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (window.api?.communication) {
      await window.api.communication.markRead(notif.id);
      fetchUnread();
    }
    setIsOpen(false);
    navigate('/staff/communication');
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'HIGH':
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2012ad]" />
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-[#2012ad]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#2012ad] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark All Read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-semibold">
                No unread notifications
              </div>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="p-3.5 hover:bg-slate-50 cursor-pointer transition-all flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getPriorityIcon(n.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="font-bold text-slate-900 truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {n.created_at?.slice(11, 16) || 'Just now'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/staff/communication');
              }}
              className="text-xs font-extrabold text-[#2012ad] hover:underline"
            >
              View Notification Center →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
