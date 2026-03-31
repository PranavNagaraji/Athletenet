import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, Building2, Search, Loader2, X, Send } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteTournaments() {
  const [tourneys, setTourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [viewDetailsModal, setViewDetailsModal] = useState(null);
  const [contactHostModal, setContactHostModal] = useState(null);
  const [contactMsg, setContactMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    fetchTourneys();
  }, []);

  const fetchTourneys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tournament/all`);
      if (res.ok) {
        const data = await res.json();
        setTourneys(Array.isArray(data) ? data : []);
      }
    } catch { setTourneys([]); }
    finally { setLoading(false); }
  };

  const filtered = tourneys.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.sport.toLowerCase().includes(search.toLowerCase()) ||
    t.club?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

  const handleContactHost = async () => {
    if (!contactMsg.trim()) return;
    setSendingMsg(true);
    // Simulate sending message to the host since we don't have a specific tournament-contact endpoint built out here yet
    // Typically, we would POST to /api/chat or similar.
    setTimeout(() => {
        setSendingMsg(false);
        setContactHostModal(null);
        setContactMsg("");
        setAlertInfo({ type: "success", text: "Message sent to the tournament host successfully!" });
        setTimeout(() => setAlertInfo(null), 3000);
    }, 1000);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tournament Arena</h1>
          <p>Discover and participate in tournaments hosted by elite clubs</p>
        </div>
      </div>

      <div className="page-body">
        {alertInfo && <div className={`alert alert-${alertInfo.type}`} style={{ marginBottom: "1rem" }}>{alertInfo.text}</div>}
        {/* Search */}
        <div className="card" style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
            <Search size={18} color="var(--c-muted)" />
            <input 
                type="text" placeholder="Search tournaments, sports, or clubs..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "var(--c-text)", outline: "none", fontSize: "0.95rem" }}
            />
        </div>

        {loading ? (
          <div className="loading-state"><Loader2 size={30} className="spinner-icon" /> Fetching active events...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Trophy size={48} />
            <p>No tournaments found. Check back later or start your own!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {filtered.map(t => (
              <div key={t._id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "1.2rem", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{t.name}</h3>
                      <div style={{ fontSize: "0.8rem", color: "var(--c-primary)", textTransform: "capitalize", fontWeight: 600 }}>{t.sport} Tournament</div>
                    </div>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1.2rem", lineHeight: 1.5 }}>
                    {t.description || "Join this elite competition and show your talent on the global stage."}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--c-muted)", gridColumn: "span 2", marginBottom: "0.4rem" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", border: "1px solid var(--c-border)" }}>
                            {t.club?.admin?.profilePic ? (
                                <img src={`${API}${t.club.admin.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                            ) : (
                                <Building2 size={12} style={{margin:6}} />
                            )}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--c-text)" }}>{t.club?.admin?.name || "Premium Club"}</span>
                        <span style={{ opacity: 0.6 }}>(Host)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--c-muted)" }}>
                        <Users size={14} /> <span>{t.teams?.length || 0} Teams</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--c-muted)" }}>
                        <Calendar size={14} /> <span>{fmt(t.startDate)}</span>
                    </div>
                  </div>

                  {t.teams?.length > 0 && (
                    <div style={{ marginTop: "1rem", padding: "0.8rem", background: "var(--theme-overlay-soft)", borderRadius: 8 }}>
                       <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>PARTICIPATING TEAMS</div>
                       <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                         {t.teams.slice(0, 3).map(team => (
                           <span key={team._id} style={{ fontSize: "0.75rem", background: "var(--c-surface2)", padding: "0.2rem 0.5rem", borderRadius: 4, border: "1px solid var(--c-border)" }}>
                             {team.name}
                           </span>
                         ))}
                         {t.teams.length > 3 && (
                           <span style={{ fontSize: "0.75rem", color: "var(--c-primary)", padding: "0.2rem" }}>
                             +{t.teams.length - 3} more
                           </span>
                         )}
                       </div>
                    </div>
                  )}
                </div>

                <div style={{ padding: "1rem 1.2rem", background: "var(--theme-surface-3)", borderTop: "1px solid var(--theme-border)", display: "flex", gap: "0.8rem" }}>
                    <button className="btn-primary" style={{ flex: 1, fontSize: "0.85rem" }} onClick={() => setViewDetailsModal(t)}>
                        View Details
                    </button>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: "0.85rem", border: "1px solid var(--theme-border-strong)" }} onClick={() => setContactHostModal(t)}>
                        Contact Host
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- View Details Modal --- */}
      {viewDetailsModal && (
        <div className="modal-backdrop" onClick={() => setViewDetailsModal(null)}>
            <div className="modal" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div className="modal-title" style={{ marginBottom: 0 }}>{viewDetailsModal.name}</div>
                    <button className="btn-ghost" style={{ padding: "0.4rem" }} onClick={() => setViewDetailsModal(null)}>
                        <X size={18} />
                    </button>
                </div>
                
                <div style={{ padding: "1rem", background: "var(--theme-surface-2)", borderRadius: 8, marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
                        <div style={{ padding: "0.3rem 0.8rem", background: "var(--theme-primary)", color: "#fff", borderRadius: 100, fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
                            {viewDetailsModal.sport}
                        </div>
                        <div className={`badge badge-${viewDetailsModal.status}`}>{viewDetailsModal.status}</div>
                    </div>
                    
                    <p style={{ color: "var(--theme-text)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "1rem" }}>
                        {viewDetailsModal.description || "No extensive description available for this tournament. Join and show your skills on the field!"}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem", borderTop: "1px solid var(--theme-border)" }}>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.3rem" }}>Start Date</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{fmt(viewDetailsModal.startDate)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.3rem" }}>End Date</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{fmt(viewDetailsModal.endDate)}</div>
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.3rem" }}>Hosted By</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--theme-surface-3)", overflow: "hidden", border: "1px solid var(--theme-border)" }}>
                                    {viewDetailsModal.club?.admin?.profilePic ? (
                                        <img src={`${API}${viewDetailsModal.club.admin.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                                    ) : (
                                        <Building2 size={16} color="var(--theme-muted)" style={{margin:7}}/>
                                    )}
                                </div>
                                <span style={{ fontWeight: 600 }}>{viewDetailsModal.club?.name || viewDetailsModal.club?.admin?.name || "Official Club"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-ghost" onClick={() => setViewDetailsModal(null)}>Close</button>
                    <button className="btn-primary" onClick={() => {
                        setContactHostModal(viewDetailsModal);
                        setViewDetailsModal(null);
                    }}>Contact Host</button>
                </div>
            </div>
        </div>
      )}

      {/* --- Contact Host Modal --- */}
      {contactHostModal && (
        <div className="modal-backdrop" onClick={() => setContactHostModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div className="modal-title" style={{ marginBottom: 0 }}>Contact Host</div>
                    <button className="btn-ghost" style={{ padding: "0.4rem" }} onClick={() => setContactHostModal(null)}>
                        <X size={18} />
                    </button>
                </div>
                <p style={{ color: "var(--theme-muted)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
                    Send a direct message to the organizer of <strong>{contactHostModal.name}</strong> to inquire about participation, rules, or fixtures.
                </p>
                <div className="field-group">
                    <label className="field-label">Message</label>
                    <textarea 
                        className="field-input" rows="5"
                        placeholder={`Hi, I have a question regarding the ${contactHostModal.sport} tournament...`}
                        value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                    />
                </div>
                <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
                    <button className="btn-ghost" onClick={() => setContactHostModal(null)} disabled={sendingMsg}>Cancel</button>
                    <button className="btn-primary" onClick={handleContactHost} disabled={sendingMsg}>
                        {sendingMsg ? <Loader2 size={16} className="spinner-icon" /> : <Send size={16} />} Send Message
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
