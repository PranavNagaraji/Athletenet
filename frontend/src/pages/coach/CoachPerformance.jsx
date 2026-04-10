import { useEffect, useState, useRef } from "react";
import { Star, TrendingUp, User, ChevronDown, Plus, Save, Loader2, AlertCircle, X } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;
const STORAGE_KEY = "an_coach_performance";

const CRITERIA = [
  { key: "fitness", label: "Fitness", description: "Overall stamina, strength, and physical conditioning" },
  { key: "skill", label: "Technical Skill", description: "Ball handling, technique, and sport-specific skills" },
  { key: "attitude", label: "Attitude", description: "Coachability, respect, and leadership presence" },
  { key: "effort", label: "Effort", description: "Commitment, work rate, and consistency in training" },
  { key: "teamwork", label: "Teamwork", description: "Communication, collaboration, and positional awareness" },
];

function loadRatings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveRatings(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.2rem" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "0.1rem",
            color: n <= (hovered || value) ? "#f97316" : "var(--theme-surface-4)",
            transition: "color 0.1s ease, transform 0.1s",
            transform: n <= hovered ? "scale(1.15)" : "scale(1)",
          }}
        >
          <Star size={22} fill={n <= (hovered || value) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function CoachPerformance() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [ratings, setRatings] = useState(loadRatings());
  const [draftRating, setDraftRating] = useState({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

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
                if (!athleteMap.has(id)) athleteMap.set(id, { ...ath, teams: [team.name] });
                else athleteMap.get(id).teams.push(team.name);
              });
            });
          } catch {}
        }
        setAthletes(Array.from(athleteMap.values()));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectAthlete = (ath) => {
    setSelected(ath);
    const existing = ratings[ath._id];
    if (existing) {
      setDraftRating(existing.scores || {});
      setNote(existing.note || "");
    } else {
      setDraftRating({});
      setNote("");
    }
  };

  const handleSave = () => {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      const updated = {
        ...ratings,
        [selected._id]: {
          scores: draftRating,
          note,
          savedAt: new Date().toISOString(),
          athleteName: selected.name,
        },
      };
      setRatings(updated);
      saveRatings(updated);
      showMsg("success", `Rating saved for ${selected.name}.`);
      setSaving(false);
    }, 500);
  };

  const avg = (scores) => {
    const vals = Object.values(scores || {});
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const filtered = athletes.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><TrendingUp size={10} /> Coaching Tools</div>
          <h1>Player Performance</h1>
          <p>Rate each athlete across key criteria and keep private notes as part of your coaching log.</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: "1rem" }}><AlertCircle size={15} /> {msg.text}</div>}

        <div className="section-grid-2" style={{ alignItems: "start", gap: "1.5rem" }}>
          {/* Left: athlete list */}
          <div className="card stack-md" style={{ padding: "1rem 0" }}>
            <div style={{ padding: "0 1rem" }}>
              <div className="card-title">Athletes</div>
              <div className="search-shell" style={{ maxWidth: "100%" }}>
                <div className="search-shell-icon" style={{ left: "0.8rem" }}>
                  <User size={14} />
                </div>
                <input
                  className="search-shell-input"
                  style={{ paddingLeft: "2.4rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                  placeholder="Search athletes…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "0 1rem", display: "grid", gap: "0.5rem" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: "flex", gap: "0.65rem", alignItems: "center", padding: "0.5rem 0" }}>
                    <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: "55%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--theme-muted)", fontSize: "0.88rem" }}>
                No athletes found.
              </div>
            ) : (
              <div style={{ display: "grid" }}>
                {filtered.map(ath => {
                  const existing = ratings[ath._id];
                  const isSelected = selected?._id === ath._id;
                  return (
                    <button
                      key={ath._id}
                      onClick={() => handleSelectAthlete(ath)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.8rem 1rem",
                        background: isSelected ? "color-mix(in srgb, var(--theme-primary) 8%, var(--theme-surface-2))" : "transparent",
                        borderLeft: `3px solid ${isSelected ? "var(--theme-primary)" : "transparent"}`,
                        border: "none",
                        borderRight: 0, borderTop: 0, borderBottom: `1px solid var(--theme-border)`,
                        cursor: "pointer", transition: "all var(--transition-fast)", textAlign: "left",
                      }}
                    >
                      <div className="avatar-badge round" style={{ width: 36, height: 36, fontSize: "0.85rem", flexShrink: 0 }}>
                        {ath.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text)" }}>{ath.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--theme-muted)", fontWeight: 600 }}>
                          {ath.teams?.join(", ") || ""}
                        </div>
                      </div>
                      {existing && (
                        <div style={{
                          fontSize: "0.72rem", fontWeight: 800,
                          color: "var(--theme-primary)",
                          background: "color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface-2))",
                          padding: "0.15rem 0.45rem", borderRadius: "999px",
                          border: "1px solid color-mix(in srgb, var(--theme-primary) 20%, var(--theme-border))",
                        }}>
                          ★ {avg(existing.scores)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: rating form */}
          {!selected ? (
            <div className="empty-state">
              <div className="empty-state-icon"><TrendingUp size={24} /></div>
              <h3>Select an athlete</h3>
              <p>Pick an athlete from the list to rate their performance and add coaching notes.</p>
            </div>
          ) : (
            <div className="card stack-md">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="card-title" style={{ margin: 0 }}>
                  <div className="avatar-badge round" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                    {selected.name?.charAt(0)}
                  </div>
                  Rating — {selected.name}
                </div>
                {ratings[selected._id] && (
                  <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 600 }}>
                    Last saved: {new Date(ratings[selected._id].savedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Criteria */}
              {CRITERIA.map(c => (
                <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text)" }}>{c.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--theme-muted)", marginTop: "0.1rem" }}>{c.description}</div>
                  </div>
                  <StarRating
                    value={draftRating[c.key] || 0}
                    onChange={v => setDraftRating(prev => ({ ...prev, [c.key]: v }))}
                  />
                </div>
              ))}

              {/* Overall avg */}
              {Object.keys(draftRating).length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.85rem 1rem", borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, var(--theme-primary) 8%, var(--theme-surface-2))",
                  border: "1px solid color-mix(in srgb, var(--theme-primary) 16%, var(--theme-border))",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--theme-text)" }}>Overall Score</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", color: "var(--theme-primary)", letterSpacing: "0.02em" }}>
                    {avg(draftRating)} <span style={{ fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>/ 5</span>
                  </span>
                </div>
              )}

              {/* Notes */}
              <div className="field-group">
                <label className="field-label" htmlFor="perf-note">Coaching Notes</label>
                <textarea id="perf-note" className="field-textarea" rows={3}
                  placeholder="Private notes on this athlete's progress, areas to improve, next focus…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <button className="btn-primary" style={{ width: "100%" }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={15} className="spinner-icon" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save Rating"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
