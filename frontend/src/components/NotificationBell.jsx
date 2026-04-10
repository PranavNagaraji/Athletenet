import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, X, AlertCircle, UserCheck, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;
const STORAGE_KEY = "an_seen_notifications";

function getSeenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function buildNotifications(role, data) {
  const notifications = [];

  if (role === "club") {
    const requests = Array.isArray(data) ? data : [];
    const pending = requests.filter((r) => r.status === "pending");
    const recent = requests.slice(0, 8);

    pending.forEach((r) => {
      notifications.push({
        id: `req-pending-${r._id}`,
        icon: "usercheck",
        title: "New Join Request",
        body: `${r.user?.name || "Someone"} wants to join your club.`,
        time: r.createdAt,
        href: "/club/join-requests",
        urgent: true,
      });
    });

    recent
      .filter((r) => r.status !== "pending")
      .slice(0, 3)
      .forEach((r) => {
        notifications.push({
          id: `req-done-${r._id}`,
          icon: "check",
          title: r.status === "accepted" ? "Request Accepted" : "Request Rejected",
          body: `${r.user?.name || "Member"}'s request was ${r.status}.`,
          time: r.updatedAt || r.createdAt,
          href: "/club/join-requests",
          urgent: false,
        });
      });
  } else {
    // athlete / coach
    const requests = Array.isArray(data) ? data : [];
    requests.slice(0, 8).forEach((r) => {
      if (r.status === "pending") {
        notifications.push({
          id: `sent-pending-${r._id}`,
          icon: "send",
          title: "Request Pending",
          body: `Your request to ${r.club?.name || "a club"} is awaiting review.`,
          time: r.createdAt,
          href: role === "coach" ? "/coach/requests" : "/athlete/requests",
          urgent: false,
        });
      } else {
        notifications.push({
          id: `sent-done-${r._id}`,
          icon: r.status === "accepted" ? "check" : "alert",
          title: r.status === "accepted" ? "Request Accepted! 🎉" : "Request Rejected",
          body: `${r.club?.name || "A club"} ${r.status === "accepted" ? "accepted" : "rejected"} your join request.`,
          time: r.updatedAt || r.createdAt,
          href: role === "coach" ? "/coach/requests" : "/athlete/requests",
          urgent: r.status === "accepted",
        });
      }
    });
  }

  return notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
}

const IconMap = {
  usercheck: <UserCheck size={14} />,
  check: <Check size={14} />,
  send: <Send size={14} />,
  alert: <AlertCircle size={14} />,
};

export default function NotificationBell({ role }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(getSeenIds);
  const panelRef = useRef();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      let url = "";
      if (role === "club") url = `${API}/api/join-request/all-requests`;
      else if (role === "athlete") url = `${API}/api/athlete/join-requests`;
      else if (role === "coach") url = `${API}/api/coach/join-request`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setNotifications(buildNotifications(role, list));
    } catch {
      // silently fail
    }
  }, [role, user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setSeenIds(allIds);
    saveSeenIds(allIds);
  };

  const markOneRead = (id) => {
    const updated = new Set(seenIds);
    updated.add(id);
    setSeenIds(updated);
    saveSeenIds(updated);
  };

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div ref={panelRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={`Notifications (${unreadCount} unread)`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "var(--radius-md)",
          background: open ? "color-mix(in srgb, var(--theme-primary) 12%, var(--theme-surface-2))" : "var(--theme-surface-2)",
          border: `1px solid ${open ? "color-mix(in srgb, var(--theme-primary) 30%, var(--theme-border))" : "var(--theme-border-strong)"}`,
          color: open ? "var(--theme-primary)" : "var(--theme-text)",
          cursor: "pointer",
          transition: "all var(--transition-fast)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: "999px",
            background: "var(--theme-danger)",
            border: "2px solid var(--theme-bg)",
            color: "#fff",
            fontSize: "0.58rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
            animation: "zoomIn 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 340,
            background: "var(--theme-surface)",
            border: "1px solid var(--theme-border-strong)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--theme-shadow-lg)",
            zIndex: 200,
            overflow: "hidden",
            animation: "zoomIn 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.1rem 0.75rem",
            borderBottom: "1px solid var(--theme-border)",
          }}>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--theme-text)" }}>
                Notifications
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--theme-muted)", fontWeight: 600 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.35rem 0.65rem", borderRadius: "var(--radius-sm)",
                    background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)",
                    color: "var(--theme-muted)", fontSize: "0.72rem", fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <CheckCheck size={12} /> Mark all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: "var(--radius-sm)",
                  background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)",
                  color: "var(--theme-muted)", cursor: "pointer",
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                color: "var(--theme-muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <Bell size={28} opacity={0.3} />
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text-soft)" }}>No notifications yet</div>
                <div style={{ fontSize: "0.8rem" }}>Activity will appear here.</div>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !seenIds.has(n.id);
                return (
                  <a
                    key={n.id}
                    href={n.href}
                    onClick={() => { markOneRead(n.id); setOpen(false); }}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.85rem 1.1rem",
                      borderBottom: "1px solid var(--theme-border)",
                      textDecoration: "none",
                      background: isUnread
                        ? "color-mix(in srgb, var(--theme-primary) 4%, var(--theme-surface))"
                        : "var(--theme-surface)",
                      transition: "background var(--transition-fast)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--theme-surface-2)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isUnread
                        ? "color-mix(in srgb, var(--theme-primary) 4%, var(--theme-surface))"
                        : "var(--theme-surface)")
                    }
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "var(--radius-sm)",
                      background: n.urgent
                        ? "color-mix(in srgb, var(--theme-primary) 14%, var(--theme-surface-2))"
                        : "var(--theme-surface-2)",
                      border: `1px solid ${n.urgent ? "color-mix(in srgb, var(--theme-primary) 24%, var(--theme-border))" : "var(--theme-border)"}`,
                      color: n.urgent ? "var(--theme-primary)" : "var(--theme-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {IconMap[n.icon]}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" }}>
                        <div style={{
                          fontSize: "0.82rem", fontWeight: isUnread ? 800 : 700,
                          color: "var(--theme-text)", lineHeight: 1.3,
                        }}>
                          {n.title}
                        </div>
                        {isUnread && (
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "var(--theme-primary)", flexShrink: 0, marginTop: 4,
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--theme-muted)", lineHeight: 1.45, margin: "0.18rem 0 0.22rem" }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--theme-surface-4)", fontWeight: 700 }}>
                        {timeAgo(n.time)}
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
