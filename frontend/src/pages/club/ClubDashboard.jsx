import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Building2, Loader2, MapPin, ShieldCheck,
  Trophy, UserCheck, Users, ArrowRight, TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonStat() {
  return (
    <div className="stat-card" style={{ pointerEvents: "none" }}>
      <div className="skeleton skeleton-stat" style={{ height: 40, width: 40, borderRadius: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div className="skeleton skeleton-text" style={{ width: "50%", height: "2rem" }} />
        <div className="skeleton skeleton-text-sm" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

export default function ClubDashboard() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    athletes: 0, coaches: 0, teams: 0, requests: 0, competitions: 0, playgrounds: 0,
  });

  useEffect(() => {
    if (!user?._id) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, reqRes, teamRes, compRes, athleteRes, coachRes, playgroundRes] =
          await Promise.all([
            fetch(`${API}/api/club/profile`, { credentials: "include" }),
            fetch(`${API}/api/join-request/all-requests`, { credentials: "include" }),
            fetch(`${API}/api/team/club/${user._id}`, { credentials: "include" }),
            fetch(`${API}/api/competition`, { credentials: "include" }),
            fetch(`${API}/api/club/athlete/${user._id}`, { credentials: "include" }),
            fetch(`${API}/api/club/coaches/${user._id}`, { credentials: "include" }),
            fetch(`${API}/api/playground/nearby?latitude=0&longitude=0&distance=20000000`, { credentials: "include" }),
          ]);

        const profileData = profileRes.ok ? await profileRes.json() : null;
        const reqData = reqRes.ok ? await reqRes.json() : [];
        const teamData = teamRes.ok ? await teamRes.json() : [];
        const compData = compRes.ok ? await compRes.json() : [];
        const athleteData = athleteRes.ok ? await athleteRes.json() : [];
        const coachData = coachRes.ok ? await coachRes.json() : [];
        const playgroundData = playgroundRes.ok ? await playgroundRes.json() : [];

        const clubId = profileData?._id;
        const ownPlaygrounds = Array.isArray(playgroundData)
          ? playgroundData.filter((pg) => pg.club === clubId || pg.club?._id === clubId)
          : [];
        const safeRequests = Array.isArray(reqData) ? reqData : [];

        setClub(profileData);
        setRequests(safeRequests.slice(0, 5));
        setStats({
          athletes: Array.isArray(athleteData) ? athleteData.length : 0,
          coaches: Array.isArray(coachData) ? coachData.length : 0,
          teams: Array.isArray(teamData) ? teamData.length : 0,
          requests: safeRequests.filter((item) => item.status === "pending").length,
          competitions: Array.isArray(compData) ? compData.length : 0,
          playgrounds: ownPlaygrounds.length,
        });
      } catch (error) {
        console.error(error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const clubName = club?.name || user?.name || "Official Club";
  const facilities = Array.isArray(club?.facilities) ? club.facilities.filter(Boolean) : [];
  const specialization = club?.specialization || "Multi-sport";

  const brandFields = [
    club?.name, club?.profilePic, club?.specialization,
    club?.establishedYear, facilities.length ? "facilities" : "",
  ].filter(Boolean).length;
  const brandCompletion = Math.round((brandFields / 5) * 100);

  const statCards = [
    { icon: Users, label: "Athletes", value: stats.athletes, to: "/club/members", color: "#f97316" },
    { icon: ShieldCheck, label: "Coaches", value: stats.coaches, to: "/club/members", color: "#3b82f6" },
    { icon: Activity, label: "Teams", value: stats.teams, to: "/club/teams", color: "#10b981" },
    { icon: UserCheck, label: "Pending", value: stats.requests, to: "/club/join-requests", color: "#f59e0b" },
    { icon: MapPin, label: "Venues", value: stats.playgrounds, to: "/club/playgrounds", color: "#06b6d4" },
    { icon: Trophy, label: "Competitions", value: stats.competitions, to: "/club/tournaments", color: "#8b5cf6" },
  ];

  const quickActions = [
    { icon: Building2, title: "Club Profile", copy: "Refine branding, imagery, and identity.", to: "/club/profile" },
    { icon: UserCheck, title: "Join Requests", copy: "Review & approve incoming talent.", to: "/club/join-requests" },
    { icon: Users, title: "Manage Members", copy: "View your full athlete & coach roster.", to: "/club/members" },
    { icon: Activity, title: "Team Setup", copy: "Organize squads and training groups.", to: "/club/teams" },
    { icon: MapPin, title: "Venues", copy: "Manage grounds and booking readiness.", to: "/club/playgrounds" },
    { icon: Trophy, title: "Competitions", copy: "Launch events and stay in the season.", to: "/club/tournaments" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow">
            <TrendingUp size={10} /> Club Command Center
          </div>
          <h1>Dashboard</h1>
          <p>Roster, facilities, and competition readiness — all in one view.</p>
        </div>
        <Link to="/club/profile" className="btn-primary">
          <Building2 size={15} /> Update Profile
        </Link>
      </div>

      <div className="page-body stack-lg">

        {/* Hero section */}
        <section className="dashboard-hero animate-slide-up stagger-1">
          <div className="dashboard-hero-grid">
            <div>
              <div className="dashboard-kicker">Club Command Center</div>
              <div className="dashboard-title">{clubName}</div>
              <p className="dashboard-sub">
                Run rosters, requests, teams, venues, and events from a single view built for daily club operations.
              </p>
              <div className="cluster-row" style={{ marginTop: "1rem" }}>
                <span className="pill pill-primary">{specialization}</span>
                {club?.establishedYear ? <span className="pill">Est. {club.establishedYear}</span> : null}
                <span className="pill">{stats.playgrounds} active venues</span>
                <span className="pill">{stats.teams} squads</span>
              </div>
            </div>

            <div className="dashboard-metric-grid">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="dashboard-mini-label" style={{ marginBottom: 0 }}>Brand Strength</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "var(--font-heading)", letterSpacing: "0.02em" }}>
                  {brandCompletion}%
                </span>
              </div>
              <div className="dashboard-progress">
                <span style={{ width: `${brandCompletion}%` }} />
              </div>
              <div className="dashboard-mini-grid">
                <div className="dashboard-mini-card">
                  <div className="dashboard-mini-label">Facilities</div>
                  <div className="dashboard-mini-value">{facilities.length}</div>
                </div>
                <div className="dashboard-mini-card">
                  <div className="dashboard-mini-label">Athletes</div>
                  <div className="dashboard-mini-value">{stats.athletes}</div>
                </div>
                <div className="dashboard-mini-card">
                  <div className="dashboard-mini-label">Coaches</div>
                  <div className="dashboard-mini-value">{stats.coaches}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats row */}
        <div className="stats-row animate-slide-up stagger-2" style={{ marginBottom: 0 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)
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

        {/* Grid bottom section */}
        <div className="section-grid-2 animate-slide-up stagger-3">
          {/* Quick actions */}
          <div className="card stack-md">
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

          {/* Ops snapshot */}
          <div className="card stack-md">
            <div className="card-title">
              <TrendingUp size={16} style={{ color: "var(--theme-primary)" }} />
              Operations Snapshot
            </div>
            <div className="detail-pills">
              <span className="meta-pill">{stats.requests} pending approvals</span>
              <span className="meta-pill">{stats.competitions} competitions</span>
              <span className="meta-pill">{stats.playgrounds} venues</span>
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ padding: "1rem", borderRadius: 14, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)" }}>
                <div className="section-kicker" style={{ marginBottom: "0.45rem" }}>Priority Lane</div>
                <p style={{ margin: 0, color: "var(--theme-text)", lineHeight: 1.65, fontSize: "0.88rem" }}>
                  {stats.requests > 0
                    ? `${stats.requests} join request${stats.requests > 1 ? "s" : ""} waiting for review. Quick decisions keep your recruitment pipeline strong.`
                    : "Your approval queue is clear. Great time to update club branding, squads, and facilities."}
                </p>
              </div>
              <div style={{ padding: "1rem", borderRadius: 14, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)" }}>
                <div className="section-kicker" style={{ marginBottom: "0.45rem" }}>Club Identity</div>
                <p style={{ margin: 0, color: "var(--theme-muted)", lineHeight: 1.65, fontSize: "0.88rem" }}>
                  {facilities.length > 0
                    ? `Showcasing ${facilities.length} facilit${facilities.length === 1 ? "y" : "ies"}. Keep them current so athletes see a high-confidence profile.`
                    : "Add facilities, specialization, and a photo so athletes see a complete, trustworthy club."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent requests */}
        <div className="card animate-slide-up stagger-4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div className="card-title" style={{ margin: 0 }}>
              <UserCheck size={16} style={{ color: "var(--theme-primary)" }} />
              Recent Join Requests
            </div>
            <Link to="/club/join-requests" className="btn-ghost btn-sm">
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
              <div className="empty-state-icon"><UserCheck size={24} /></div>
              <h3>No requests yet</h3>
              <p>New athlete and coach requests will show up here once they apply.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div className="avatar-badge round" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                            {item.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span style={{ fontWeight: 700, color: "var(--theme-text)" }}>{item.user?.name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize", color: "var(--theme-muted)", fontSize: "0.85rem" }}>
                        {item.user?.role || "—"}
                      </td>
                      <td>
                        <div style={{ maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--theme-muted)", fontSize: "0.85rem" }}
                          title={item.message || ""}>
                          {item.message || "No message"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
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
