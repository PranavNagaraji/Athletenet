import { useEffect, useState } from "react";
import { UserCheck, Loader2, Check, X, AlertCircle } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonRow() {
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div className="skeleton skeleton-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <div className="skeleton skeleton-text" style={{ width: 120 }} />
            <div className="skeleton skeleton-text-sm" style={{ width: 80 }} />
          </div>
        </div>
      </td>
      <td><div className="skeleton skeleton-text" style={{ width: 150 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 180 }} /></td>
      <td><div className="skeleton" style={{ width: 70, height: 22, borderRadius: 6 }} /></td>
      <td><div className="skeleton" style={{ width: 120, height: 30, borderRadius: 8 }} /></td>
    </tr>
  );
}

const endpointMap = {
  all: "/api/join-request/all-requests",
  athletes: "/api/join-request/athlete-requests",
  coaches: "/api/join-request/coach-requests",
};

export default function ClubJoinRequests() {
  const [tab, setTab] = useState("all");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchRequests = async (t = tab) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}${endpointMap[t]}`, { credentials: "include" });
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data.athleteRequests || data.coachRequests || [];
      setRequests(list);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(tab); }, [tab]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleAction = async (id, action) => {
    setActingId(id);
    try {
      const res = await fetch(`${API}/api/join-request/${action}/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        showMsg("success", `Request ${action === "accept" ? "accepted" : "rejected"} successfully.`);
        setRequests((prev) =>
          prev.map((r) =>
            r._id === id ? { ...r, status: action === "accept" ? "accepted" : "rejected" } : r
          )
        );
      } else {
        const d = await res.json();
        showMsg("error", d.message || "Action failed.");
      }
    } catch {
      showMsg("error", "Network error. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const allCount = requests.length;

  const tabConfigs = [
    { value: "all", label: "All Requests" },
    { value: "athletes", label: "Athletes" },
    { value: "coaches", label: "Coaches" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><UserCheck size={10} /> Recruitment</div>
          <h1>Join Requests</h1>
          <p>
            {loading
              ? "Loading requests…"
              : `${allCount} total · ${pendingCount} pending review`}
          </p>
        </div>
      </div>

      <div className="page-body stack-md">
        {/* Alert */}
        {msg && (
          <div className={`alert alert-${msg.type}`} role="alert">
            <AlertCircle size={15} /> {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="tab-bar">
          {tabConfigs.map(({ value, label }) => (
            <button
              key={value}
              className={`tab-btn ${tab === value ? "active" : ""}`}
              onClick={() => setTab(value)}
            >
              {label}
              {tab === value && !loading && (
                <span className="tab-count">{requests.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th><th>Email</th><th>Role</th><th>Message</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><UserCheck size={24} /></div>
              <h3>No requests found</h3>
              <p>
                {tab === "all"
                  ? "No join requests have been submitted yet."
                  : `No ${tab} requests at this time.`}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div className="avatar-badge round" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                            {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span style={{ fontWeight: 700 }}>{r.user?.name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--theme-muted)", fontSize: "0.85rem" }}>{r.user?.email || "—"}</td>
                      <td>
                        <span className="badge badge-inactive" style={{ textTransform: "capitalize" }}>
                          {r.user?.role || "—"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--theme-muted)", fontSize: "0.85rem" }}
                          title={r.message}
                        >
                          {r.message || "No message"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${r.status}`}>{r.status}</span>
                      </td>
                      <td>
                        {r.status === "pending" ? (
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              className="btn-success"
                              disabled={actingId === r._id}
                              onClick={() => handleAction(r._id, "accept")}
                              aria-label="Accept request"
                            >
                              {actingId === r._id
                                ? <Loader2 size={12} className="spinner-icon" />
                                : <Check size={12} />}
                              Accept
                            </button>
                            <button
                              className="btn-danger"
                              disabled={actingId === r._id}
                              onClick={() => handleAction(r._id, "reject")}
                              aria-label="Reject request"
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)" }}>—</span>
                        )}
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
