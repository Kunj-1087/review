'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, BellDot, CheckCheck, X, Megaphone, MessageSquare, ShieldAlert, ChevronRight } from 'lucide-react';
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/lib/actions/notification';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'COMMENT_RECEIVED') return <MessageSquare className="w-4 h-4 text-accent" />;
  if (type === 'THRESHOLD_UNLOCKED') return <Megaphone className="w-4 h-4 text-verified" />;
  if (type === 'MODERATION_ACTION') return <ShieldAlert className="w-4 h-4 text-warning" />;
  return <Bell className="w-4 h-4 text-text-secondary" />;
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const result = await getNotificationsAction();
    setNotifications(result.notifications as Notification[]);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Refresh on open to get latest
      fetchNotifications();
    }
  };

  const handleMarkOneRead = async (id: string) => {
    await markNotificationReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={handleOpen}
        className="relative p-2 rounded-md bg-background-secondary hover:bg-border border border-border text-text-secondary hover:text-text-primary transition-colors"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellDot className="w-4 h-4 text-accent" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-accent text-white text-[9px] font-mono font-bold flex items-center justify-center px-0.5 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-panel"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background-secondary border border-border rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-serif font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono text-text-secondary hover:text-text-primary hover:bg-background-secondary border border-transparent hover:border-border transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>All read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-text-secondary font-mono">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center space-y-2">
                <Bell className="w-7 h-7 text-text-secondary mx-auto" />
                <p className="text-xs font-semibold text-text-primary">All caught up!</p>
                <p className="text-[11px] text-text-secondary">
                  You'll be notified when someone comments on your content or your college scorecard unlocks.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const item = (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 transition-colors flex items-start gap-3 group relative ${
                      notif.isRead
                        ? 'bg-background-secondary hover:bg-background'
                        : 'bg-accent/5 hover:bg-accent/10'
                    }`}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
                    )}

                    {/* Icon */}
                    <div className="shrink-0 mt-0.5 w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center">
                      <NotificationIcon type={notif.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-tight ${notif.isRead ? 'text-text-primary' : 'text-text-primary'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-mono text-text-secondary shrink-0 mt-0.5" suppressHydrationWarning>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.linkUrl && (
                        <span className="text-[11px] font-mono text-accent group-hover:underline flex items-center gap-0.5 mt-1">
                          View <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Mark read button */}
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkOneRead(notif.id);
                        }}
                        className="shrink-0 mt-0.5 p-1 rounded text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );

                return notif.linkUrl ? (
                  <Link
                    key={notif.id}
                    href={notif.linkUrl}
                    onClick={() => {
                      if (!notif.isRead) handleMarkOneRead(notif.id);
                      setIsOpen(false);
                    }}
                    className="block"
                  >
                    {item}
                  </Link>
                ) : (
                  <div key={notif.id}>{item}</div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-background text-center">
              <p className="text-[11px] font-mono text-text-secondary">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
