import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, Loader2, MapPin, Trophy, Users } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

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

export default function AthleteEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/api/athlete/events`, { credentials: "include" });
        const data = response.ok ? await response.json() : [];
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setMsg("Unable to load coach events.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = Date.now();
    const nextUpcoming = [];
    const nextPast = [];

    [...events]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((eventItem) => {
        if (new Date(eventItem.date).getTime() >= now) nextUpcoming.push(eventItem);
        else nextPast.unshift(eventItem);
      });

    return { upcomingEvents: nextUpcoming, pastEvents: nextPast };
  }, [events]);

  const renderEventCard = (eventItem, isPast = false) => {
    const color = typeColors[eventItem.type] || "#6b7280";
    const reminder = daysRemaining(eventItem.date);

    return (
      <div
        key={eventItem._id}
        className="card"
        style={{ borderLeft: `3px solid ${color}`, padding: "1rem 1.25rem" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--theme-text)" }}>{eventItem.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                <CalendarClock size={13} />
                {new Date(eventItem.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {new Date(eventItem.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {eventItem.location && (
                <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                  <MapPin size={13} />
                  {eventItem.location}
                </span>
              )}
              {eventItem.team?.name && (
                <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                  <Users size={13} />
                  {eventItem.team.name}
                </span>
              )}
              {eventItem.opponent && (
                <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                  <Trophy size={13} />
                  vs {eventItem.opponent}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {!isPast && reminder ? <span className="badge badge-ongoing">{reminder}</span> : null}
            <span className="badge badge-inactive" style={{ color }}>{eventItem.type}</span>
            {isPast && eventItem.result && eventItem.result !== "—" ? (
              <span className={`badge ${eventItem.result === "Won" ? "badge-accepted" : eventItem.result === "Lost" ? "badge-rejected" : "badge-inactive"}`}>
                {eventItem.result}
              </span>
            ) : null}
          </div>
        </div>

        {eventItem.notes ? (
          <p style={{ margin: "0.7rem 0 0", color: "var(--theme-muted)", lineHeight: 1.6 }}>{eventItem.notes}</p>
        ) : null}

        <div style={{ marginTop: "0.7rem", fontSize: "0.78rem", color: "var(--theme-primary)", fontWeight: 700 }}>
          Coach: {eventItem.coach?.name || "Coach"}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Trophy size={10} /> Athlete Schedule</div>
          <h1>Coach Matches & Events</h1>
          <p>See the latest coach-created matches, camps, and schedule updates for your clubs and teams.</p>
        </div>
      </div>

      <div className="page-body stack-lg">
        {msg ? <div className="alert alert-error"><AlertCircle size={15} /> {msg}</div> : null}

        {loading ? (
          <div className="loading-state">
            <Loader2 size={22} className="spinner-icon" /> Loading your event schedule...
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Trophy size={24} /></div>
            <h3>No coach events yet</h3>
            <p>When your coaches schedule matches or camps, they will appear here.</p>
          </div>
        ) : (
          <>
            <div className="stack-md">
              <div className="card-title" style={{ marginBottom: 0 }}>Upcoming</div>
              {upcomingEvents.length ? upcomingEvents.map((eventItem) => renderEventCard(eventItem)) : (
                <div className="empty-state"><p>No upcoming events right now.</p></div>
              )}
            </div>

            <div className="stack-md">
              <div className="card-title" style={{ marginBottom: 0 }}>Past Results</div>
              {pastEvents.length ? pastEvents.map((eventItem) => renderEventCard(eventItem, true)) : (
                <div className="empty-state"><p>No completed coach events yet.</p></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
