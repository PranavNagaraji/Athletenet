import { useEffect, useState } from "react";
import { Compass, Search, Building2, UserPlus, Loader2, X, AlertCircle, Check, Send } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  
  // Join Request Modal
  const [selectedClub, setSelectedClub] = useState(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [sending, setSending] = useState(false);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  useEffect(() => {
    fetch(`${API}/api/club/all`)
      .then(r => r.json())
      .then(d => setClubs(Array.isArray(d) ? d : []))
      .catch(() => showMsg("error", "Failed to load clubs"))
      .finally(() => setLoading(false));
  }, []);

  const handleJoinRequest = async () => {
    if (!selectedClub) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/join-request/request`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: selectedClub._id, message: requestMsg })
      });
      const data = await res.json();
      if (res.ok) { showMsg("success", "Join request sent!"); setSelectedClub(null); setRequestMsg(""); }
      else showMsg("error", data.message || "Failed to send request.");
    } catch { showMsg("error", "Network error."); }
    finally { setSending(false); }
  };

  const filteredClubs = clubs.filter(c => 
    c.admin?.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Browse Clubs</h1>
          <p>Find and join specialized sports clubs</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15}/> {msg.text}</div>}
        
        <div style={{ marginBottom: "2rem", position: "relative", maxWidth: "600px" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "1.2rem", display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <Search size={20} color="var(--theme-primary)" />
          </div>
          <input 
            type="text" placeholder="Search by club name, sport or specialization..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ 
               width: "100%", 
               padding: "1.2rem 1.5rem 1.2rem 3.5rem", 
               fontSize: "1.05rem", 
               background: "var(--theme-surface)", 
               border: "2px solid var(--theme-border)", 
               borderRadius: "16px", 
               color: "var(--theme-text)", 
               outline: "none",
               boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
               transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onFocus={e => { e.target.style.borderColor = "var(--theme-primary)"; e.target.style.boxShadow = "0 10px 30px rgba(249,115,22,0.15)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--theme-border)"; e.target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.05)"; }}
          />
          {search && (
            <button 
                onClick={() => setSearch("")} 
                style={{ position: "absolute", right: "1.2rem", top: "50%", transform: "translateY(-50%)", background: "var(--theme-surface-2)", border: "none", color: "var(--theme-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--theme-primary)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--theme-surface-2)"; e.currentTarget.style.color = "var(--theme-muted)"; }}
            >
                <X size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading clubs...</div>
        ) : filteredClubs.length === 0 ? (
          <div className="empty-state">
            <Compass size={40} />
            <p>No clubs found matching your search.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:"1.2rem" }}>
            {filteredClubs.map(club => {
              const pic = club.profilePic || club.admin?.profilePic;
              return (
              <div key={club._id} className="card" style={{ display:"flex", flexDirection:"column", padding:"1.2rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem" }}>
                  <div style={{ width:48, height:48, borderRadius:"50%", background: pic ? "var(--theme-surface-2)" : "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))", border: "1px solid var(--theme-border)", display:"flex", alignItems:"center", justifyContent:"center", overflow: "hidden", flexShrink: 0 }}>
                    {pic ? (
                        <img src={`${API}${pic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    ) : (
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", color: "#fff", fontWeight: 800 }}>
                            {(club.name || club.admin?.name || "C").charAt(0).toUpperCase()}
                        </span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin:0, fontSize:"1.05rem", fontWeight:600 }}>{club.name || club.admin?.name || "Official Club"}</h3>
                    <span style={{ fontSize:"0.8rem", color:"var(--theme-primary)", background:"rgba(249,115,22,0.1)", padding:"0.1rem 0.5rem", borderRadius:100, display:"inline-block", marginTop:"0.2rem" }}>
                      {club.specialization || "General Sports"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize:"0.85rem", color:"var(--theme-muted)", marginBottom:"1.2rem", flex:1 }}>
                  Established: {club.establishedYear || "N/A"}<br/>
                  Facilities: {(club.facilities || []).join(", ") || "None listed"}
                </div>
                <button className="btn-primary" style={{ width:"100%", justifyContent:"center" }} onClick={() => setSelectedClub(club)}>
                  <UserPlus size={16}/> Request to Join
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedClub && (
        <div className="modal-backdrop" onClick={() => setSelectedClub(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <div className="modal-title">Join {selectedClub.name || selectedClub.admin?.name || "Club"}</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setSelectedClub(null)}><X size={16}/></button>
            </div>
            <p style={{ fontSize:"0.9rem", color:"var(--theme-muted)", marginBottom:"1rem" }}>
              Send a message to the club admin indicating your primary sport and why you want to join.
            </p>
            <div className="field-group">
              <label className="field-label">Message</label>
              <textarea 
                className="field-input" rows="4" 
                placeholder="Hi, I am an experienced runner looking for..."
                value={requestMsg} onChange={e => setRequestMsg(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setSelectedClub(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleJoinRequest} disabled={sending}>
                {sending ? <Loader2 size={16} className="spinner-icon"/> : <Send size={16}/>} Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
