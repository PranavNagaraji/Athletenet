import { useEffect, useState } from "react";
import {
  CalendarClock, Plus, Loader2, Trash2, Check, X,
  MapPin, Clock, Users, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const statusColors = {
  scheduled: "badge-upcoming",
  completed: "badge-accepted",
  cancelled: "badge-rejected",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function daysUntil(d) {
  const diff = new Date(d) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default function CoachTraining() {
  const [sessions, setSessions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [expanded, setExpanded] = useState(null);
  const [attending, setAttending] = useState({});
  const [saving, setSaving] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", duration: 60, location: "", teamId: "" });

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/training/coach`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/api/coach/me`, { credentials: "include" }).then(r => r.json()).then(async d => {
        const clubList = d.clubs || [];
        let allTeams = [];
        for (const club of clubList) {
          const adminId = club.admin?._id || club.admin;
          if (!adminId) continue;
          try {
            const tr = await fetch(`${API}/api/team/club/${adminId}`);
            const td = await tr.json();
            if (Array.isArray(td)) allTeams = [...allTeams, ...td];
          } catch {}
        }
        return allTeams;
      }),
    ]).then(([sessionsData, teamsData]) => {
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setTeams(teamsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.teamId) return showMsg("error", "Title, date, and team are required.");
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/training`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(prev => [data, ...prev]);
        setShowCreate(false);
        setForm({ title: "", description: "", date: "", duration: 60, location: "", teamId: "" });
        showMsg("success", "Training session created!");
      } else {
        showMsg("error", data.message || "Failed to create session.");
      }
    } catch { showMsg("error", "Network error."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/api/training/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s._id !== id));
        showMsg("success", "Session deleted.");
        if (expanded === id) setExpanded(null);
      }
    } catch {} finally { setDeleting(null); }
  };

  const handleSaveAttendance = async (sessionId) => {
    setSaving(sessionId);
    const sessionAttendance = attending[sessionId] || {};
    const attendees = Object.entries(sessionAttendance).map(([userId, attended]) => ({ userId, attended }));
    try {
      const res = await fetch(`${API}/api/training/${sessionId}/attendance`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(prev => prev.map(s => s._id === sessionId ? data : s));
        showMsg("success", "Attendance saved!");
      }
    } catch {} finally { setSaving(null); }
  };

  const toggleAttend = (sessionId, userId, current) => {
    setAttending(prev => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] || {}), [userId]: !current },
    }));
  };

  const now = new Date();
  const filtered = sessions.filter(s => {
    if (filter === "upcoming") return new Date(s.date) >= now && s.status !== "cancelled";
    if (filter === "past") return new Date(s.date) < now || s.status === "completed";
    if (filter === "cancelled") return s.status === "cancelled";
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><CalendarClock size={10} /> Coaching Tools</div>
          <h1>Training Sessions</h1>
          <p>Schedule, track, and record attendance for all training sessions across your teams.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Session
        </button>
      </div>

      <div className="page-body stack-md">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15} /> {msg.text}</div>}

        {/* Filter tabs */}
        <div className="tab-bar">
          {[["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"], ["all", "All"]].map(([v, l]) => (
            <button key={v} className={`tab-btn ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>
              {l}
              {filter === v && <span className="tab-count">{filtered.length}</span>}
            </button>
          ))}
        </div>

        {/* Session list */}
        {loading ? (
          <div className="stack-md">
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 12 }} />
                <div style={{ flex: 1, display: "grid", gap: "0.4rem" }}>
                  <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                  <div className="skeleton skeleton-text-sm" style={{ width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarClock size={24} /></div>
            <h3>No {filter === "all" ? "" : filter} sessions</h3>
            <p>{filter === "upcoming" ? "Create a session to get started." : "No sessions match this filter."}</p>
            {filter === "upcoming" && (
              <button className="btn-primary" style={{ marginTop: "0.5rem" }} onClick={() => setShowCreate(true)}>
                <Plus size={15} /> New Session
              </button>
            )}
          </div>
        ) : (
          <div className="stack-md">
            {filtered.map(s => {
              const isExpanded = expanded === s._id;
              const countdown = daysUntil(s.date);
              const localAttend = attending[s._id] || {};

              return (
                <div key={s._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Session header */}
                  <div
                    style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1.1rem 1.25rem", cursor: "pointer" }}
                    onClick={() => setExpanded(isExpanded ? null : s._id)}
                  >
                    {/* Date badge */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                      background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      color: "#fff", boxShadow: "0 6px 16px rgba(249,115,22,0.28)",
                    }}>
                      <div style={{ fontSize: "1.35rem", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
                        {new Date(s.date).getDate()}
                      </div>
                      <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {new Date(s.date).toLocaleString("default", { month: "short" })}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--theme-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.title}
                        </span>
                        <span className={`badge ${statusColors[s.status] || "badge-inactive"}`}>{s.status}</span>
                        {countdown && s.status === "scheduled" && (
                          <span className="badge badge-ongoing">{countdown}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={12} /> {formatTime(s.date)} · {s.duration}min
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Users size={12} /> {s.team?.name || "Team"} · {s.attendees?.length || 0} athletes
                        </span>
                        {s.location && (
                          <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <MapPin size={12} /> {s.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <button
                        className="btn-danger"
                        style={{ padding: "0.4rem" }}
                        onClick={e => { e.stopPropagation(); handleDelete(s._id); }}
                        disabled={deleting === s._id}
                        aria-label="Delete session"
                      >
                        {deleting === s._id ? <Loader2 size={13} className="spinner-icon" /> : <Trash2 size={13} />}
                      </button>
                      {isExpanded ? <ChevronUp size={16} color="var(--theme-muted)" /> : <ChevronDown size={16} color="var(--theme-muted)" />}
                    </div>
                  </div>

                  {/* Expanded: attendance */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--theme-border)", background: "var(--theme-surface-2)", padding: "1.1rem 1.25rem" }}>
                      {s.description && (
                        <p style={{ color: "var(--theme-muted)", fontSize: "0.88rem", marginBottom: "1rem", lineHeight: 1.6 }}>
                          {s.description}
                        </p>
                      )}

                      {s.attendees?.length === 0 ? (
                        <p style={{ color: "var(--theme-muted)", fontSize: "0.88rem" }}>No athletes in this team yet.</p>
                      ) : (
                        <>
                          <div className="card-title card-title-sm" style={{ marginBottom: "0.75rem" }}>
                            <Users size={14} style={{ color: "var(--theme-primary)" }} />
                            Attendance
                          </div>
                          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                            {s.attendees.map(a => {
                              const uid = a.user?._id || a.user;
                              const isPresent = uid in localAttend ? localAttend[uid] : a.attended;
                              return (
                                <div key={uid} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <div className="avatar-badge round" style={{ width: 32, height: 32, fontSize: "0.75rem" }}>
                                    {a.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                  <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: "var(--theme-text)" }}>
                                    {a.user?.name || "Athlete"}
                                  </span>
                                  <button
                                    onClick={() => toggleAttend(s._id, uid, isPresent)}
                                    style={{
                                      display: "flex", alignItems: "center", gap: "0.3rem",
                                      padding: "0.32rem 0.75rem", borderRadius: "var(--radius-full)",
                                      border: `1px solid ${isPresent ? "color-mix(in srgb, var(--theme-success) 40%, transparent)" : "var(--theme-border-strong)"}`,
                                      background: isPresent ? "color-mix(in srgb, var(--theme-success) 10%, var(--theme-surface))" : "var(--theme-surface-3)",
                                      color: isPresent ? "var(--theme-success)" : "var(--theme-muted)",
                                      fontSize: "0.74rem", fontWeight: 800, cursor: "pointer",
                                      transition: "all var(--transition-fast)",
                                    }}
                                  >
                                    {isPresent ? <Check size={12} /> : <X size={12} />}
                                    {isPresent ? "Present" : "Absent"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <button className="btn-primary btn-sm" onClick={() => handleSaveAttendance(s._id)} disabled={saving === s._id}>
                            {saving === s._id ? <Loader2 size={13} className="spinner-icon" /> : <Check size={13} />}
                            Save Attendance
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div className="modal-title">New Training Session</div>
                <p className="modal-subtitle">Schedule a training session for one of your teams.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={15} /></button>
            </div>

            <form className="form-grid stack-md" onSubmit={handleCreate}>
              <div className="field-group">
                <label className="field-label" htmlFor="ts-title">Session Title *</label>
                <input id="ts-title" className="field-input" placeholder="e.g. Weekly Conditioning" value={form.title} required
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="ts-date">Date & Time *</label>
                  <input id="ts-date" className="field-input" type="datetime-local" value={form.date} required
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="ts-duration">Duration (minutes)</label>
                  <input id="ts-duration" className="field-input" type="number" min={15} max={300} value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="ts-team">Team *</label>
                <select id="ts-team" className="field-select" value={form.teamId} required
                  onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))}>
                  <option value="">Select a team…</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="ts-location">Location</label>
                <input id="ts-location" className="field-input" placeholder="e.g. Training Ground A" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="ts-desc">Notes / Plan</label>
                <textarea id="ts-desc" className="field-textarea" rows={3}
                  placeholder="Session objectives, drills, focus areas…" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? <Loader2 size={15} className="spinner-icon" /> : <Plus size={15} />}
                  {creating ? "Creating…" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
