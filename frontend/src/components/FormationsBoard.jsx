/**
 * FormationsBoard.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Self-contained animated tactical pitch overlay.
 * Props:
 *   formation  — { sportType, name, presetKey, modes: { attack, defense } }
 *   readOnly   — hides controls; used for athlete view
 *   onShare    — async fn(formation) → called by coach when "Share to Team" pressed
 *   onClose    — fn() closes the overlay
 *   showComments — shows the right-side comments panel (athlete tactics page)
 *   formationId — id for loading/posting comments
 *   currentUser  — user object { _id, name, profilePic }
 */
import { useState, useEffect, useRef } from "react";
import {
  X, ChevronDown, Shield, Sword, Send, Trash2, MessageCircle,
  Loader2, Share2, Save, Users, ZoomIn, ZoomOut, Maximize
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  SPORT_OPTIONS,
  getPresetOptions,
  applyPresetToFormation,
  getSportMeta,
  createFormationDraft,
} from "../lib/formationPresets";

const API = import.meta.env.VITE_BACKEND_URL;

const SPORT_AR = {
  football: 100 / 158,
  basketball: 100 / 57,
  cricket: 100 / 100,
};

/* ── sport surface backgrounds ──────────────────────────────────────── */
function FootballPitch() {
  return (
    <svg viewBox="0 0 100 158" preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55 }}>
      {/* Outer boundary */}
      <rect x="4" y="4" width="92" height="150" rx="2" fill="none" stroke="#fff" strokeWidth="1.2" />
      {/* Centre line */}
      <line x1="4" y1="79" x2="96" y2="79" stroke="#fff" strokeWidth="0.9" />
      {/* Centre circle */}
      <circle cx="50" cy="79" r="14" fill="none" stroke="#fff" strokeWidth="0.9" />
      <circle cx="50" cy="79" r="0.8" fill="#fff" />
      {/* Penalty box top */}
      <rect x="18" y="4" width="64" height="24" fill="none" stroke="#fff" strokeWidth="0.9" />
      {/* Goal box top */}
      <rect x="32" y="4" width="36" height="10" fill="none" stroke="#fff" strokeWidth="0.9" />
      {/* Penalty box bottom */}
      <rect x="18" y="130" width="64" height="24" fill="none" stroke="#fff" strokeWidth="0.9" />
      {/* Goal box bottom */}
      <rect x="32" y="144" width="36" height="10" fill="none" stroke="#fff" strokeWidth="0.9" />
      {/* Penalty spots */}
      <circle cx="50" cy="20" r="0.8" fill="#fff" />
      <circle cx="50" cy="138" r="0.8" fill="#fff" />
    </svg>
  );
}

function BasketballCourt() {
  return (
    <svg viewBox="0 0 100 57" preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
      <rect x="1" y="1" width="98" height="55" fill="none" stroke="#fff" strokeWidth="1" />
      {/* Half court line */}
      <line x1="1" y1="28.5" x2="99" y2="28.5" stroke="#fff" strokeWidth="0.7" />
      {/* Centre circle */}
      <circle cx="50" cy="28.5" r="7" fill="none" stroke="#fff" strokeWidth="0.7" />
      {/* Left key */}
      <rect x="1" y="14" width="22" height="29" fill="none" stroke="#fff" strokeWidth="0.7" />
      <circle cx="23" cy="28.5" r="7" fill="none" stroke="#fff" strokeWidth="0.7" strokeDasharray="3 2" />
      {/* Right key */}
      <rect x="77" y="14" width="22" height="29" fill="none" stroke="#fff" strokeWidth="0.7" />
      <circle cx="77" cy="28.5" r="7" fill="none" stroke="#fff" strokeWidth="0.7" strokeDasharray="3 2" />
      {/* Left 3pt arc */}
      <path d="M 1 11 Q 40 28.5 1 46" fill="none" stroke="#fff" strokeWidth="0.7" />
      {/* Right 3pt arc */}
      <path d="M 99 11 Q 60 28.5 99 46" fill="none" stroke="#fff" strokeWidth="0.7" />
      {/* Baskets */}
      <circle cx="5.5" cy="28.5" r="1.8" fill="none" stroke="#f97316" strokeWidth="1" />
      <circle cx="94.5" cy="28.5" r="1.8" fill="none" stroke="#f97316" strokeWidth="1" />
    </svg>
  );
}

