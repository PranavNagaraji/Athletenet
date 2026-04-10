import { useState } from "react";
import {
  Trophy, Plus, X, CalendarClock, MapPin, Users,
  CheckCircle2, XCircle, Minus, Loader2, AlertCircle
} from "lucide-react";
import "../club/ClubLayout.css";

const STORAGE_KEY = "an_coach_events";
const EVENT_TYPES = ["Match", "Friendly", "Tournament", "Training Camp", "Other"];
const RESULTS = ["Won", "Lost", "Draw", "—"];

const typeColors = {
  "Match": "#f97316",
  "Friendly": "#3b82f6",
  "Tournament": "#8b5cf6",
  "Training Camp": "#10b981",
  "Other": "#6b7280",
};

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveEvents(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function daysRemaining(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function groupByMonth(events) {
  const groups = {};
  events.forEach(e => {
    const key = new Date(e.date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

export default function CoachEvents() {
  const [events, setEvents] = useState(loadEvents());
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ title: "", date: "", type: "Match", location: "", opponent: "", team: "", notes: "" });

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return showMsg("error", "Title and date are required.");
    const newEvent = { ...form, id: Date.now().toString(), result: "—", createdAt: new Date().toISOString() };
    const updated = [newEvent, ...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(updated);
    saveEvents(updated);
    setShowCreate(false);
    setForm({ title: "", date: "", type: "Match", location: "", opponent: "", team: "", notes: "" });
    showMsg("success", "Event created!");
  };

  const handleSetResult = (id, result) => {
    const updated = events.map(e => e.id === id ? { ...e, result } : e);
    setEvents(updated);
    saveEvents(updated);
  };

  const handleDelete = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  };

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const grouped = groupByMonth(sorted);
  const months = Object.keys(grouped);

  const resultIcon = (r) => {
    if (r === "Won") return <CheckCircle2 size={13} />;
    if (r === "Lost") return <XCircle size={13} />;
    if (r === "Draw") return <Minus size={13} />;
    return null;
  };

  const resultColor = { "Won": "badge-accepted", "Lost": "badge-rejected", "Draw": "badge-inactive", "—": "badge-inactive" };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Trophy size={10} /> Coaching Tools</div>
          <h1>Match & Event Planner</h1>
          <p>Plan matches, friendlies, and tournaments. Log results after the event.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Add Event
        </button>
      </div>

      <div className="page-body stack-lg">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15} /> {msg.text}</div>}

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Trophy size={24} /></div>
            <h3>No events planned yet</h3>
            <p>Add your upcoming matches, friendlies, and training camps.</p>
            <button className="btn-primary" style={{ marginTop: "0.5rem" }} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Add Event
            </button>
          </div>
        ) : (
          <>
            {months.map(month => (
              <div key={month}>
                <div className="section-kicker" style={{ marginBottom: "0.85rem" }}>{month}</div>
                <div className="stack-md">
                  {grouped[month].map(ev => {
                    const countdown = daysRemaining(ev.date);
                    const isPast = new Date(ev.date) < new Date();
                    const color = typeColors[ev.type] || "#6b7280";

                    return (
                      <div key={ev.id} className="card" style={{
                        borderLeft: `3px solid ${color}`,
                        padding: "1rem 1.25rem",
                        display: "flex", gap: "1rem", alignItems: "flex-start",
                      }}>
                        {/* Type badge */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                          background: `${color}1a`, color, border: `1px solid ${color}33`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-heading)", fontSize: "1.1rem", letterSpacing: "0.04em",
                          fontWeight: 800,
                        }}>
                          {ev.type.charAt(0)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--theme-text)", marginBottom: "0.2rem" }}>
                                {ev.title}
                              </div>
                              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <CalendarClock size={12} />
                                  {new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  {" · "}
                                  {new Date(ev.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {ev.location && (
                                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <MapPin size={12} /> {ev.location}
                                  </span>
                                )}
                                {ev.opponent && (
                                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Users size={12} /> vs {ev.opponent}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                              {countdown && !isPast && (
                                <span className="badge badge-ongoing">{countdown}</span>
                              )}
                              <span className="badge badge-inactive" style={{ color }}>
                                {ev.type}
                              </span>
                            </div>
                          </div>

                          {ev.notes && (
                            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--theme-muted)", lineHeight: 1.55 }}>
                              {ev.notes}
                            </p>
                          )}

                          {/* Result row */}
                          {isPast && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--theme-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Result:</span>
                              {RESULTS.map(r => (
                                <button
                                  key={r}
                                  onClick={() => handleSetResult(ev.id, r)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "0.25rem",
                                    padding: "0.28rem 0.6rem", borderRadius: "var(--radius-full)",
                                    border: `1px solid ${ev.result === r ? (r === "Won" ? "#10b981" : r === "Lost" ? "#ef4444" : "var(--theme-border-strong)") : "var(--theme-border)"}`,
                                    background: ev.result === r ? (r === "Won" ? "color-mix(in srgb, #10b981 12%, var(--theme-surface))" : r === "Lost" ? "color-mix(in srgb, #ef4444 12%, var(--theme-surface))" : "var(--theme-surface-2)") : "transparent",
                                    color: ev.result === r ? (r === "Won" ? "#10b981" : r === "Lost" ? "#ef4444" : "var(--theme-text)") : "var(--theme-muted)",
                                    fontSize: "0.72rem", fontWeight: 800, cursor: "pointer",
                                    transition: "all var(--transition-fast)",
                                  }}
                                >
                                  {resultIcon(r)} {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button className="btn-icon" onClick={() => handleDelete(ev.id)} aria-label="Delete event">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div className="modal-title">Add Event</div>
                <p className="modal-subtitle">Plan a match, friendly, or training camp.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={15} /></button>
            </div>

            <form className="stack-md" onSubmit={handleCreate}>
              <div className="field-group">
                <label className="field-label" htmlFor="ev-title">Event Title *</label>
                <input id="ev-title" className="field-input" placeholder="e.g. League Match vs City FC" value={form.title} required
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-date">Date & Time *</label>
                  <input id="ev-date" className="field-input" type="datetime-local" value={form.date} required
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-type">Type</label>
                  <select id="ev-type" className="field-select" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-opponent">Opponent / Host</label>
                  <input id="ev-opponent" className="field-input" placeholder="e.g. City FC" value={form.opponent}
                    onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-location">Location / Venue</label>
                  <input id="ev-location" className="field-input" placeholder="e.g. Home Ground" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="ev-notes">Notes</label>
                <textarea id="ev-notes" className="field-textarea" rows={2}
                  placeholder="Pre-match notes, travel details, squad selection…" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <Plus size={15} /> Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
