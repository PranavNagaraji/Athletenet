import { useEffect, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL;

const SPORT_BG_MINI = {
  football: "linear-gradient(135deg, #166534, #15803d)",
  basketball: "linear-gradient(135deg, #7c2d12, #9a3412)",
  cricket: "linear-gradient(135deg, #1e3a5f, #1e40af)",
};
const SPORT_ACCENT = { football: "#22c55e", basketball: "#f97316", cricket: "#38bdf8" };

export default function FormationChatCard({ formationId, isMe, portal = "athlete" }) {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!formationId) return;
    fetch(`${API}/api/formations/detail/${formationId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setFormation(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [formationId]);

  const accent = SPORT_ACCENT[formation?.sportType] || "#22c55e";

  if (loading) return (
    <div style={{ width: 220, height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: "rgba(0,0,0,0.1)" }}>
      <Loader2 size={16} className="spinner-icon" style={{ color: "#64748b" }} />
    </div>
  );
  if (!formation) return null;

  const players = formation.modes?.attack || [];

  const handleOpen = () => {
    // Navigate to the tactics detail page
    // We'll put the page in a general route or specific portal route
    navigate(`/${portal}/tactics/${formation._id}`);
  };

  return (
    <button
      onClick={handleOpen}
      style={{
        width: 240, padding: 0, border: `1px solid ${accent}44`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        background: "rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        textAlign: "left",
        outline: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 8px 24px ${accent}33`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Mini pitch preview */}
      <div style={{ height: 70, background: SPORT_BG_MINI[formation.sportType] || SPORT_BG_MINI.football, position: "relative", overflow: "hidden" }}>
        {players.slice(0, 11).map((p, i) => (
          <div key={i} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            transform: "translate(-50%,-50%)",
            width: 8, height: 8, borderRadius: "50%",
            background: accent, boxShadow: `0 0 4px ${accent}88`,
          }} />
        ))}
        <div style={{ position: "absolute", bottom: 4, right: 6, fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {formation.sportType}
        </div>
      </div>
      {/* Info row */}
      <div style={{ padding: "0.55rem 0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Crosshair size={14} style={{ color: accent, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.82rem", color: isMe ? "var(--theme-text)" : "var(--theme-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formation.name}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--theme-muted)", fontWeight: 600 }}>
            Click to view full tactics
          </div>
        </div>
      </div>
    </button>
  );
}
