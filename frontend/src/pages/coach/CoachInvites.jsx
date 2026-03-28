import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Inbox, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CoachInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadInvites = () => {
    setLoading(true);
    fetch(`${API}/api/invite/received`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load invites");
        return res.json();
      })
      .then((data) => setInvites(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const updateInvite = async (id, action) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API}/api/invite/${action}/${id}`, {
        method: "PUT",
        credentials: "include"
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Unable to update invite");
      }
      await loadInvites();
    } catch (error) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Invitations</h1>
          <p>Review incoming coaching invitations from clubs and accept the ones you want.</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-state"><Loader2 size={24} className="spinner-icon" /> Loading invites...</div>
        ) : invites.length === 0 ? (
          <div className="empty-state">
            <Inbox size={40} />
            <p>No invitations available right now.</p>
            <Link to="/coach/clubs" className="btn-primary" style={{ marginTop: "1rem" }}><Compass size={15} /> Browse Clubs</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {invites.map((invite) => (
              <div key={invite._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>{invite.club?.name || "Club Invitation"}</h3>
                  <p style={{ margin: "0.5rem 0 0", color: "var(--theme-muted)", fontSize: "0.9rem" }}>
                    {invite.message || "You have been invited to join this club."}
                  </p>
                  <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.8rem", color: "var(--theme-muted)" }}>
                    Sent on {new Date(invite.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", alignItems: "flex-end" }}>
                  <span className={`badge badge-${invite.status}`}>{invite.status}</span>
                  <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {invite.status === "pending" && (
                      <>
                        <button
                          className="btn-primary"
                          disabled={processingId === invite._id}
                          onClick={() => updateInvite(invite._id, "accept")}
                          style={{ minWidth: 100 }}
                        >
                          {processingId === invite._id ? "Working..." : "Accept"}
                        </button>
                        <button
                          className="btn-ghost"
                          disabled={processingId === invite._id}
                          onClick={() => updateInvite(invite._id, "reject")}
                          style={{ minWidth: 100 }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
