import { useEffect, useMemo, useState } from "react";
import { Star, TrendingUp, User, Save, Loader2, AlertCircle } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const CRITERIA = [
  { key: "fitness", label: "Fitness", description: "Overall stamina, strength, and physical conditioning" },
  { key: "skill", label: "Technical Skill", description: "Ball handling, technique, and sport-specific skills" },
  { key: "attitude", label: "Attitude", description: "Coachability, respect, and leadership presence" },
  { key: "effort", label: "Effort", description: "Commitment, work rate, and consistency in training" },
  { key: "teamwork", label: "Teamwork", description: "Communication, collaboration, and positional awareness" },
];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: "0.2rem" }}>
      {[1, 2, 3, 4, 5].map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          onMouseEnter={() => setHovered(number)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.1rem",
            color: number <= (hovered || value) ? "#f97316" : "var(--theme-surface-4)",
            transition: "color 0.1s ease, transform 0.1s",
            transform: number <= hovered ? "scale(1.15)" : "scale(1)",
          }}
        >
          <Star size={22} fill={number <= (hovered || value) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

const averageScore = (scores) => {
  const values = Object.values(scores || {}).filter((value) => value > 0);
  if (!values.length) return 0;
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
};

export default function CoachPerformance() {
  const [teams, setTeams] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [draftRating, setDraftRating] = useState({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [teamsRes, ratingsRes] = await Promise.all([
          fetch(`${API}/api/coach/teams`, { credentials: "include" }),
          fetch(`${API}/api/coach/performance/ratings`, { credentials: "include" }),
        ]);

        const [teamsData, ratingsData] = await Promise.all([
          teamsRes.ok ? teamsRes.json() : [],
          ratingsRes.ok ? ratingsRes.json() : [],
        ]);

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setRatings(Array.isArray(ratingsData) ? ratingsData : []);
      } catch {
        setMsg({ type: "error", text: "Unable to load athlete performance data." });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!msg) return undefined;
    const timeoutId = window.setTimeout(() => setMsg(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [msg]);

  const athletes = useMemo(() => {
    const athleteMap = new Map();

    teams.forEach((team) => {
      (team.athletes || []).forEach((athlete) => {
        const existing = athleteMap.get(athlete._id);
        if (!existing) {
          athleteMap.set(athlete._id, {
            ...athlete,
            teams: [team.name],
          });
        } else if (!existing.teams.includes(team.name)) {
          existing.teams.push(team.name);
        }
      });
    });

    return [...athleteMap.values()];
  }, [teams]);

  const ratingsByAthleteId = useMemo(() => {
    const nextMap = new Map();
    ratings.forEach((rating) => {
      nextMap.set(rating.athlete?._id || rating.athlete, rating);
    });
    return nextMap;
  }, [ratings]);

  const filteredAthletes = athletes.filter((athlete) =>
    athlete.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAthlete = (athlete) => {
    setSelected(athlete);
    const existing = ratingsByAthleteId.get(athlete._id);
    setDraftRating(existing?.scores || {});
    setNote(existing?.note || "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);

    try {
      const response = await fetch(`${API}/api/coach/performance/${selected._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: draftRating, note }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rating");
      }

      const savedRating = await response.json();
      setRatings((current) => {
        const exists = current.some((entry) => entry._id === savedRating._id);
        if (exists) {
          return current.map((entry) => (entry._id === savedRating._id ? savedRating : entry));
        }
        return [savedRating, ...current];
      });
      setMsg({ type: "success", text: `Rating saved for ${selected.name}.` });
    } catch {
      setMsg({ type: "error", text: "Unable to save this rating." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><TrendingUp size={10} /> Coaching Tools</div>
          <h1>Player Performance</h1>
          <p>Rate each athlete across key criteria, save coaching notes to the backend, and let athletes review their latest coach feedback.</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: "1rem" }}><AlertCircle size={15} /> {msg.text}</div>}

        <div className="section-grid-2" style={{ alignItems: "start", gap: "1.5rem" }}>
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
                  placeholder="Search athletes..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <Loader2 size={22} className="spinner-icon" /> Loading athletes...
              </div>
            ) : filteredAthletes.length === 0 ? (
              <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--theme-muted)", fontSize: "0.88rem" }}>
                No athletes found.
              </div>
            ) : (
              <div style={{ display: "grid" }}>
                {filteredAthletes.map((athlete) => {
                  const existing = ratingsByAthleteId.get(athlete._id);
                  const isSelected = selected?._id === athlete._id;

                  return (
                    <button
                      key={athlete._id}
                      onClick={() => handleSelectAthlete(athlete)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.8rem 1rem",
                        background: isSelected ? "color-mix(in srgb, var(--theme-primary) 8%, var(--theme-surface-2))" : "transparent",
                        borderLeft: `3px solid ${isSelected ? "var(--theme-primary)" : "transparent"}`,
                        border: "none",
                        borderBottom: "1px solid var(--theme-border)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div className="avatar-badge round" style={{ width: 36, height: 36, fontSize: "0.85rem", flexShrink: 0 }}>
                        {athlete.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text)" }}>{athlete.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--theme-muted)", fontWeight: 600 }}>
                          {athlete.teams?.join(", ") || ""}
                        </div>
                      </div>
                      {existing && (
                        <div
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: "var(--theme-primary)",
                            background: "color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface-2))",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "999px",
                            border: "1px solid color-mix(in srgb, var(--theme-primary) 20%, var(--theme-border))",
                          }}
                        >
                          ★ {averageScore(existing.scores)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
                  Rating - {selected.name}
                </div>
                {ratingsByAthleteId.get(selected._id) && (
                  <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 600 }}>
                    Last saved: {new Date(ratingsByAthleteId.get(selected._id).updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {CRITERIA.map((criterion) => (
                <div key={criterion.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text)" }}>{criterion.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--theme-muted)", marginTop: "0.1rem" }}>{criterion.description}</div>
                  </div>
                  <StarRating
                    value={draftRating[criterion.key] || 0}
                    onChange={(value) => setDraftRating((current) => ({ ...current, [criterion.key]: value }))}
                  />
                </div>
              ))}

              {Object.keys(draftRating).length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.85rem 1rem",
                    borderRadius: "var(--radius-md)",
                    background: "color-mix(in srgb, var(--theme-primary) 8%, var(--theme-surface-2))",
                    border: "1px solid color-mix(in srgb, var(--theme-primary) 16%, var(--theme-border))",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--theme-text)" }}>Overall Score</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", color: "var(--theme-primary)", letterSpacing: "0.02em" }}>
                    {averageScore(draftRating)} <span style={{ fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>/ 5</span>
                  </span>
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="perf-note">Coaching Notes</label>
                <textarea
                  id="perf-note"
                  className="field-textarea"
                  rows={3}
                  placeholder="Feedback the athlete should be able to review later..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <button className="btn-primary" style={{ width: "100%" }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={15} className="spinner-icon" /> : <Save size={15} />}
                {saving ? "Saving..." : "Save Rating"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
