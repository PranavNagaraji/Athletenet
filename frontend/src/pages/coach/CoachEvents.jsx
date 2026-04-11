import { useEffect, useMemo, useState } from "react";
import {
  Trophy, Plus, X, CalendarClock, MapPin, Users,
  CheckCircle2, XCircle, Minus, AlertCircle, Loader2
} from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;
const EVENT_TYPES = ["Match", "Friendly", "Tournament", "Training Camp", "Other"];
const RESULTS = ["Won", "Lost", "Draw", "—"];

const typeColors = {
  Match: "#f97316",
  Friendly: "#3b82f6",
  Tournament: "#8b5cf6",
  "Training Camp": "#10b981",
  Other: "#6b7280",
};

function daysRemaining(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function groupByMonth(events) {
  const groups = {};
  events.forEach((eventItem) => {
    const key = new Date(eventItem.date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(eventItem);
  });
  return groups;
}

export default function CoachEvents() {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({
    title: "",
    date: "",
    type: "Match",
    location: "",
    opponent: "",
    teamId: "",
    notes: "",
  });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    window.setTimeout(() => setMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, teamsRes] = await Promise.all([
        fetch(`${API}/api/coach/events`, { credentials: "include" }),
        fetch(`${API}/api/coach/teams`, { credentials: "include" }),
      ]);

      const [eventsData, teamsData] = await Promise.all([
        eventsRes.ok ? eventsRes.json() : [],
        teamsRes.ok ? teamsRes.json() : [],
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch {
      showMsg("error", "Unable to load your coach events right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.title || !form.date) {
      showMsg("error", "Title and date are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API}/api/coach/events`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const newEvent = await response.json();
      setEvents((current) => [...current, newEvent].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setShowCreate(false);
      setForm({
        title: "",
        date: "",
        type: "Match",
        location: "",
        opponent: "",
        teamId: "",
        notes: "",
      });
      showMsg("success", "Event created and shared with athletes.");
    } catch {
      showMsg("error", "Unable to create the event.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetResult = async (eventItem, result) => {
    try {
      const response = await fetch(`${API}/api/coach/events/${eventItem._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventItem.title,
          date: eventItem.date,
          type: eventItem.type,
          location: eventItem.location,
          opponent: eventItem.opponent,
          notes: eventItem.notes,
          result,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update result");
      }

      const updatedEvent = await response.json();
      setEvents((current) =>
        current.map((item) => (item._id === updatedEvent._id ? updatedEvent : item))
      );
    } catch {
      showMsg("error", "Unable to update event result.");
    }
  };

  const handleDelete = async (eventId) => {
    try {
      const response = await fetch(`${API}/api/coach/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setEvents((current) => current.filter((item) => item._id !== eventId));
      showMsg("success", "Event deleted.");
    } catch {
      showMsg("error", "Unable to delete event.");
    }
  };

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events]
  );
  const grouped = groupByMonth(sorted);
  const months = Object.keys(grouped);

  const resultIcon = (result) => {
    if (result === "Won") return <CheckCircle2 size={13} />;
    if (result === "Lost") return <XCircle size={13} />;
    if (result === "Draw") return <Minus size={13} />;
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Trophy size={10} /> Coaching Tools</div>
          <h1>Match & Event Planner</h1>
          <p>Create matches, friendlies, and camps once, then let athletes see them with reminders in their portal notifications.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Add Event
        </button>
      </div>

      <div className="page-body stack-lg">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15} /> {msg.text}</div>}

        {loading ? (
          <div className="loading-state">
            <Loader2 size={22} className="spinner-icon" /> Loading events...
          </div>
        ) : events.length === 0 ? (
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
            {months.map((month) => (
              <div key={month}>
                <div className="section-kicker" style={{ marginBottom: "0.85rem" }}>{month}</div>
                <div className="stack-md">
                  {grouped[month].map((eventItem) => {
                    const countdown = daysRemaining(eventItem.date);
                    const isPast = new Date(eventItem.date) < new Date();
                    const color = typeColors[eventItem.type] || "#6b7280";

                    return (
                      <div
                        key={eventItem._id}
                        className="card"
                        style={{
                          borderLeft: `3px solid ${color}`,
                          padding: "1rem 1.25rem",
                          display: "flex",
                          gap: "1rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            flexShrink: 0,
                            background: `${color}1a`,
                            color,
                            border: `1px solid ${color}33`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.1rem",
                            letterSpacing: "0.04em",
                            fontWeight: 800,
                          }}
                        >
                          {eventItem.type.charAt(0)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--theme-text)", marginBottom: "0.2rem" }}>
                                {eventItem.title}
                              </div>
                              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <CalendarClock size={12} />
                                  {new Date(eventItem.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  {" · "}
                                  {new Date(eventItem.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {eventItem.location && (
                                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <MapPin size={12} /> {eventItem.location}
                                  </span>
                                )}
                                {eventItem.opponent && (
                                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Users size={12} /> vs {eventItem.opponent}
                                  </span>
                                )}
                                {eventItem.team?.name && (
                                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Users size={12} /> {eventItem.team.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                              {countdown && !isPast && <span className="badge badge-ongoing">{countdown}</span>}
                              <span className="badge badge-inactive" style={{ color }}>{eventItem.type}</span>
                            </div>
                          </div>

                          {eventItem.notes && (
                            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--theme-muted)", lineHeight: 1.55 }}>
                              {eventItem.notes}
                            </p>
                          )}

                          {isPast && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--theme-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Result:</span>
                              {RESULTS.map((result) => (
                                <button
                                  key={result}
                                  onClick={() => handleSetResult(eventItem, result)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    padding: "0.28rem 0.6rem",
                                    borderRadius: "var(--radius-full)",
                                    border: `1px solid ${eventItem.result === result ? (result === "Won" ? "#10b981" : result === "Lost" ? "#ef4444" : "var(--theme-border-strong)") : "var(--theme-border)"}`,
                                    background: eventItem.result === result ? (result === "Won" ? "color-mix(in srgb, #10b981 12%, var(--theme-surface))" : result === "Lost" ? "color-mix(in srgb, #ef4444 12%, var(--theme-surface))" : "var(--theme-surface-2)") : "transparent",
                                    color: eventItem.result === result ? (result === "Won" ? "#10b981" : result === "Lost" ? "#ef4444" : "var(--theme-text)") : "var(--theme-muted)",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                  }}
                                >
                                  {resultIcon(result)} {result}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button className="btn-icon" onClick={() => handleDelete(eventItem._id)} aria-label="Delete event">
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

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div className="modal-title">Add Event</div>
                <p className="modal-subtitle">Plan a match, friendly, tournament, or training camp for your athletes.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={15} /></button>
            </div>

            <form className="stack-md" onSubmit={handleCreate}>
              <div className="field-group">
                <label className="field-label" htmlFor="ev-title">Event Title *</label>
                <input
                  id="ev-title"
                  className="field-input"
                  placeholder="e.g. League Match vs City FC"
                  value={form.title}
                  required
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-date">Date & Time *</label>
                  <input
                    id="ev-date"
                    className="field-input"
                    type="datetime-local"
                    value={form.date}
                    required
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-type">Type</label>
                  <select
                    id="ev-type"
                    className="field-select"
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  >
                    {EVENT_TYPES.map((eventType) => <option key={eventType}>{eventType}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-opponent">Opponent / Host</label>
                  <input
                    id="ev-opponent"
                    className="field-input"
                    placeholder="e.g. City FC"
                    value={form.opponent}
                    onChange={(event) => setForm((current) => ({ ...current, opponent: event.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="ev-location">Location / Venue</label>
                  <input
                    id="ev-location"
                    className="field-input"
                    placeholder="e.g. Home Ground"
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="ev-team">Team</label>
                <select
                  id="ev-team"
                  className="field-select"
                  value={form.teamId}
                  onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}
                >
                  <option value="">General club event</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="ev-notes">Notes</label>
                <textarea
                  id="ev-notes"
                  className="field-textarea"
                  rows={2}
                  placeholder="Pre-match notes, travel details, squad selection..."
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} className="spinner-icon" /> : <Plus size={15} />}
                  {saving ? "Saving..." : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
