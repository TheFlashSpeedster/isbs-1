import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import { getSocket } from "../utils/socket.js";

function iconFor(type) {
  if (type === "BOOKING_ASSIGNED") return "📥";
  if (type === "BOOKING_ACCEPTED") return "✅";
  if (type === "BOOKING_REJECTED") return "❌";
  if (type === "BOOKING_UPDATED") return "🚚";
  if (type === "NEW_MESSAGE") return "💬";
  if (type === "PAYMENT_UPDATE") return "💳";
  return "🔔";
}

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let socketRef = null;

    const load = async () => {
      try {
        const response = await api.get("/notifications");
        if (!mounted) return;
        setItems(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      } catch {
        if (!mounted) return;
        setItems([]);
      }
    };

    load();

    const onNotification = (notification) => {
      if (!mounted) return;
      setItems((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };

    getSocket()
      .then((socket) => {
        if (!mounted || !socket) return;
        socketRef = socket;
        socket.on("notification:new", onNotification);
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (socketRef) {
        socketRef.off("notification:new", onNotification);
      }
    };
  }, []);

  const latest = useMemo(() => items.slice(0, 8), [items]);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) => prev.map((item) => (item._id === id || item.id === id ? { ...item, read: true } : item)));
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } catch {
      return;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="mb-2 text-sm font-semibold text-gray-900">Notifications</div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {latest.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border border-gray-200">No notifications yet.</div>
            ) : (
              latest.map((item) => {
                const id = item._id || item.id;
                return (
                  <button
                    key={id}
                    onClick={() => markRead(id)}
                    className={`w-full rounded-lg p-3 text-left border transition-colors ${item.read ? "bg-gray-50 border-gray-200" : "bg-purple-50 border-purple-200"}`}
                  >
                    <div className="text-xs text-gray-700 font-medium">{iconFor(item.type)} {item.title}</div>
                    <div className="mt-1 text-xs text-gray-600">{item.message}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
