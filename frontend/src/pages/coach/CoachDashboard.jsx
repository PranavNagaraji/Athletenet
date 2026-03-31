import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Send, Building2, Loader2, Compass, Activity } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

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

  if (loading) {
    return <div className="loading-state"><Loader2 size={24} className="spinner-icon" /> Loading dashboard...</div>;
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const joinedClubsCount = coach?.clubs?.length || 0;
  const yearsExperience = coach?.experience || 0;
  const myTeams = 0;

  const stats = [
    { icon: Building2, label: "Joined Clubs", value: joinedClubsCount, to: "/coach/clubs", color: "#f97316" },
    { icon: Send, label: "Pending Requests", value: pendingCount, to: "/coach/requests", color: "#eab308" },
    { icon: Activity, label: "Experience", value: yearsExperience, to: "/coach/profile", color: "#3b82f6" },
    { icon: Users, label: "My Teams", value: myTeams, to: "/coach/teams", color: "#10b981" },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, {coach?.user?.name || "Coach"}.</p>
        </div>
        <Link to="/coach/clubs" className="btn-primary">
          <Compass size={16} /> Browse Clubs
        </Link>
      </div>

      <div className="page-body">
        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 12%, var(--theme-surface)) 0%, var(--theme-surface) 62%)",
            border: "1px solid color-mix(in srgb, var(--theme-primary) 24%, var(--theme-border))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--theme-primary)", marginBottom: "0.5rem" }}>
                Coach Overview
              </div>
              <div style={{ fontSize: "2rem", lineHeight: 1, fontFamily: "'Bebas Neue', sans-serif", color: "var(--theme-text)", letterSpacing: "0.04em" }}>
                Build your coaching presence
              </div>
              <p style={{ margin: "0.65rem 0 0 0", color: "var(--theme-muted)", maxWidth: 620 }}>
                Track your requests, manage your coaching identity, and stay ready for clubs, teams, and future opportunities.
              </p>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 14px 30px rgba(249,115,22,0.24)" }}>
              <Activity size={28} />
            </div>
          </div>
        </div>

        <div className="stats-row">
          {stats.map(({ icon: Icon, label, value, to, color }) => (
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

        <div className="card">
          <div className="card-title"><Send size={16} /> Recent Join Requests</div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <Send size={36} />
              <p>You haven't sent any join requests yet.</p>
              <Link to="/coach/clubs" className="btn-primary" style={{ marginTop: "1rem" }}>
                <Compass size={15} /> Find Clubs
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Message</th>
                    <th>Date Sent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 700 }}>{req.club?.name || `Club ID: ${req.club}`}</td>
                      <td>
                        <div style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--theme-muted)", fontSize: "0.88rem" }} title={req.message}>
                          {req.message || "-"}
                        </div>
                      </td>
                      <td style={{ color: "var(--theme-muted)", fontSize: "0.85rem" }}>
                        {new Date(req.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
