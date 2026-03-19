import { useEffect, useState } from "react";
import { Send, Loader2, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CoachRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/coach/join-request`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setRequests(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Join Requests</h1>
          <p>Track the status of your club applications</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
             <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading requests...</div>
          ) : requests.length === 0 ? (
             <div className="empty-state">
              <Send size={40} />
              <p>You haven't sent any join requests yet.</p>
              <Link to="/coach/clubs" className="btn-primary" style={{ marginTop: "1rem" }}><Compass size={15}/> Browse Clubs</Link>
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
                  {requests.map(req => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 600 }}>{req.club?.name || "Club ID: " + req.club}</td>
                      <td>
                        <div style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--c-muted)", fontSize: "0.85rem" }} title={req.message}>
                          {req.message || "—"}
                        </div>
                      </td>
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
