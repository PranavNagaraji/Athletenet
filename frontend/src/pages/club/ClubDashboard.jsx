import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Building2,
  Loader2,
  MapPin,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubDashboard() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    athletes: 0,
    coaches: 0,
    teams: 0,
    requests: 0,
    competitions: 0,
    playgrounds: 0,
  });

  useEffect(() => {
    if (!user?._id) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          profileRes,
          reqRes,
          teamRes,
          compRes,
          athleteRes,
          coachRes,
          playgroundRes,
        ] = await Promise.all([
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

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={24} className="spinner-icon" /> Loading dashboard...
      </div>
    );
  }

  const clubName = club?.name || user?.name || "Official Club";
  const facilities = Array.isArray(club?.facilities) ? club.facilities.filter(Boolean) : [];
  const specialization = club?.specialization || "Multi-sport";
  const brandFields = [
    club?.name,
    club?.profilePic,
    club?.specialization,
    club?.establishedYear,
    facilities.length ? "facilities" : "",
  ].filter(Boolean).length;
  const brandCompletion = Math.round((brandFields / 5) * 100);

  const statCards = [
    { icon: Users, label: "Athletes", value: stats.athletes, to: "/club/members", color: "#f97316" },
    { icon: ShieldCheck, label: "Coaches", value: stats.coaches, to: "/club/members", color: "#3b82f6" },
    { icon: Activity, label: "Teams", value: stats.teams, to: "/club/teams", color: "#10b981" },
    { icon: UserCheck, label: "Pending Requests", value: stats.requests, to: "/club/join-requests", color: "#eab308" },
    { icon: MapPin, label: "Playgrounds", value: stats.playgrounds, to: "/club/playgrounds", color: "#06b6d4" },
    { icon: Trophy, label: "Competitions", value: stats.competitions, to: "/club/competitions", color: "#8b5cf6" },
  ];

  const quickActions = [
    {
      icon: Building2,
      title: "Refine Club Brand",
      copy: "Keep your identity polished so athletes and coaches trust the organization instantly.",
      to: "/club/profile",
    },
    {
      icon: UserCheck,
      title: "Review Requests",
      copy: "Approve incoming talent faster and keep your roster pipeline moving.",
      to: "/club/join-requests",
    },
    {
      icon: Users,
      title: "Manage Members",
      copy: "See your athlete and coach roster in one clean operational view.",
      to: "/club/members",
    },
    {
      icon: Activity,
      title: "Shape Teams",
      copy: "Organize squads, training groups, and staff communication with fewer clicks.",
      to: "/club/teams",
    },
    {
      icon: MapPin,
      title: "Run Venues",
      copy: "Update grounds, booking readiness, and schedule access across facilities.",
      to: "/club/playgrounds",
    },
    {
      icon: Trophy,
      title: "Launch Competitions",
      copy: "Promote your events and stay visible during the season cycle.",
      to: "/club/tournaments",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Club command center for roster growth, facilities, and competition readiness.</p>
        </div>
        <Link to="/club/profile" className="btn-primary">
          <Building2 size={15} /> Update Club Profile
        </Link>
      </div>

      <div className="page-body stack-lg">
        <section className="dashboard-hero">
          <div className="dashboard-hero-grid">
            <div>
              <div className="dashboard-kicker">Club Command Center</div>
              <div className="dashboard-title">{clubName}</div>
              <p className="dashboard-sub">
                Run members, requests, teams, venues, and event momentum from a single sports-operations view built for daily club work.
              </p>
              <div className="cluster-row" style={{ marginTop: "1rem" }}>
                <span className="pill pill-primary">{specialization}</span>
                {club?.establishedYear ? <span className="pill">Est. {club.establishedYear}</span> : null}
                <span className="pill">{stats.playgrounds} active venues</span>
                <span className="pill">{stats.teams} squads configured</span>
              </div>
            </div>

            <div className="dashboard-metric-grid">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <span className="dashboard-mini-label" style={{ marginBottom: 0 }}>Brand Strength</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "var(--font-heading)" }}>
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

        <div className="stats-row" style={{ marginBottom: 0 }}>
          {statCards.map(({ icon: Icon, label, value, to, color }) => (
            <Link key={label} to={to} className="stat-card" style={{ textDecoration: "none" }}>
              <div className="stat-icon" style={{ background: `${color}18`, color }}>
                <Icon size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="section-grid-2">
          <div className="card stack-md">
            <div className="card-title">Quick Actions</div>
            <div className="quick-actions-grid">
              {quickActions.map(({ icon: Icon, title, copy, to }) => (
                <Link key={title} to={to} className="quick-action-card">
                  <span className="quick-action-icon">
                    <Icon size={20} />
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="card stack-md">
            <div className="card-title">Operations Snapshot</div>
            <div className="detail-pills">
              <span className="meta-pill">{stats.requests} pending approvals</span>
              <span className="meta-pill">{stats.competitions} live competitions</span>
              <span className="meta-pill">{stats.playgrounds} managed grounds</span>
            </div>
            <div style={{ display: "grid", gap: "0.9rem" }}>
              <div style={{ padding: "1rem", borderRadius: 18, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)" }}>
                <div className="section-kicker" style={{ marginBottom: "0.45rem" }}>Priority Lane</div>
                <p style={{ margin: 0, color: "var(--theme-text)", lineHeight: 1.7 }}>
                  {stats.requests > 0
                    ? "You have fresh join requests waiting for a decision. Reviewing them quickly keeps your recruitment flow strong."
                    : "Your approval queue is clear. This is a good window to improve club branding, squads, and facilities."}
                </p>
              </div>
              <div style={{ padding: "1rem", borderRadius: 18, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)" }}>
                <div className="section-kicker" style={{ marginBottom: "0.45rem" }}>Club Identity</div>
                <p style={{ margin: 0, color: "var(--theme-muted)", lineHeight: 1.7 }}>
                  {facilities.length > 0
                    ? `Your club currently highlights ${facilities.length} facility ${facilities.length === 1 ? "asset" : "assets"}. Keep them current so bookings and discovery feel trustworthy.`
                    : "Add facilities, specialization, and imagery so athletes see a complete, high-confidence club profile."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card stack-md">
          <div className="card-title">Recent Join Requests</div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <UserCheck size={36} />
              <p>No join requests yet. New athlete and coach requests will surface here.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 700 }}>{item.user?.name || "-"}</td>
                      <td style={{ textTransform: "capitalize", color: "var(--theme-muted)" }}>{item.user?.role || "-"}</td>
                      <td>
                        <div
                          style={{
                            maxWidth: 260,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "var(--theme-muted)",
                          }}
                          title={item.message || ""}
                        >
                          {item.message || "No message shared"}
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
