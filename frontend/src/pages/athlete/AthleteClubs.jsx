import { useEffect, useState } from "react";
import { AlertCircle, Compass, Loader2, Search, Send, UserPlus, X } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

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
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    fetch(`${API}/api/club/all`)
      .then((response) => response.json())
      .then((data) => setClubs(Array.isArray(data) ? data : []))
      .catch(() => showMsg("error", "Failed to load clubs"))
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
        showMsg("success", "Join request sent.");
        setSelectedClub(null);
        setRequestMsg("");
      } else {
        showMsg("error", data.message || "Failed to send request.");
      }
    } catch {
      showMsg("error", "Network error.");
    } finally {
      setSending(false);
    }
  };

  const filteredClubs = clubs.filter((club) => {
    const haystack = [
      club.name,
      club.admin?.name,
      club.specialization,
      ...(Array.isArray(club.facilities) ? club.facilities : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Browse Clubs</h1>
          <p>Discover clubs with the right sport focus, facilities, and environment for your next step.</p>
        </div>
      </div>

      <div className="page-body stack-lg">
        {msg ? (
          <div className={`alert alert-${msg.type}`}>
            <AlertCircle size={15} /> {msg.text}
          </div>
        ) : null}

        <div className="search-shell">
          <div className="search-shell-icon">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="search-shell-input"
            placeholder="Search by club, sport, or facility..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <button type="button" className="search-shell-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={24} className="spinner-icon" /> Loading clubs...
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="empty-state">
            <Compass size={40} />
            <p>No clubs found for that search. Try another sport, facility, or club name.</p>
          </div>
        ) : (
          <div className="entity-grid">
            {filteredClubs.map((club) => {
              const clubName = club.name || club.admin?.name || "Official Club";
              const picture = club.profilePic || club.admin?.profilePic;
              const specialization = club.specialization || "Multi-sport Club";
              const facilities = Array.isArray(club.facilities) ? club.facilities.filter(Boolean) : [];
              const seasonsActive = club.establishedYear
                ? `${Math.max(1, new Date().getFullYear() - Number(club.establishedYear))}+ seasons`
                : "Growing program";

              return (
                <div key={club._id} className="card entity-card" style={{ padding: "1.2rem" }}>
                  <div className="entity-card-top">
                    <div className="avatar-badge round">
                      {picture ? (
                        <img src={`${API}${picture}`} alt={clubName} />
                      ) : (
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800 }}>
                          {clubName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3>{clubName}</h3>
                      <div className="entity-subtitle">
                        {specialization} and athlete-first development with a sharper, modern club presence.
                      </div>
                    </div>
                  </div>

                  <div className="detail-pills">
                    <span className="pill pill-primary">{specialization}</span>
                    <span className="meta-pill">{club.establishedYear ? `Est. ${club.establishedYear}` : "New setup"}</span>
                    <span className="meta-pill">{seasonsActive}</span>
                    <span className="meta-pill">{facilities.length} facilities</span>
                  </div>

                  <div style={{ color: "var(--theme-muted)", lineHeight: 1.7, minHeight: 54 }}>
                    {facilities.length > 0
                      ? `Featured facilities: ${facilities.slice(0, 3).join(", ")}${facilities.length > 3 ? "..." : ""}`
                      : "This club has not listed facilities yet, but you can still connect and learn more."}
                  </div>

                  {facilities.length > 0 ? (
                    <div className="detail-pills">
                      {facilities.slice(0, 4).map((facility) => (
                        <span key={facility} className="meta-pill">{facility}</span>
                      ))}
                    </div>
                  ) : null}

                  <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "auto" }} onClick={() => setSelectedClub(club)}>
                    <UserPlus size={16} /> Request to Join
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedClub ? (
        <div className="modal-backdrop" onClick={() => setSelectedClub(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div className="modal-title">Join {selectedClub.name || selectedClub.admin?.name || "Club"}</div>
              <button className="btn-ghost" style={{ padding: "0.3rem" }} onClick={() => setSelectedClub(null)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--theme-muted)", marginBottom: "1rem", lineHeight: 1.7 }}>
              Introduce yourself with your primary sport, current level, and the kind of environment you want to train in.
            </p>
            <div className="field-group">
              <label className="field-label">Message</label>
              <textarea
                className="field-input"
                rows="4"
                placeholder="Hi, I play as a midfielder and I am looking for structured training with strong match exposure..."
                value={requestMsg}
                onChange={(event) => setRequestMsg(event.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setSelectedClub(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleJoinRequest} disabled={sending}>
                {sending ? <Loader2 size={16} className="spinner-icon" /> : <Send size={16} />} Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
