import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Send, Building2, Compass, Activity,
  ArrowRight, UserRound, Trophy
} from "lucide-react";
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

export default function CoachDashboard() {
  const [coach, setCoach] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/coach/me`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API}/api/coach/join-request`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([coachData, reqData]) => {
        setCoach(coachData);
        setRequests(Array.isArray(reqData) ? reqData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const joinedClubsCount = coach?.clubs?.length || 0;
  const yearsExperience = coach?.experience || 0;

  const statCards = [
    { icon: Building2, label: "Joined Clubs", value: joinedClubsCount, to: "/coach/joined-clubs", color: "#f97316" },
    { icon: Send, label: "Pending Requests", value: pendingCount, to: "/coach/requests", color: "#f59e0b" },
    { icon: Activity, label: "Years Experience", value: yearsExperience, to: "/coach/profile", color: "#3b82f6" },
    { icon: Users, label: "Teams", value: 0, to: "/coach/teams", color: "#10b981" },
  ];

  const displayName = coach?.user?.name || "Coach";

  const quickActions = [
    { icon: UserRound, title: "My Profile", copy: "Update your coaching identity and experience.", to: "/coach/profile" },
    { icon: Compass, title: "Browse Clubs", copy: "Find clubs that match your coaching style.", to: "/coach/clubs" },
    { icon: Users, title: "My Teams", copy: "View and manage the teams you coach.", to: "/coach/teams" },
    { icon: Send, title: "My Requests", copy: "Track all your club applications.", to: "/coach/requests" },
    { icon: Trophy, title: "Tournaments", copy: "Stay on top of coaching events.", to: "/coach/clubs" },
    { icon: Activity, title: "Activity", copy: "Your recent platform interactions.", to: "/coach/clubs" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow">
            <Activity size={10} /> Coach Portal
          </div>
          <h1>Dashboard</h1>
          <p>Welcome back, <strong style={{ color: "var(--theme-text)" }}>{displayName}</strong>. Here's your overview.</p>
        </div>
        <Link to="/coach/clubs" className="btn-primary">
          <Compass size={15} /> Browse Clubs
        </Link>
      </div>

      <div className="page-body stack-lg">

        {/* Hero banner */}
        <div className="dashboard-hero animate-slide-up stagger-1">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div className="dashboard-kicker">Coach Overview</div>
              <div className="dashboard-title">Build your presence</div>
              <p className="dashboard-sub">
                Track your applications, manage your coaching identity, and stay connected with clubs and teams.
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
            <Link to="/coach/requests" className="btn-ghost btn-sm">
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
              <h3>No applications sent</h3>
              <p>Browse clubs and apply to start building your coaching career.</p>
              <Link to="/coach/clubs" className="btn-primary" style={{ marginTop: "0.5rem" }}>
                <Compass size={15} /> Find Clubs
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 700 }}>{req.club?.name || `Club`}</td>
                      <td>
                        <div style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--theme-muted)", fontSize: "0.85rem" }}
                          title={req.message}>
                          {req.message || "—"}
                        </div>
                      </td>
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
