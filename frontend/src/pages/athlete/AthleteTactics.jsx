import { useEffect, useState } from "react";
import {
  Crosshair, Loader2, Search, Filter,
  MessageCircle, Calendar, User, ChevronRight, ShieldCheck, Sword
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import FormationsBoard from "../../components/FormationsBoard";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const SPORT_META = {
  all:        { label: "All Sports",  accent: "#94a3b8", bg: "linear-gradient(135deg,#1e293b,#0f172a)" },
  football:   { label: "Football",    accent: "#22c55e", bg: "linear-gradient(135deg,#14532d,#166534)" },
  basketball: { label: "Basketball",  accent: "#f97316", bg: "linear-gradient(135deg,#7c2d12,#9a3412)" },
  cricket:    { label: "Cricket",     accent: "#38bdf8", bg: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
};

const sportIcons = { football: "⚽", basketball: "🏀", cricket: "🏏" };

function MiniPitch({ formation }) {
  const meta = SPORT_META[formation.sportType] || SPORT_META.football;
  const players = formation.modes?.attack || [];
  return (
    <div style={{
      width: "100%", paddingTop: "56%", position: "relative",
      background: meta.bg, borderRadius: "10px 10px 0 0", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Grid lines hint */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.12,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "12% 12%" }} />
        {/* Player dots */}
        {players.map((p, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            transform: "translate(-50%,-50%)",
            width: 10, height: 10, borderRadius: "50%",
            background: meta.accent,
            boxShadow: `0 0 6px ${meta.accent}99`,
            transition: `all 0.4s ease ${i * 0.04}s`,
          }} />
        ))}
        {/* Sport badge */}
        <div style={{
          position: "absolute", bottom: 8, left: 10,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          borderRadius: 20, padding: "0.18rem 0.6rem",
          fontSize: "0.68rem", fontWeight: 800, color: "#fff",
          textTransform: "uppercase", letterSpacing: "0.08em",
          border: `1px solid ${meta.accent}44`,
        }}>
          {sportIcons[formation.sportType]} {formation.sportType}
        </div>
        {/* Player count */}
        <div style={{
          position: "absolute", bottom: 8, right: 10,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          borderRadius: 20, padding: "0.18rem 0.6rem",
          fontSize: "0.68rem", fontWeight: 700, color: meta.accent,
          border: `1px solid ${meta.accent}44`,
        }}>
          {players.length}P
        </div>
      </div>
    </div>
  );
}

