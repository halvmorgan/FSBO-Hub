import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, Calendar, Mail, Sparkles, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { InAppNotification } from '../../types/saas';

interface NotificationBellProps {
  onSelectTab?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onSelectTab }) => {
  const { notifications, unreadNotifsCount, markNotificationRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    if (notif.linkTab && onSelectTab) {
      onSelectTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'showing':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'inquiry':
        return <Mail className="w-4 h-4 text-sky-600" />;
      case 'billing':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#FF6B5A]" />;
    }
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-stone-600 hover:text-[#0F2A44] hover:bg-stone-100 dark:text-stone-300 dark:hover:text-white dark:hover:bg-stone-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotifsCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B5A] text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-stone-900 animate-pulse">
            {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F2A44] dark:text-white uppercase tracking-wider">
              Notifications
            </span>
            <span className="text-[11px] text-stone-500">
              {unreadNotifsCount} unread
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                You're all caught up! No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    notif.read
                      ? 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/40 opacity-70'
                      : 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#0F2A44] dark:text-white leading-snug">
                      {notif.title}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#FF6B5A] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
