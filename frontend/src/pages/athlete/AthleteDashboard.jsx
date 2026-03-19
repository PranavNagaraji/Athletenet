import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Send, Building2, Loader2, Compass } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteDashboard() {
  const [athlete, setAthlete] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/athlete/me`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/api/athlete/join-requests`, { credentials: "include" }).then(r => r.json())
    ])
    .then(([athData, reqData]) => {
      setAthlete(athData);
      setRequests(Array.isArray(reqData) ? reqData : []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-state"><Loader2 size={24} className="spinner-icon" /> Loading Dashboard...</div>;
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const joinedClubsCount = athlete?.clubs?.length || 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Athlete Dashboard</h1>
          <p>Welcome back, {athlete?.user?.name || "Athlete"}!</p>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link to="/athlete/clubs" className="btn-primary">
            <Compass size={16} /> Browse Clubs
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(249,115,22,0.15)", color: "var(--c-primary)" }}>
              <Building2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{joinedClubsCount}</span>
              <span className="stat-label">Joined Clubs</span>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: "pointer", position: "relative" }}>
            <Link to="/athlete/requests" style={{ position: "absolute", inset: 0, zIndex: 10 }} />
            <div className="stat-icon" style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}>
              <Send size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{pendingCount}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">My Teams</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ marginTop: "2rem" }}>
          <div className="card-title"><Send size={16} /> Recent Join Requests</div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <Send size={32} />
              <p>You haven't sent any join requests yet.</p>
              <Link to="/athlete/clubs" className="btn-primary" style={{ marginTop: "1rem" }}><Compass size={15}/> Find Clubs</Link>
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
                  {requests.slice(0, 5).map(req => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 600 }}>{req.club?.name || "Club ID: " + req.club}</td>
                      <td style={{ color: "var(--c-muted)", fontSize: "0.85rem" }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status}
                        </span>
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
