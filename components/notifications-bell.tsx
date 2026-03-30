"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Ticket, FileText, MessageSquare, AlertTriangle, Check } from "lucide-react";
import { notificationsService } from "@/lib/services";
import { formatRelativeTime } from "@/lib/format";
import type { Notification } from "@/lib/types";

const typeIcons: Record<string, { icon: typeof Ticket; color: string }> = {
  TICKET_CREATED: { icon: Ticket, color: "text-neon" },
  TICKET_STATUS_CHANGED: { icon: Ticket, color: "text-blue-400" },
  TICKET_CLOSED: { icon: Ticket, color: "text-white/40" },
  RECEIPT_CREATED: { icon: FileText, color: "text-emerald-400" },
  RECEIPT_VOIDED: { icon: FileText, color: "text-red-400" },
  HOUR_PACK_WARNING: { icon: AlertTriangle, color: "text-yellow-400" },
  COMMENT_ADDED: { icon: MessageSquare, color: "text-blue-400" },
};

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsService.list(20);
      // The response wraps data in api response format
      const payload = res.data as any;
      if (payload?.data) {
        setNotifications(payload.data);
        setUnreadCount(payload.unreadCount ?? 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleMarkAllRead() {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }

  function handleClick(n: Notification) {
    // Mark as read
    if (!n.read) {
      notificationsService.markAsRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Navigate to resource
    if (n.resourceType === "ticket" && n.resourceId) {
      router.push(`/tickets/${n.resourceId}`);
    } else if (n.resourceType === "receipt" && n.resourceId) {
      router.push(`/comprobantes/${n.resourceId}`);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/8 bg-[#111117] shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-neon hover:text-neon/80 transition-colors cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = typeIcons[n.type] ?? { icon: Bell, color: "text-white/40" };
                const Icon = config.icon;

                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/3 cursor-pointer ${
                      !n.read ? "bg-neon/3" : ""
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 mt-0.5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!n.read ? "font-medium text-white" : "text-white/60"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                        )}
                      </div>
                      <p className="text-xs text-white/30 truncate">{n.message}</p>
                      <p className="text-[10px] text-white/20 mt-0.5">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
