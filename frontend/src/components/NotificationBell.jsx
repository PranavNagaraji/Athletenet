import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, X, AlertCircle, UserCheck, Send, CalendarClock, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;
const STORAGE_KEY = "an_seen_notifications";

function getSeenIds(userId) {
  if (!userId) return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${userId}`) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeenIds(userId, ids) {
  if (!userId) return;
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify([...ids]));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const absDiff = Math.abs(diff);
  const s = Math.floor(absDiff / 1000);

  if (diff < 0) {
    if (s < 60) return "starting soon";
    const m = Math.floor(s / 60);
    if (m < 60) return `in ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `in ${h}h`;
    return `in ${Math.floor(h / 24)}d`;
  }

  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function buildEventNotifications(role, events) {
  const now = Date.now();
  const href = role === "coach" ? "/coach/events" : "/athlete/events";

  return (Array.isArray(events) ? events : []).flatMap((event) => {
    const eventTime = new Date(event.date).getTime();
    const diffHours = (eventTime - now) / (1000 * 60 * 60);

    if (diffHours < 0 || diffHours > 168) {
      return [];
    }

    let idSuffix = "upcoming";
    let title = "Upcoming Event";
    let body = `${event.title} is on your schedule.`;
    let urgent = false;

    if (diffHours <= 2) {
      idSuffix = "soon";
      title = "Starting Soon";
      body = `${event.title} starts within 2 hours.`;
      urgent = true;
    } else if (diffHours <= 24) {
      idSuffix = "day";
      title = "Event Reminder";
      body = `${event.title} is coming up within the next 24 hours.`;
      urgent = true;
    } else {
      body = `${event.title} is coming up on ${new Date(event.date).toLocaleDateString()}.`;
    }

    return [{
      id: `event-${idSuffix}-${event._id}`,
      icon: "calendar",
      title,
      body,
      time: event.date,
      href,
      urgent,
    }];
  });
}

function buildPerformanceNotifications(ratings) {
  return (Array.isArray(ratings) ? ratings : []).slice(0, 6).map((rating) => ({
    id: `performance-${rating._id}`,
    icon: "star",
    title: "Performance Review Updated",
    body: `${rating.coach?.name || "Your coach"} rated you ${Number(rating.overallScore || 0).toFixed(1)}/5.`,
    time: rating.updatedAt || rating.createdAt,
    href: "/athlete/profile",
    urgent: Number(rating.overallScore || 0) >= 4,
  }));
}

function buildInviteNotifications(role, invites) {
  return (Array.isArray(invites) ? invites : []).slice(0, 8).map((invite) => {
    const clubName = invite.club?.name || "A club";
    const status = invite.status || "pending";
    const isPending = status === "pending";
    const isAccepted = status === "accepted";

    return {
      id: `invite-${status}-${invite._id}`,
      icon: isPending ? "send" : isAccepted ? "check" : "alert",
      title: isPending ? "New Club Invitation" : isAccepted ? "Invite Accepted" : "Invite Rejected",
      body: isPending
        ? `${clubName} invited you to join their club.`
        : isAccepted
          ? `You accepted the invitation from ${clubName}.`
          : `You rejected the invitation from ${clubName}.`,
      time: invite.updatedAt || invite.createdAt,
      href: role === "coach" ? "/coach/invites" : "/athlete/invites",
      urgent: isPending,
    };
  });
}

function buildNotifications(role, data) {
  const notifications = [];
  const now = Date.now();

  if (role === "club") {
    const requests = Array.isArray(data?.requests) ? data.requests : [];
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
    const requests = Array.isArray(data?.requests) ? data.requests : [];
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

    notifications.push(...buildInviteNotifications(role, data?.invites));
    notifications.push(...buildEventNotifications(role, data?.events));

    if (role === "athlete") {
      notifications.push(...buildPerformanceNotifications(data?.performance));
    }
  }

  return notifications.sort((a, b) => {
    const aTime = new Date(a.time).getTime();
    const bTime = new Date(b.time).getTime();
    const aFuture = aTime > now;
    const bFuture = bTime > now;

    if (aFuture && bFuture) return aTime - bTime;
    if (!aFuture && !bFuture) return bTime - aTime;
    return aFuture ? -1 : 1;
  });
}

const IconMap = {
  usercheck: <UserCheck size={14} />,
  check: <Check size={14} />,
  send: <Send size={14} />,
  alert: <AlertCircle size={14} />,
  calendar: <CalendarClock size={14} />,
  star: <Star size={14} />,
};

export default function NotificationBell({ role }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(new Set());
  const panelRef = useRef();

  useEffect(() => {
    if (user?._id) {
      setSeenIds(getSeenIds(user._id));
    }
  }, [user?._id]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      if (role === "club") {
        const res = await fetch(`${API}/api/join-request/all-requests`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(buildNotifications(role, { requests: Array.isArray(data) ? data : [] }));
        return;
      }

      if (role === "athlete") {
        const [requestsRes, eventsRes, performanceRes] = await Promise.all([
          fetch(`${API}/api/athlete/join-requests`, { credentials: "include" }),
          fetch(`${API}/api/athlete/events`, { credentials: "include" }),
          fetch(`${API}/api/athlete/performance`, { credentials: "include" }),
        ]);

        const [requestsData, eventsData, performanceData] = await Promise.all([
          requestsRes.ok ? requestsRes.json() : [],
          eventsRes.ok ? eventsRes.json() : [],
          performanceRes.ok ? performanceRes.json() : [],
        ]);

        const invitesRes = await fetch(`${API}/api/invite/received`, { credentials: "include" });
        const invitesData = invitesRes.ok ? await invitesRes.json() : [];

        setNotifications(buildNotifications(role, {
          requests: Array.isArray(requestsData) ? requestsData : [],
          events: Array.isArray(eventsData) ? eventsData : [],
          performance: Array.isArray(performanceData) ? performanceData : [],
          invites: Array.isArray(invitesData) ? invitesData : [],
        }));
        return;
      }

      if (role === "coach") {
        const [requestsRes, eventsRes, invitesRes] = await Promise.all([
          fetch(`${API}/api/coach/join-request`, { credentials: "include" }),
          fetch(`${API}/api/coach/events`, { credentials: "include" }),
          fetch(`${API}/api/invite/received`, { credentials: "include" }),
        ]);

        const [requestsData, eventsData, invitesData] = await Promise.all([
          requestsRes.ok ? requestsRes.json() : [],
          eventsRes.ok ? eventsRes.json() : [],
          invitesRes.ok ? invitesRes.json() : [],
        ]);

        setNotifications(buildNotifications(role, {
          requests: Array.isArray(requestsData) ? requestsData : [],
          events: Array.isArray(eventsData) ? eventsData : [],
          invites: Array.isArray(invitesData) ? invitesData : [],
        }));
      }
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
    const allIds = new Set([...seenIds, ...notifications.map((n) => n.id)]);
    setSeenIds(allIds);
    saveSeenIds(user?._id, allIds);
  };

  const markOneRead = (id) => {
    const updated = new Set(seenIds);
    updated.add(id);
    setSeenIds(updated);
    saveSeenIds(user?._id, updated);
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
