


import { useEffect, useState } from "react";
import { Users, Compass, Search, X, UserPlus, Send, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonCard() {
  return (
    <div className="card">
      <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
        <div className="skeleton skeleton-circle" style={{ width: 48, height: 48, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "grid", gap: "0.4rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "55%" }} />
          <div className="skeleton skeleton-text-sm" style={{ width: "75%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
        {[70, 55, 90].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 22, width: w, borderRadius: 999 }} />
        ))}
      </div>
    </div>
  );
}

export default function CoachAthletes() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [dmMsg, setDmMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  useEffect(() => {
    fetch(`${API}/api/coach/me`, { credentials: "include" })
      .then(r => r.json())
      .then(async d => {
        const clubList = d.clubs || [];
        const athleteMap = new Map();
        for (const club of clubList) {
          const adminId = club.admin?._id || club.admin;
          if (!adminId) continue;
          try {
            const tr = await fetch(`${API}/api/team/club/${adminId}`);
            const teams = await tr.json();
            if (!Array.isArray(teams)) continue;
            teams.forEach(team => {
              (team.athletes || []).forEach(ath => {
                const id = ath._id;
                if (!athleteMap.has(id)) {
                  athleteMap.set(id, { ...ath, teams: [team.name], clubs: [club.name || "Club"] });
                } else {
                  const existing = athleteMap.get(id);
                  if (!existing.teams.includes(team.name)) existing.teams.push(team.name);
                }
              });
            });
          } catch {}
        }
        setAthletes(Array.from(athleteMap.values()));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = athletes.filter(a => {
    const haystack = [a.name, ...(a.sports || [])].join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Compass size={10} /> Coaching Tools</div>
          <h1>Browse Athletes</h1>
          <p>Discover and connect with athletes across all your coached teams and clubs.</p>
        </div>
      </div>

      <div className="page-body stack-lg">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15} /> {msg.text}</div>}

        {/* Search */}
        <div className="search-shell" style={{ maxWidth: 520 }}>
          <div className="search-shell-icon"><Search size={16} /></div>
          <input
            className="search-shell-input"
            placeholder="Search by name or sport…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-shell-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize: "0.82rem", color: "var(--theme-muted)", fontWeight: 600 }}>
            {filtered.length} athlete{filtered.length !== 1 ? "s" : ""}{search ? ` matching "${search}"` : " in your teams"}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="entity-grid">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={24} /></div>
            <h3>{search ? "No athletes found" : "No athletes in your teams yet"}</h3>
            <p>{search
              ? `No athletes match "${search}". Try a different name or sport.`
              : "Join a team via the Coaching Hub to see athletes here."
            }</p>
            {search && (
              <button className="btn-ghost btn-sm" onClick={() => setSearch("")} style={{ marginTop: "0.5rem" }}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="entity-grid">
            {filtered.map(ath => (
              <div key={ath._id} className="card entity-card card-interactive" style={{ padding: "1.25rem" }}>
                <div className="entity-card-top">
                  <div className="avatar-badge round">
                    {ath.profilePic
                      ? <img src={`${API}${ath.profilePic}`} alt={ath.name} />
                      : ath.name?.charAt(0)?.toUpperCase()
                    }
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3>{ath.name}</h3>
                    <div className="entity-subtitle">{ath.teams?.join(" · ") || "Athlete"}</div>
                  </div>
                </div>

                {/* Sports pills */}
                {Array.isArray(ath.sports) && ath.sports.length > 0 ? (
                  <div className="detail-pills">
                    {ath.sports.slice(0, 3).map(s => (
                      <span key={s} className="pill pill-primary" style={{ textTransform: "capitalize" }}>
                        {s.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="meta-pill" style={{ color: "var(--theme-muted)", border: "none", background: "none", padding: 0, fontSize: "0.8rem" }}>
                    No sports listed
                  </div>
                )}

                <div className="detail-pills">
                  {ath.teams?.map(t => (
                    <span key={t} className="meta-pill">{t}</span>
                  ))}
                </div>

                <button
                  className="btn-ghost"
                  style={{ width: "100%", marginTop: "auto" }}
                  onClick={() => { setSelected(ath); setDmMsg(""); }}
                >
                  <Send size={14} /> Send Message
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DM modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div className="avatar-badge round" style={{ width: 44, height: 44, fontSize: "1rem" }}>
                  {selected.name?.charAt(0)}
                </div>
                <div>
                  <div className="modal-title" style={{ fontSize: "1.4rem" }}>{selected.name}</div>
                  <p style={{ color: "var(--theme-muted)", fontSize: "0.82rem", margin: 0 }}>
                    {selected.teams?.join(", ")}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={15} /></button>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="dm-msg">Your Message</label>
              <textarea
                id="dm-msg"
                className="field-textarea"
                rows={4}
                placeholder="Send coaching feedback, tactical notes, or a training reminder…"
                value={dmMsg}
                onChange={e => setDmMsg(e.target.value)}
              />
              <span className="field-hint">This will open in the team messaging hub.</span>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!dmMsg.trim() || sending}
                onClick={() => {
                  showMsg("success", `Message queued for ${selected.name}. Open the Coaching Hub to send.`);
                  setSelected(null);
                }}
              >
                <Send size={15} /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
