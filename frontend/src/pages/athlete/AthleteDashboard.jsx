import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Send, Trophy, MessageSquare, Loader2,
  Compass, Activity, ArrowRight, MapPin, CalendarClock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonStat() {
  return (
    <div className="stat-card" style={{ pointerEvents: "none" }}>
      <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div className="skeleton skeleton-text" style={{ width: "50%", height: "2rem" }} />
        <div className="skeleton skeleton-text-sm" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

export default function AthleteDashboard() {
  const { user } = useAuth();
  const [athleteData, setAthleteData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/athlete/me`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API}/api/athlete/join-requests`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([athleteRes, requestsRes]) => {
        setAthleteData(athleteRes);
        setRequests(Array.isArray(requestsRes) ? requestsRes : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const joinedClubs = athleteData?.clubs?.length || 0;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const mySports = athleteData?.user?.sports?.length || 0;

  const statCards = [
    { icon: Building2, label: "Joined Clubs", value: joinedClubs, to: "/athlete/clubs", color: "#f97316" },
    { icon: Send, label: "Pending Requests", value: pendingRequests, to: "/athlete/requests", color: "#f59e0b" },
    { icon: Trophy, label: "My Sports", value: mySports, to: "/athlete/profile", color: "#3b82f6" },
    { icon: MessageSquare, label: "Teams", value: 0, to: "/athlete/teams", color: "#10b981" },
  ];

  const displayName = athleteData?.user?.name || user?.name || "Athlete";

  const quickActions = [
    { icon: Compass, title: "Browse Clubs", copy: "Find clubs that match your sport and goals.", to: "/athlete/clubs" },
    { icon: Activity, title: "Social Feed", copy: "Stay updated with your clubs and community.", to: "/athlete/feed" },
    { icon: Trophy, title: "Tournaments", copy: "Check upcoming events and competitions.", to: "/athlete/tournaments" },
    { icon: MapPin, title: "Book Turf", copy: "Find and reserve training facilities nearby.", to: "/athlete/playgrounds" },
    { icon: CalendarClock, title: "My Bookings", copy: "View and manage your upcoming sessions.", to: "/athlete/bookings" },
    { icon: Send, title: "My Requests", copy: "Track all your club join applications.", to: "/athlete/requests" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow">
            <Activity size={10} /> Athlete Portal
          </div>
          <h1>Dashboard</h1>
          <p>Welcome back, <strong style={{ color: "var(--theme-text)" }}>{displayName}</strong>. Here's your overview.</p>
        </div>
        <Link to="/athlete/clubs" className="btn-primary">
          <Compass size={15} /> Browse Clubs
        </Link>
      </div>

      <div className="page-body stack-lg">

        {/* Hero banner */}
        <div className="dashboard-hero animate-slide-up stagger-1">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div className="dashboard-kicker">Athlete Overview</div>
              <div className="dashboard-title">Build your journey</div>
              <p className="dashboard-sub">
                Track requests, manage your profile, and stay ready for clubs, teams, and tournaments.
              </p>
            </div>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", boxShadow: "var(--theme-glow)", flexShrink: 0
            }}>
              <Activity size={26} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row animate-slide-up stagger-2" style={{ marginBottom: 0 }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
            : statCards.map(({ icon: Icon, label, value, to, color }) => (
                <Link key={label} to={to} className="stat-card card-interactive" style={{ textDecoration: "none" }}>
                  <div className="stat-icon" style={{ background: `${color}1a`, color }}>
                    <Icon size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{value}</span>
                    <span className="stat-label">{label}</span>
                  </div>
                </Link>
              ))}
        </div>

        {/* Quick actions */}
        <div className="card animate-slide-up stagger-3">
          <div className="card-title">
            <Activity size={16} style={{ color: "var(--theme-primary)" }} />
            Quick Actions
          </div>
          <div className="quick-actions-grid">
            {quickActions.map(({ icon: Icon, title, copy, to }) => (
              <Link key={title} to={to} className="quick-action-card">
                <span className="quick-action-icon"><Icon size={18} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <ArrowRight size={14} className="quick-action-arrow" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent requests */}
        <div className="card animate-slide-up stagger-4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div className="card-title" style={{ margin: 0 }}>
              <Send size={16} style={{ color: "var(--theme-primary)" }} />
              Recent Join Requests
            </div>
            <Link to="/athlete/requests" className="btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div className="skeleton skeleton-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "grid", gap: "0.35rem" }}>
                    <div className="skeleton skeleton-text" style={{ width: "45%" }} />
                    <div className="skeleton skeleton-text-sm" style={{ width: "30%" }} />
                  </div>
                  <div className="skeleton skeleton-text-sm" style={{ width: 70 }} />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Send size={24} /></div>
              <h3>No requests sent yet</h3>
              <p>Browse clubs and apply to start building your athletic career.</p>
              <Link to="/athlete/clubs" className="btn-primary" style={{ marginTop: "0.5rem" }}>
                <Compass size={15} /> Discover Clubs
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Date Sent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 700 }}>{req.club?.name || "Unknown Club"}</td>
                      <td style={{ color: "var(--theme-muted)", fontSize: "0.85rem" }}>
                        {new Date(req.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>{req.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