function FormationCard({ formation, onClick }) {
  const meta = SPORT_META[formation.sportType] || SPORT_META.football;
  const attackCount = formation.modes?.attack?.length || 0;
  const defenseCount = formation.modes?.defense?.length || 0;
  const coachName = formation.coachId?.user?.name || "Coach";
  const date = new Date(formation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      style={{
        background: "var(--theme-surface)",
        border: "1px solid var(--theme-border)",
        borderRadius: 16, overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.25s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.25), 0 0 0 1px ${meta.accent}33`;
        e.currentTarget.style.borderColor = `${meta.accent}44`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--theme-border)";
      }}
    >
      {/* Mini Pitch Thumbnail */}
      <MiniPitch formation={formation} />

      {/* Card Body */}
      <div style={{ padding: "0.85rem 1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
          <h3 style={{
            fontWeight: 800, fontSize: "0.95rem", color: "var(--theme-text)",
            margin: 0, lineHeight: 1.3, flex: 1,
          }}>
            {formation.name}
          </h3>
          <ChevronRight size={16} style={{ color: meta.accent, flexShrink: 0, marginTop: 2 }} />
        </div>

        {/* Modes summary */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span style={{
            display: "flex", alignItems: "center", gap: "0.25rem",
            background: "rgba(239,68,68,0.1)", borderRadius: 20,
            padding: "0.15rem 0.55rem", fontSize: "0.68rem", fontWeight: 700, color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <Sword size={10} /> {attackCount} ATK
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: "0.25rem",
            background: "rgba(59,130,246,0.1)", borderRadius: 20,
            padding: "0.15rem 0.55rem", fontSize: "0.68rem", fontWeight: 700, color: "#93c5fd",
            border: "1px solid rgba(59,130,246,0.2)",
          }}>
            <ShieldCheck size={10} /> {defenseCount} DEF
          </span>
        </div>

        {/* Coach & date */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "auto" }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6rem", fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {coachName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--theme-muted)", fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {coachName}
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--theme-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem", flexShrink: 0 }}>
            <Calendar size={10} /> {date}
          </span>
        </div>

        {/* Comment count */}
        {formation.comments?.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.68rem", color: "var(--theme-muted)", fontWeight: 600 }}>
            <MessageCircle size={11} style={{ color: "#60a5fa" }} />
            {formation.comments.length} comment{formation.comments.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AthleteTactics() {
  const { user } = useAuth();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("all");
  const [search, setSearch] = useState("");
  const [openFormation, setOpenFormation] = useState(null);

  useEffect(() => {
    // Load teams athlete belongs to, then load formations for each team
    fetch(`${API}/api/athlete/me`, { credentials: "include" })
      .then(r => r.json())
      .then(async (d) => {
        const joinedClubs = d.clubs || [];
        let allTeamIds = [];

        await Promise.all(joinedClubs.map(async (club) => {
          const adminId = club.admin?._id || club.admin;
          if (!adminId) return;
          try {
            const r = await fetch(`${API}/api/team/club/${adminId}`);
            const teams = await r.json();
            if (Array.isArray(teams)) {
              allTeamIds = [...allTeamIds, ...teams.map(t => t._id)];
            }
          } catch {}
        }));

        // De-duplicate
        allTeamIds = [...new Set(allTeamIds)];

        // Fetch formations for each team
        const allFormations = [];
        await Promise.all(allTeamIds.map(async (teamId) => {
          try {
            const r = await fetch(`${API}/api/formations/team/${teamId}`, { credentials: "include" });
            const data = await r.json();
            if (Array.isArray(data)) allFormations.push(...data);
          } catch {}
        }));

        // De-duplicate formations by _id
        const seen = new Set();
        const unique = allFormations.filter(f => {
          if (seen.has(f._id)) return false;
          seen.add(f._id);
          return true;
        });
        unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFormations(unique);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Refresh single formation comments after posting a comment
  const handleFormationUpdate = (formationId) => {
    fetch(`${API}/api/formations/detail/${formationId}`, { credentials: "include" })
      .then(r => r.json())
      .then(updated => {
        setFormations(prev => prev.map(f => f._id === formationId ? { ...f, comments: updated.comments } : f));
        if (openFormation?._id === formationId) {
          setOpenFormation(prev => ({ ...prev, comments: updated.comments }));
        }
      })
      .catch(() => {});
  };

  const filtered = formations.filter(f => {
    const matchSport = sport === "all" || f.sportType === sport;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return matchSport && matchSearch;
  });

  const sportCounts = Object.fromEntries(
    Object.keys(SPORT_META).map(s => [s, s === "all" ? formations.length : formations.filter(f => f.sportType === s).length])
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow">
            <Crosshair size={10} /> Tactical Center
          </div>
          <h1>Team Tactics</h1>
          <p>Browse all formations shared by your coaches. Click any card to view the full interactive pitch and leave your feedback.</p>
        </div>
      </div>

      <div className="page-body">
        {/* Filters row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {/* Sport filter pills */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {Object.entries(SPORT_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setSport(key)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.4rem 0.9rem", borderRadius: 20, border: "none", cursor: "pointer",
                  background: sport === key
                    ? `linear-gradient(135deg, ${meta.accent}, ${meta.accent}cc)`
                    : "var(--theme-surface-2)",
                  color: sport === key ? "#fff" : "var(--theme-muted)",
                  fontWeight: 700, fontSize: "0.8rem",
                  transition: "all 0.2s ease",
                  boxShadow: sport === key ? `0 4px 14px ${meta.accent}44` : "none",
                }}
              >
                {key !== "all" && <span>{sportIcons[key]}</span>}
                {meta.label}
                <span style={{
                  background: sport === key ? "rgba(255,255,255,0.25)" : "var(--theme-surface-3)",
                  borderRadius: 20, padding: "0 6px", fontSize: "0.65rem", fontWeight: 800,
                }}>
                  {sportCounts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem",
            background: "var(--theme-surface)", border: "1px solid var(--theme-border)",
            borderRadius: 20, padding: "0.4rem 1rem",
          }}>
            <Search size={13} style={{ color: "var(--theme-muted)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search formations…"
              style={{
                background: "none", border: "none", outline: "none",
                color: "var(--theme-text)", fontSize: "0.85rem", fontWeight: 600, width: 180,
              }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "1.25rem" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: "var(--theme-surface)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--theme-border)" }}>
                <div className="skeleton" style={{ width: "100%", paddingTop: "56%", borderRadius: 0 }} />
                <div style={{ padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton skeleton-text" style={{ width: "70%" }} />
                  <div className="skeleton skeleton-text-sm" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Crosshair size={24} /></div>
            <h3>{search ? "No formations match your search" : "No tactics shared yet"}</h3>
            <p>{search ? "Try a different keyword or sport filter." : "Your coaches haven't shared any formations with your teams yet."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "1.25rem" }}>
            {filtered.map(f => (
              <FormationCard
                key={f._id}
                formation={f}
                onClick={() => navigate(`/athlete/tactics/${f._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