function CricketField() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="1" />
      {/* Inner ring */}
      <circle cx="50" cy="50" r="28" fill="none" stroke="#fff" strokeWidth="0.7" strokeDasharray="3 2" />
      {/* Pitch */}
      <rect x="46" y="32" width="8" height="36" rx="1" fill="none" stroke="#fff" strokeWidth="0.9" />
      {/* Crease lines */}
      <line x1="43" y1="38" x2="57" y2="38" stroke="#fff" strokeWidth="0.6" />
      <line x1="43" y1="62" x2="57" y2="62" stroke="#fff" strokeWidth="0.6" />
    </svg>
  );
}

const SURFACE_COMPONENT = {
  football: FootballPitch,
  basketball: BasketballCourt,
  cricket: CricketField,
};

const SPORT_BG = {
  football: "linear-gradient(160deg, #166534 0%, #15803d 45%, #14532d 100%)",
  basketball: "linear-gradient(160deg, #7c2d12 0%, #9a3412 45%, #431407 100%)",
  cricket: "linear-gradient(160deg, #1e3a5f 0%, #1e40af 45%, #1e3a8a 100%)",
};

/* ── player pin ─────────────────────────────────────────────────────── */
function PlayerPin({ player, index, accent, readOnly, mounted, onMove, onInvokeEdit }) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pinRef = useRef(null);

  useEffect(() => {
    if (readOnly || !dragging) return;
    
    const handleMove = (e) => {
      // Find relative position within the pitch container
      const container = pinRef.current.closest('.pitch-canvas');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      
      x = Math.max(0, Math.min(x, 100));
      y = Math.max(0, Math.min(y, 100));
      
      onMove(index, x, y);
    };

    const handleUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, readOnly, index, onMove]);

  const handlePointerDown = (e) => {
    if (readOnly) return;
    e.preventDefault(); // prevent text selection
    // Only drag on left click
    if (e.button !== 0) return;
    setDragging(true);
    setHovered(false);
  };

  const handleClick = (e) => {
    if (readOnly) return;
    // Don't trigger edit if we were dragging
    e.stopPropagation();
    onInvokeEdit(index, player);
  };

  const style = {
    position: "absolute",
    left: `${player.x}%`,
    top: `${player.y}%`,
    transform: mounted
      ? "translate(-50%, -50%) scale(1)"
      : "translate(-50%, -50%) scale(0)",
    transition: dragging ? "none" : "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.4s ease, top 0.4s ease",
    zIndex: hovered || dragging ? 20 : 10,
    cursor: readOnly ? "default" : (dragging ? "grabbing" : "grab"),
    touchAction: "none", // Prevent scrolling while dragging
  };

  return (
    <div 
      className="pinnable-player"
      ref={pinRef}
      style={style} 
      onMouseEnter={() => !dragging && setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {/* Tooltip (Only showing on hover) */}
      {hovered && !dragging && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", border: `1px solid ${accent}44`,
          borderRadius: 10, padding: "0.5rem 0.75rem", whiteSpace: "nowrap", color: "#fff",
          fontSize: "0.76rem", fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          animation: "fadeInUp 0.15s ease", minWidth: 120, pointerEvents: "none", zIndex: 50,
        }}>
          <div style={{ fontWeight: 800, fontSize: "0.82rem", color: accent }}>{player.name}</div>
          <div style={{ color: "#94a3b8", marginTop: 1 }}>{player.role}</div>
          {player.instructions && (
            <div style={{ color: "#cbd5e1", marginTop: 4, fontSize: "0.72rem", maxWidth: 200, whiteSpace: "normal", lineHeight: 1.4 }}>
              📋 {player.instructions}
            </div>
          )}
          {!readOnly && <div style={{ color: "#fbbf24", marginTop: 4, fontSize: "0.6rem", fontStyle: "italic" }}>Click to edit. Drag to move.</div>}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, background: "rgba(0,0,0,0.92)", borderRight: `1px solid ${accent}44`, borderBottom: `1px solid ${accent}44`, rotate: "45deg" }} />
        </div>
      )}

      {/* Pin body */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
        border: `2.5px solid ${hovered || dragging ? "#fff" : accent + "88"}`,
        boxShadow: hovered || dragging
          ? `0 0 0 4px ${accent}33, 0 8px 20px rgba(0,0,0,0.5)`
          : `0 4px 12px rgba(0,0,0,0.4)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        color: "#fff", fontSize: "0.6rem", fontWeight: 800, lineHeight: 1.1,
        transition: dragging ? "none" : "all 0.2s ease",
        transform: hovered || dragging ? "scale(1.15)" : "scale(1)",
      }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.02em" }}>
          {player.name.slice(0, 3)}
        </span>
      </div>
    </div>
  );
}

/* ── comment thread ─────────────────────────────────────────────────── */
function CommentThread({ formationId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!formationId) return;
    fetch(`${API}/api/formations/${formationId}/comments`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [formationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/formations/${formationId}/comment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) { setComments(p => [...p, data]); setText(""); }
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleDelete = async (cId) => {
    try {
      const res = await fetch(`${API}/api/formations/${formationId}/comment/${cId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) setComments(p => p.filter(c => c._id !== cId));
    } catch {}
  };

  const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{
        padding: "1rem 1.25rem 0.75rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        <MessageCircle size={16} color="#94a3b8" />
        <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#e2e8f0" }}>Comments</span>
        <span style={{
          marginLeft: "auto", background: "rgba(255,255,255,0.1)", borderRadius: 20,
          padding: "0.1rem 0.55rem", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8"
        }}>{comments.length}</span>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <Loader2 size={20} className="spinner-icon" color="#64748b" />
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: "center", color: "#475569", fontSize: "0.82rem", marginTop: "2rem" }}>
            Be the first to comment on this formation.
          </div>
        ) : (
          comments.map(c => (
            <div key={c._id} style={{
              display: "flex", gap: "0.65rem", alignItems: "flex-start",
              animation: "fadeInUp 0.25s ease",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 800, color: "#fff",
                overflow: "hidden",
              }}>
                {c.user?.profilePic
                  ? <img src={`${API}${c.user.profilePic}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : initials(c.user?.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#e2e8f0" }}>{c.user?.name || "User"}</span>
                  <span style={{ fontSize: "0.67rem", color: "#475569" }}>
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {currentUser?._id && String(c.user?._id) === String(currentUser._id) && (
                    <button onClick={() => handleDelete(c._id)} style={{
                      marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                      color: "#475569", padding: "0.1rem", borderRadius: 4, display: "flex",
                      transition: "color 0.2s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#475569"}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: "4px 12px 12px 12px",
                  padding: "0.5rem 0.75rem", fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.5,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {c.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", gap: "0.5rem", alignItems: "flex-end",
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your thoughts…"
          rows={2}
          maxLength={1000}
          style={{
            flex: 1, resize: "none", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
            padding: "0.6rem 0.8rem", color: "#e2e8f0", fontSize: "0.82rem",
            outline: "none", fontFamily: "inherit", lineHeight: 1.5,
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(148,163,184,0.35)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <button type="submit" disabled={!text.trim() || submitting} style={{
          background: "#3b82f6", border: "none", borderRadius: 10,
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", cursor: "pointer", flexShrink: 0,
          opacity: text.trim() ? 1 : 0.4, transition: "opacity 0.2s, transform 0.2s",
        }}
          onMouseEnter={e => { if (text.trim()) e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {submitting ? <Loader2 size={14} className="spinner-icon" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────── */
export default function FormationsBoard({
  formation: initialFormation,
  readOnly = false,
  onShare,
  onSave,
  onClose,
  showComments = false,
  formationId,
  currentUser,
  inline = false,
}) {
  const [formation, setFormation] = useState(() =>
    initialFormation || createFormationDraft("football")
  );
  // Ensure formation shape has opponent array
  useEffect(() => {
    if (!formation.modes?.opponent) {
      setFormation(f => ({ ...f, modes: { ...f.modes, opponent: [] } }));
    }
  }, []);

  const [mode, setMode] = useState("attack");
  const [mounted, setMounted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(showComments);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const sportMeta = getSportMeta(formation.sportType);
  const accent = sportMeta.accent;
  const SurfaceComp = SURFACE_COMPONENT[formation.sportType] || FootballPitch;
  const players = formation.modes?.[mode] || [];
  const presetOptions = getPresetOptions(formation.sportType);

  // Animate players in on mount and when mode/sport changes
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [mode, formation.sportType, formation.presetKey]);

  const changeSport = (sportType) => {
    setFormation(f => applyPresetToFormation({ ...f, sportType }, sportType, presetOptions[0]?.key));
  };
  const changePreset = (presetKey) => {
    setFormation(f => applyPresetToFormation(f, formation.sportType, presetKey));
    setMounted(false);
    setTimeout(() => setMounted(true), 60);
  };

  const handleMovePlayer = (idx, x, y) => {
    let nx = x;
    let ny = y;
    
    if (formation.sportType === "football") {
      // SVGRect: x from 4 to 96, y from 2.5 to 97.5
      nx = Math.max(4, Math.min(nx, 96));
      ny = Math.max(2.5, Math.min(ny, 97.5));
    } else if (formation.sportType === "basketball") {
      nx = Math.max(1, Math.min(nx, 99));
      ny = Math.max(1.7, Math.min(ny, 98.2));
    } else if (formation.sportType === "cricket") {
      // Radial clamp: x, y distance to 50,50 shouldn't exceed 46% radius
      const dx = nx - 50;
      const dy = ny - 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 46) {
        nx = 50 + (dx / dist) * 46;
        ny = 50 + (dy / dist) * 46;
      }
    }

    setFormation(f => {
      const updated = { ...f };
      updated.modes[mode] = [...updated.modes[mode]];
      updated.modes[mode][idx] = { ...updated.modes[mode][idx], x: nx, y: ny };
      return updated;
    });
  };

  const handleEditPlayerSave = (e) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    setFormation(f => {
      const updated = { ...f };
      updated.modes[mode] = [...updated.modes[mode]];
      updated.modes[mode][editingPlayer.index] = { 
        ...updated.modes[mode][editingPlayer.index], 
        name: editingPlayer.name,
        role: editingPlayer.role,
        instructions: editingPlayer.instructions,
        color: editingPlayer.color
      };
      return updated;
    });
    setEditingPlayer(null);
  };

  const handleAddOpponentPlayer = () => {
    setFormation(f => {
      const updated = { ...f };
      if (!updated.modes.opponent) updated.modes.opponent = [];
      updated.modes.opponent = [
        ...updated.modes.opponent, 
        { name: "OPP", role: "Opponent", instructions: "", x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }
      ];
      return updated;
    });
  };

  const handleShare = async () => {
    if (!onShare) return;
    setSharing(true);
    try { await onShare(formation); }
    finally { setSharing(false); }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try { await onSave(formation); }
    finally { setSaving(false); }
  };

  return (
    <div style={inline ? {
      width: "100%", height: "100%", position: "relative",
    } : {
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
      padding: "1rem",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(28px) } to { opacity:1; transform:translateX(0) } }
        .spinner-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={inline ? {
        display: "flex", width: "100%", height: "100%"
      } : {
        display: "flex",
        gap: "1rem",
        width: "100%",
        maxWidth: commentsOpen ? 1100 : 780,
        height: "min(calc(100vh - 2rem), 660px)",
        animation: "fadeInUp 0.3s ease",
      }}>
        {/* ── Left panel: Pitch ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "rgba(15,23,42,0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
          backdropFilter: "blur(20px)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}>
          {/* Toolbar */}
          <div style={{
            padding: "0.8rem 1rem",
            background: "rgba(0,0,0,0.4)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", gap: "0.8rem",
          }}>
            {/* Top Row: Name, Modes, Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
              {/* Formation name */}
              <div style={{ flex: 1, minWidth: 200 }}>
                {readOnly ? (
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#f1f5f9", letterSpacing: "0.01em" }}>
                      {formation.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {sportMeta.label} · {sportMeta.surfaceLabel}
                    </div>
                  </div>
                ) : (
                  <input
                    value={formation.name}
                    onChange={e => setFormation(f => ({ ...f, name: e.target.value }))}
                    maxLength={120}
                    placeholder="Formation name…"
                    style={{
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, padding: "0.4rem 0.75rem", color: "#f1f5f9",
                      fontWeight: 700, fontSize: "0.88rem", width: "100%", outline: "none",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(148,163,184,0.35)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                )}
              </div>

              {/* Modes toggle */}
              <div style={{
                display: "flex", background: "rgba(0,0,0,0.5)", borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)", padding: "0.2rem",
              }}>
                {[
                  { id: "attack", icon: Sword, color: "#ef4444" },
                  { id: "defense", icon: Shield, color: "#3b82f6" },
                  { id: "opponent", icon: Users, color: "#f59e0b" }
                ].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    display: "flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.3rem 0.8rem", borderRadius: 16, border: "none", cursor: "pointer",
                    background: mode === m.id ? m.color : "transparent",
                    color: mode === m.id ? "#fff" : "#64748b",
                    fontWeight: 700, fontSize: "0.75rem", transition: "all 0.25s ease",
                    textTransform: "capitalize",
                  }}>
                    <m.icon size={12} />
                    {m.id}
                  </button>
                ))}
              </div>

              {/* Right side actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {/* Comment toggle */}
                {(showComments || formationId) && (
                  <button onClick={() => setCommentsOpen(o => !o)} style={{
                    display: "flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.4rem 0.8rem", borderRadius: 8,
                    background: commentsOpen ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${commentsOpen ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: commentsOpen ? "#93c5fd" : "#e2e8f0",
                    fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <MessageCircle size={14} />
                    <span className="hidden sm:inline">Comments</span>
                  </button>
                )}

                {/* Share button (coach only) */}
                {!readOnly && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {onSave && (
                      <button onClick={handleSave} disabled={saving} style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.4rem 0.85rem", borderRadius: 8,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0",
                        fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                        transition: "all 0.2s",
                        opacity: saving ? 0.7 : 1,
                      }}>
                        {saving ? <Loader2 size={13} className="spinner-icon" /> : <Save size={13} />}
                        {saving ? "Saving…" : "Save"}
                      </button>
                    )}
                    {onShare && (
                      <button onClick={handleShare} disabled={sharing} style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.4rem 0.85rem", borderRadius: 8,
                        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                        border: "none", color: "#fff",
                        fontWeight: 800, fontSize: "0.78rem", cursor: "pointer",
                        boxShadow: `0 4px 14px ${accent}44`, transition: "all 0.2s",
                        opacity: sharing ? 0.7 : 1,
                      }}>
                        {sharing ? <Loader2 size={13} className="spinner-icon" /> : <Share2 size={13} />}
                        {sharing ? "Sharing…" : "Share"}
                      </button>
                    )}
                  </div>
                )}

                {/* Close */}
                {!inline && (
                  <button onClick={onClose} style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#94a3b8", cursor: "pointer",
                    transition: "all 0.2s", flexShrink: 0, marginLeft: "0.2rem"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#f87171"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Settings & Tools */}
            {!readOnly && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                {/* Sport picker */}
                <div style={{ position: "relative" }}>
                  <select
                    value={formation.sportType}
                    onChange={e => changeSport(e.target.value)}
                    style={{
                      appearance: "none", background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                      padding: "0.35rem 1.8rem 0.35rem 0.8rem", color: "#e2e8f0",
                      fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", outline: "none",
                    }}
                  >
                    {SPORT_OPTIONS.map(s => <option key={s.value} value={s.value} style={{ background: "#0f172a", color: "#f8fafc", padding: "0.5rem" }}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                </div>

                {/* Preset picker */}
                <div style={{ position: "relative" }}>
                  <select
                    value={formation.presetKey}
                    onChange={e => changePreset(e.target.value)}
                    style={{
                      appearance: "none", background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                      padding: "0.35rem 1.8rem 0.35rem 0.8rem", color: "#e2e8f0",
                      fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", outline: "none",
                    }}
                  >
                    {presetOptions.map(p => <option key={p.key} value={p.key} style={{ background: "#0f172a", color: "#f8fafc", padding: "0.5rem" }}>{p.label}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                </div>

                {/* Add Opponent Player Button */}
                {mode === "opponent" && (
                    <button onClick={handleAddOpponentPlayer} style={{
                        display: "flex", alignItems: "center", gap: "0.35rem",
                        padding: "0.35rem 0.8rem", borderRadius: 8,
                        background: "rgba(245, 158, 11, 0.2)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        color: "#fcd34d",
                        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(245, 158, 11, 0.25)" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(245, 158, 11, 0.15)" }}
                    >
                        + Add Opponent Pin
                    </button>
                )}
              </div>
            )}
          </div>

          {/* Pitch canvas (Zoomable) */}
          <div style={{
            flex: 1,
            position: "relative",
            background: SPORT_BG[formation.sportType],
            overflow: "hidden",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.3)",
          }}>
            <TransformWrapper
              initialScale={1}
              minScale={0.4}
              maxScale={3}
              centerOnInit
              limitToBounds={false}
              panning={{ excluded: ["pinnable-player"] }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Zoom Controls */}
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: "0.4rem", zIndex: 100 }}>
                    <button onClick={() => zoomIn()} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", padding: 6, cursor: "pointer", backdropFilter: "blur(4px)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}><ZoomIn size={16} /></button>
                    <button onClick={() => zoomOut()} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", padding: 6, cursor: "pointer", backdropFilter: "blur(4px)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}><ZoomOut size={16} /></button>
                    <button onClick={() => resetTransform()} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", padding: 6, cursor: "pointer", backdropFilter: "blur(4px)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}><Maximize size={16} /></button>
                  </div>

                  {/* Mode label watermark */}
                  <div style={{
                    position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    background: "rgba(0,0,0,0.5)", borderRadius: 20,
                    padding: "0.25rem 0.8rem",
                    color: mode === "attack" ? "#fca5a5" : (mode === 'defense' ? "#93c5fd" : "#fcd34d"),
                    fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em",
                    backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.08)", pointerEvents: "none", zIndex: 10
                  }}>
                    {mode === "attack" ? <Sword size={11} /> : (mode === "defense" ? <Shield size={11} /> : <Users size={11} />)}
                    {mode} formation
                  </div>

                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div className="pitch-canvas" style={{
                      position: "relative",
                      width: SPORT_AR[formation.sportType] > 1 ? "100%" : "auto",
                      height: SPORT_AR[formation.sportType] > 1 ? "auto" : "100%",
                      aspectRatio: String(SPORT_AR[formation.sportType]),
                      maxWidth: "100%",
                      maxHeight: "100%",
                      margin: "auto",
                    }}>
                      <SurfaceComp />
                      
                      {/* Player pins */}
                      {players.map((p, i) => {
                        const baseAccent = mode === "opponent" ? "#dc2626" : accent;
                        const pinAccent = p.color || baseAccent;
                        return (
                          <PlayerPin 
                            key={`${p.name}-${i}`} 
                            index={i}
                            player={p} 
                            accent={pinAccent} 
                            readOnly={readOnly} 
                            mounted={mounted} 
                            onMove={handleMovePlayer}
                            onInvokeEdit={(idx, plyr) => setEditingPlayer({ index: idx, ...plyr })}
                          />
                        );
                      })}
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>

        {/* Edit Modal */}
        {editingPlayer !== null && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)",
          }} onClick={() => setEditingPlayer(null)}>
            <div style={{
              background: "rgba(15,23,42,0.95)", border: `1px solid ${accent}`, borderRadius: 16,
              padding: "1.5rem", width: 320, boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              animation: "fadeInUp 0.15s ease",
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem", fontWeight: 800 }}>Edit Player Details</h3>
                <button onClick={() => setEditingPlayer(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={18} /></button>
              </div>
              <form onSubmit={handleEditPlayerSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.3rem", fontWeight: 600 }}>Player Name</label>
                  <input value={editingPlayer.name} onChange={e => setEditingPlayer(p => ({...p, name: e.target.value}))} placeholder="Player Name" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box" }} autoFocus />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.3rem", fontWeight: 600 }}>Role / Position</label>
                  <input value={editingPlayer.role} onChange={e => setEditingPlayer(p => ({...p, role: e.target.value}))} placeholder="Role / Position" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.3rem", fontWeight: 600 }}>Special Instructions</label>
                  <input value={editingPlayer.instructions} onChange={e => setEditingPlayer(p => ({...p, instructions: e.target.value}))} placeholder="Press high, mark #10, etc." style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem", color: "#fff", fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 600 }}>Kit Color</label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[accent, "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#ffffff", "#0f172a"].map(c => (
                      <button 
                        key={c} type="button" onClick={() => setEditingPlayer(p => ({...p, color: c}))} 
                        style={{ 
                          width: 26, height: 26, borderRadius: "50%", background: c, 
                          border: editingPlayer.color === c || (!editingPlayer.color && c === accent) ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)", 
                          cursor: "pointer", outline: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.4)" 
                        }} 
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", marginTop: "0.5rem" }}>Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {/* ── Right panel: Comments ── */}
        {commentsOpen && formationId && (
          <div style={{
            width: 300,
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            overflow: "hidden",
            backdropFilter: "blur(20px)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            animation: "slideInRight 0.3s ease",
            display: "flex",
            flexDirection: "column",
          }}>
            <CommentThread formationId={formationId} currentUser={currentUser} />
          </div>
        )}
      </div>
    </div>
  );
}
