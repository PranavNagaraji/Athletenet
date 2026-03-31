import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Send, Trophy, MessageSquare, Loader2, Compass, Activity } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

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

  if (loading) {
    return <div className="loading-state"><Loader2 size={24} className="spinner-icon" /> Loading dashboard...</div>;
  }

  const joinedClubs = athleteData?.clubs?.length || 0;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const mySports = athleteData?.user?.sports?.length || 0;
  const myTeams = 0;

  const stats = [
    { icon: Building2, label: "Joined Clubs", value: joinedClubs, to: "/athlete/clubs", color: "#f97316" },
    { icon: Send, label: "Pending Requests", value: pendingRequests, to: "/athlete/requests", color: "#eab308" },
    { icon: Trophy, label: "My Sports", value: mySports, to: "/athlete/profile", color: "#3b82f6" },
    { icon: MessageSquare, label: "Messenger & Teams", value: myTeams, to: "/athlete/teams", color: "#10b981" },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, {athleteData?.user?.name || user?.name || "Athlete"}.</p>
        </div>
        <Link to="/athlete/clubs" className="btn-primary">
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
                Athlete Overview
              </div>
              <div style={{ fontSize: "2rem", lineHeight: 1, fontFamily: "'Bebas Neue', sans-serif", color: "var(--theme-text)", letterSpacing: "0.04em" }}>
                Build your athlete journey
              </div>
              <p style={{ margin: "0.65rem 0 0 0", color: "var(--theme-muted)", maxWidth: 620 }}>
                Track your requests, manage your profile, and stay ready for clubs, teams, and tournaments.
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
              <p>You haven't sent any club join requests yet.</p>
              <Link to="/athlete/clubs" className="btn-primary" style={{ marginTop: "1rem" }}>
                <Compass size={15} /> Discover Clubs
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
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
                      <td style={{ fontWeight: 700 }}>{req.club?.name || "Club"}</td>
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
