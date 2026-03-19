import { useEffect, useState } from "react";
import { Send, Loader2, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/athlete/join-requests`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setRequests(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Requests</h1>
          <p>Track your club join applications</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <Send size={40} />
            <p>You haven't sent any join requests yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {requests.map(req => (
              <div key={req._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.05rem", fontWeight: 600 }}>{req.club?.name || "Club"}</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--c-text)", fontStyle: "italic" }}>"{req.message || "No message provided."}"</p>
                  <p style={{ margin: "0.6rem 0 0 0", fontSize: "0.75rem", color: "var(--c-muted)" }}>
                    Sent on {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {req.status === "pending" && <span className="badge badge-pending"><Clock size={12}/> Pending</span>}
                  {req.status === "accepted" && <span className="badge badge-accepted"><CheckCircle2 size={12}/> Accepted</span>}
                  {req.status === "rejected" && <span className="badge badge-rejected"><XCircle size={12}/> Rejected</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
