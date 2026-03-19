import { useEffect, useState } from "react";
import { Users, UserCheck, ClubIcon, Trophy, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, requests: 0, teams: 0, competitions: 0, playgrounds: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reqRes, teamRes, compRes] = await Promise.all([
          fetch(`${API}/api/join-request/all-requests`, { credentials: "include" }),
          fetch(`${API}/api/team/club/${user?._id}`, { credentials: "include" }),
          fetch(`${API}/api/competition`, { credentials: "include" }),
        ]);
        const reqData  = reqRes.ok  ? await reqRes.json()  : [];
        const teamData = teamRes.ok ? await teamRes.json() : [];
        const compData = compRes.ok ? await compRes.json() : [];

        setRequests((reqData).slice(0, 5));
        setStats({
          requests:     Array.isArray(reqData) ? reqData.filter(r => r.status === "pending").length : 0,
          teams:        Array.isArray(teamData) ? teamData.length : 0,
          competitions: Array.isArray(compData) ? compData.length : 0,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (user) fetchAll();
  }, [user]);

  const statCards = [
    { icon: UserCheck, label: "Pending Requests", value: stats.requests,    color: "#fbbf24", to: "/club/join-requests" },
    { icon: ClubIcon,  label: "Teams",             value: stats.teams,       color: "#818cf8", to: "/club/teams"         },
    { icon: Trophy,    label: "Competitions",       value: stats.competitions,color: "#f97316", to: "/club/competitions"  },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}. Here's your club overview.</p>
        </div>
        <Link to="/club/join-requests" className="btn-primary">
          <UserCheck size={15} /> View Requests
        </Link>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-state"><Loader2 size={20} className="spinner-icon" /> Loading dashboard…</div>
        ) : (
          <>
            <div className="stats-row">
              {statCards.map(({ icon: Icon, label, value, color, to }) => (
                <Link key={label} to={to} className="stat-card" style={{ textDecoration: "none" }}>
                  <div className="stat-icon" style={{ background: `${color}18`, color }}>
                    <Icon size={18} />
                  </div>
                  <span className="stat-value">{value}</span>
                  <span className="stat-label">{label}</span>
                </Link>
              ))}
            </div>

            <div className="card">
              <div className="card-title"><TrendingUp size={16} /> Recent Join Requests</div>
              {requests.length === 0 ? (
                <div className="empty-state"><UserCheck size={36} /><p>No join requests yet.</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Role</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r._id}>
                        <td>{r.user?.name || "—"}</td>
                        <td style={{ textTransform: "capitalize" }}>{r.user?.role || "—"}</td>
                        <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
