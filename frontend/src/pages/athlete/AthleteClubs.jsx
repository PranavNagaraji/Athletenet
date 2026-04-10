import { useEffect, useState } from "react";
import { AlertCircle, Compass, Loader2, Search, Send, UserPlus, X, Building2 } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonClubCard() {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.25rem" }}>
      <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
        <div className="skeleton skeleton-circle" style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "grid", gap: "0.4rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          <div className="skeleton skeleton-text-sm" style={{ width: "85%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {[80, 60, 100].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 24, width: w, borderRadius: 999 }} />
        ))}
      </div>
      <div className="skeleton skeleton-text-sm" style={{ width: "90%" }} />
      <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
    </div>
  );
}

export default function AthleteClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [sending, setSending] = useState(false);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  useEffect(() => {
    fetch(`${API}/api/club/all`)
      .then((r) => r.json())
      .then((data) => setClubs(Array.isArray(data) ? data : []))
      .catch(() => showMsg("error", "Failed to load clubs. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const handleJoinRequest = async () => {
    if (!selectedClub) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/join-request/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: selectedClub._id, message: requestMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Join request sent successfully!");
        setSelectedClub(null);
        setRequestMsg("");
      } else {
        showMsg("error", data.message || "Failed to send request.");
      }
    } catch {
      showMsg("error", "Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const filteredClubs = clubs.filter((club) => {
    const haystack = [
      club.name, club.admin?.name, club.specialization,
      ...(Array.isArray(club.facilities) ? club.facilities : []),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Compass size={10} /> Discovery</div>
          <h1>Browse Clubs</h1>
          <p>Discover clubs with the right sport focus, facilities, and culture for your next step.</p>
        </div>
      </div>

      <div className="page-body stack-lg">
        {/* Alert */}
        {msg && (
          <div className={`alert alert-${msg.type}`} role="alert">
            <AlertCircle size={15} /> {msg.text}
          </div>
        )}

        {/* Search */}
        <div className="search-shell" style={{ maxWidth: 560 }}>
          <div className="search-shell-icon"><Search size={16} /></div>
          <input
            type="text"
            className="search-shell-input"
            placeholder="Search by club name, sport, facility…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clubs"
          />
          {search && (
            <button type="button" className="search-shell-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="entity-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonClubCard key={i} />)}
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Compass size={24} /></div>
            <h3>{search ? "No clubs match your search" : "No clubs available"}</h3>
            <p>
              {search
                ? `Try searching for a different sport, facility, or club name.`
                : "Clubs will appear here once they are created. Check back soon!"}
            </p>
            {search && (
              <button className="btn-ghost btn-sm" onClick={() => setSearch("")} style={{ marginTop: "0.5rem" }}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontSize: "0.82rem", color: "var(--theme-muted)", fontWeight: 600 }}>
              {filteredClubs.length} club{filteredClubs.length !== 1 ? "s" : ""} {search ? `matching "${search}"` : "available"}
            </div>
            <div className="entity-grid">
              {filteredClubs.map((club) => {
                const clubName = club.name || club.admin?.name || "Official Club";
                const picture = club.profilePic || club.admin?.profilePic;
                const specialization = club.specialization || "Multi-sport Club";
                const facilities = Array.isArray(club.facilities) ? club.facilities.filter(Boolean) : [];
                const seasonsActive = club.establishedYear
                  ? `${Math.max(1, new Date().getFullYear() - Number(club.establishedYear))}+ seasons`
                  : "New program";

                return (
                  <div key={club._id} className="card entity-card card-interactive" style={{ padding: "1.25rem" }}>
                    <div className="entity-card-top">
                      <div className="avatar-badge round">
                        {picture ? (
                          <img src={`${API}${picture}`} alt={clubName} />
                        ) : (
                          <span>{clubName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3>{clubName}</h3>
                        <div className="entity-subtitle">{specialization}</div>
                      </div>
                    </div>

                    <div className="detail-pills">
                      <span className="pill pill-primary">{specialization}</span>
                      <span className="meta-pill">
                        {club.establishedYear ? `Est. ${club.establishedYear}` : "New setup"}
                      </span>
                      <span className="meta-pill">{seasonsActive}</span>
                      {facilities.length > 0 && (
                        <span className="meta-pill">{facilities.length} facilit{facilities.length === 1 ? "y" : "ies"}</span>
                      )}
                    </div>

                    {facilities.length > 0 ? (
                      <div className="detail-pills">
                        {facilities.slice(0, 3).map((fac) => (
                          <span key={fac} className="meta-pill">{fac}</span>
                        ))}
                        {facilities.length > 3 && (
                          <span className="meta-pill">+{facilities.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.82rem", color: "var(--theme-muted)", lineHeight: 1.55, margin: 0 }}>
                        No facilities listed yet — reach out to learn more.
                      </p>
                    )}

                    <button
                      className="btn-primary"
                      style={{ width: "100%", marginTop: "auto" }}
                      onClick={() => setSelectedClub(club)}
                    >
                      <UserPlus size={15} /> Request to Join
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Join Request Modal */}
      {selectedClub && (
        <div className="modal-backdrop" onClick={() => setSelectedClub(null)} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <div className="modal-title">
                  Join {selectedClub.name || selectedClub.admin?.name || "Club"}
                </div>
                <p className="modal-subtitle">
                  Introduce yourself — share your sport, level, and what you're looking for.
                </p>
              </div>
              <button className="btn-icon" onClick={() => setSelectedClub(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="join-message">Your Message</label>
              <textarea
                id="join-message"
                className="field-textarea"
                rows={4}
                placeholder="Hi, I play as a midfielder and I'm looking for structured training with strong match exposure…"
                value={requestMsg}
                onChange={(e) => setRequestMsg(e.target.value)}
              />
              <span className="field-hint">Keep it personal and concise. Clubs value a clear intro.</span>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setSelectedClub(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleJoinRequest} disabled={sending}>
                {sending ? <Loader2 size={15} className="spinner-icon" /> : <Send size={15} />}
                {sending ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
