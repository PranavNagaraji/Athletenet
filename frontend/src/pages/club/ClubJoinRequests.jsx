import { useEffect, useState } from "react";
import { UserCheck, UserX, Loader2, Check, X } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubJoinRequests() {
  const [tab, setTab]       = useState("all"); // "all" | "athletes" | "coaches"
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actingId, setActingId] = useState(null);
  const [msg, setMsg]           = useState(null);

  const endpointMap = {
    all:     "/api/join-request/all-requests",
    athletes:"/api/join-request/athlete-requests",
    coaches: "/api/join-request/coach-requests",
  };

  const fetchRequests = async (t = tab) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}${endpointMap[t]}`, { credentials: "include" });
      const data = await res.json();
      // all-requests returns array directly; athlete/coach returns { athleteRequests/coachRequests }
      const list = Array.isArray(data)
        ? data
        : data.athleteRequests || data.coachRequests || [];
      setRequests(list);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(tab); }, [tab]);

  const handleAction = async (id, action) => {
    setActingId(id);
    const res = await fetch(`${API}/api/join-request/${action}/${id}`, {
      method: "PUT", credentials: "include",
    });
    if (res.ok) {
      setMsg({ type: "success", text: `Request ${action}ed successfully.` });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: action === "accept" ? "accepted" : "rejected" } : r));
    } else {
      const d = await res.json();
      setMsg({ type: "error", text: d.message });
    }
    setActingId(null);
    setTimeout(() => setMsg(null), 3000);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Join Requests</h1>
          <p>{pendingCount} pending {pendingCount === 1 ? "request" : "requests"}</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* Tabs */}
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.2rem" }}>
          {["all","athletes","coaches"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={tab === t ? "btn-primary" : "btn-ghost"}
              style={{ textTransform:"capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {loading ? (
            <div className="loading-state"><Loader2 size={20} className="spinner-icon" />Loading…</div>
          ) : requests.length === 0 ? (
            <div className="empty-state"><UserCheck size={36} /><p>No join requests found.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Message</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight:600 }}>{r.user?.name || "—"}</td>
                    <td style={{ color:"var(--c-muted)",fontSize:"0.85rem" }}>{r.user?.email || "—"}</td>
                    <td style={{ textTransform:"capitalize",color:"var(--c-muted)" }}>{r.user?.role || "—"}</td>
                    <td>
                      <div style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--c-muted)", fontSize: "0.85rem" }} title={r.message}>
                        {r.message || "—"}
                      </div>
                    </td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td>
                      {r.status === "pending" && (
                        <div style={{ display:"flex", gap:"0.4rem" }}>
                          <button
                            className="btn-success"
                            disabled={actingId === r._id}
                            onClick={() => handleAction(r._id, "accept")}>
                            {actingId === r._id ? <Loader2 size={12} className="spinner-icon" /> : <Check size={12} />}
                            Accept
                          </button>
                          <button
                            className="btn-danger"
                            disabled={actingId === r._id}
                            onClick={() => handleAction(r._id, "reject")}>
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
