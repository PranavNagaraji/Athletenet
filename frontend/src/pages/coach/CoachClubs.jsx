import { useEffect, useState } from "react";
import { Compass, Search, Building2, UserPlus, Loader2, X, AlertCircle, Send } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CoachClubs() {
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
          <h1>Browse Clubs (Coach)</h1>
          <p>Find specialized sports clubs to lend your coaching expertise</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15}/> {msg.text}</div>}
        
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", background:"var(--c-surface)", border:"1px solid var(--c-border)", borderRadius:8, padding:"0.6rem 1rem" }}>
            <Search size={18} color="var(--c-muted)" style={{ marginRight:"0.8rem" }} />
            <input 
              type="text" placeholder="Search by club name or sport..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background:"transparent", border:"none", color:"var(--c-text)", width:"100%", outline:"none", fontSize:"0.95rem" }}
            />
          </div>
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
            {filteredClubs.map(club => (
               <div key={club._id} className="card" style={{ display:"flex", flexDirection:"column", padding:"1.2rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem" }}>
                  <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--c-surface2)", border: "1px solid var(--c-border)", display:"flex", alignItems:"center", justifyContent:"center", overflow: "hidden" }}>
                    {club.profilePic ? <img src={`${API}${club.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <Building2 size={24} color="var(--c-muted)"/>}
                  </div>
                  <div>
                    <h3 style={{ margin:0, fontSize:"1.05rem", fontWeight:600 }}>{club.name || club.admin?.name || "Official Club"}</h3>
                    <span style={{ fontSize:"0.8rem", color:"var(--c-primary)", background:"rgba(249,115,22,0.1)", padding:"0.1rem 0.5rem", borderRadius:100, display:"inline-block", marginTop:"0.2rem" }}>
                      {club.specialization || "General Sports"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize:"0.85rem", color:"var(--c-muted)", marginBottom:"1.2rem", flex:1 }}>
                  Established: {club.establishedYear || "N/A"}<br/>
                  Facilities: {(club.facilities || []).join(", ") || "None listed"}
                </div>
                <button className="btn-primary" style={{ width:"100%", justifyContent:"center" }} onClick={() => setSelectedClub(club)}>
                  <UserPlus size={16}/> Request to Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedClub && (
        <div className="modal-backdrop" onClick={() => setSelectedClub(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <div className="modal-title">Coach {selectedClub.name || selectedClub.admin?.name || "Club"}</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setSelectedClub(null)}><X size={16}/></button>
            </div>
            <p style={{ fontSize:"0.9rem", color:"var(--c-muted)", marginBottom:"1rem" }}>
              Send a message to the club admin outlining your experience and how you can aid their athletes.
            </p>
            <div className="field-group">
              <label className="field-label">Message</label>
              <textarea 
                className="field-input" rows="4" 
                placeholder="Hello, I have 10 years of coaching experience in..."
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
