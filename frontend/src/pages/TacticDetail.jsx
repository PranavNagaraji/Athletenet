import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Info, MessageCircle, User, ShieldCheck, Sword } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import FormationsBoard from "../components/FormationsBoard";

const API = import.meta.env.VITE_BACKEND_URL;

export default function TacticDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/formations/detail/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setFormation(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading-state" style={{ height: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Loader2 size={32} className="spinner-icon" color="var(--theme-primary)" />
        <p style={{ color: "var(--theme-muted)", fontWeight: 600 }}>Loading tactics...</p>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="empty-state" style={{ height: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div className="empty-state-icon"><Info size={32} /></div>
        <h3>Formation not found</h3>
        <p>The shared tactics might have been deleted or moved.</p>
        <button className="btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: "50%", background: "var(--theme-surface-2)" }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--theme-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: "0.2rem" }}>
            Tactical Analysis
          </div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900 }}>{formation.name}</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Main Board */}
        <div className="card" style={{ padding: 0, overflow: "hidden", height: 700, borderRadius: 24, background: "var(--theme-surface)", border: "1px solid var(--theme-border)", position: "relative" }}>
          <FormationsBoard
            formation={formation}
            readOnly={true}
            inline={true}
            showComments={true}
            formationId={formation._id}
            currentUser={user}
          />
        </div>

        {/* Sidebar: Details & Instructions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: 700 }}>
             {/* General Info */}
             <div className="card" style={{ padding: "1.25rem", borderRadius: 20 }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                   <Info size={18} color="var(--theme-primary)" />
                   Tactic Insight
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--theme-surface-2)", borderRadius: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.8rem" }}>
                            {formation.coachId?.user?.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase" }}>Designed By</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{formation.coachId?.user?.name || "Coach"}</div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                         <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: 12, textAlign: "center" }}>
                            <Sword size={16} color="#ef4444" style={{ margin: "0 auto 0.25rem" }} />
                            <div style={{ fontSize: "0.65rem", color: "#fca5a5", fontWeight: 800, textTransform: "uppercase" }}>Attacking</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ef4444" }}>{formation.modes?.attack?.length || 0}</div>
                         </div>
                         <div style={{ padding: "0.75rem", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: 12, textAlign: "center" }}>
                            <ShieldCheck size={16} color="#3b82f6" style={{ margin: "0 auto 0.25rem" }} />
                            <div style={{ fontSize: "0.65rem", color: "#93c5fd", fontWeight: 800, textTransform: "uppercase" }}>Defending</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#3b82f6" }}>{formation.modes?.defense?.length || 0}</div>
                         </div>
                    </div>
                </div>
             </div>

             {/* Player Roles Tip */}
             <div className="card" style={{ padding: "1.25rem", borderRadius: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                   <User size={18} color="var(--theme-primary)" />
                   Player Instructions
                </h3>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(formation.modes?.attack || []).map((p, i) => (
                        <div key={i} style={{ padding: "0.75rem", background: "var(--theme-surface-2)", borderRadius: 12, border: "1px solid var(--theme-border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{p.name}</span>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--theme-primary)", textTransform: "uppercase" }}>{p.role}</span>
                            </div>
                            {p.instructions ? (
                                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--theme-muted)", lineHeight: 1.4 }}>
                                    {p.instructions}
                                </p>
                            ) : (
                                <span style={{ fontSize: "0.7rem", color: "var(--theme-muted-light)", fontStyle: "italic" }}>No specific instructions.</span>
                            )}
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
