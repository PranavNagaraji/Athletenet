import { useEffect, useState } from "react";
import { Trophy, Plus, Trash2, Pencil, Loader2, X, Calendar, AlertCircle, Users } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const emptyForm = { name:"", sport:"", description:"", startDate:"", endDate:"", status:"planned", public:true };

export default function ClubTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTourney, setEditTourney] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);

  const [activeTab, setActiveTab] = useState("hosting"); // "hosting" or "arena"
  const [allTournaments, setAllTournaments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(null); // { tourneyId, tourneyName }
  const [joining, setJoining] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3000); };

  const fetchTourneys = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "hosting" ? "/api/tournament/me" : "/api/tournament/all";
      const res  = await fetch(`${API}${endpoint}`, { credentials:"include" });
      const data = await res.json();
      if (activeTab === "hosting") setTournaments(Array.isArray(data) ? data : []);
      else setAllTournaments(Array.isArray(data) ? data : []);
    } catch { 
      if (activeTab === "hosting") setTournaments([]); 
      else setAllTournaments([]);
    }
    finally { setLoading(false); }
  };

  const fetchMyTeams = async () => {
    try {
      // 1. Get the club ID for this admin
      const cRes = await fetch(`${API}/api/club/profile`, { credentials: "include" });
      const cData = await cRes.json();
      if (cData?._id) {
        // 2. Fetch teams using the actual Club ID
        const res = await fetch(`${API}/api/team/club/${cData._id}`, { credentials:"include" });
        const data = await res.json();
        setMyTeams(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error("Error fetching teams for tournament reg:", e); }
  };

  useEffect(() => { fetchTourneys(); if (activeTab === "arena") fetchMyTeams(); }, [activeTab]);

  const handleJoin = async () => {
    if (!selectedTeam) return showMsg("error", "Please select a team");
    setJoining(true);
    try {
      const res = await fetch(`${API}/api/tournament/join`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: showJoinModal.tourneyId, teamId: selectedTeam })
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Team registered successfully!");
        setShowJoinModal(null);
        setSelectedTeam("");
        fetchTourneys();
      } else {
        showMsg("error", data.message);
      }
    } catch { showMsg("error", "Joining failed"); }
    finally { setJoining(false); }
  };

  const openCreate = () => { setForm(emptyForm); setEditTourney(null); setShowModal(true); };
  const openEdit   = (t) => {
    setForm({
      name:      t.name,
      sport:     t.sport,
      description: t.description || "",
      startDate: t.startDate ? t.startDate.slice(0,10) : "",
      endDate:   t.endDate   ? t.endDate.slice(0,10)   : "",
      status:    t.status,
      public:    t.public ?? true,
    });
    setEditTourney(t); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url    = editTourney ? `${API}/api/tournament/${editTourney._id}` : `${API}/api/tournament/create`;
      const method = editTourney ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { showMsg("success", editTourney?"Tournament updated!":"Tournament created!"); setShowModal(false); fetchTourneys(); }
      else { const d = await res.json(); showMsg("error", d.message); }
    } catch { showMsg("error","Network error."); }
    setSaving(false);
  };

  const deleteTourney = async (id) => {
    if (!confirm("Delete this tournament?")) return;
    const res = await fetch(`${API}/api/tournament/${id}`, { method:"DELETE", credentials:"include" });
    if (res.ok) { showMsg("success","Deleted."); setTournaments(items=>items.filter(x=>x._id!==id)); }
    else { const d = await res.json(); showMsg("error",d.message); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tournaments</h1>
          <p>Host events or enter the arena to compete with your teams</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
           <div className="tab-switcher" style={{ display: "flex", background: "var(--c-surface2)", borderRadius: "8px", padding: "0.3rem" }}>
              <button 
                onClick={() => setActiveTab("hosting")}
                style={{ 
                  padding: "0.5rem 1rem", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                  background: activeTab === "hosting" ? "var(--c-primary)" : "none",
                  color: activeTab === "hosting" ? "#fff" : "var(--c-muted)"
                }}
              >Hosting</button>
              <button 
                onClick={() => setActiveTab("arena")}
                style={{ 
                  padding: "0.5rem 1rem", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                  background: activeTab === "arena" ? "var(--c-primary)" : "none",
                  color: activeTab === "arena" ? "#fff" : "var(--c-muted)"
                }}
              >Arena</button>
           </div>
           {activeTab === "hosting" && (
             <button className="btn-primary" onClick={openCreate}><Plus size={15}/> Host Tournament</button>
           )}
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={14}/> {msg.text}</div>}

        {loading ? (
          <div className="loading-state"><Loader2 size={20} className="spinner-icon"/>Loading...</div>
        ) : (activeTab === "hosting" ? (
          tournaments.length === 0 ? (
            <div className="empty-state" style={{ minHeight:300 }}>
              <Trophy size={48}/>
              <p>No tournaments hosted yet. Launch your first event!</p>
              <button className="btn-primary" onClick={openCreate}><Plus size={15}/>Host Tournament</button>
            </div>
          ) : (
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Sport</th><th>Schedule</th><th>Teams</th><th>Status</th><th>Visibility</th><th></th></tr>
                </thead>
                <tbody>
                  {tournaments.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight:600 }}>{t.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>
                      </td>
                      <td style={{ textTransform:"capitalize",color:"var(--c-muted)" }}>{t.sport}</td>
                      <td style={{ color:"var(--c-muted)",fontSize:"0.85rem" }}>
                          <div>{fmt(t.startDate)}</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>to {fmt(t.endDate)}</div>
                      </td>
                      <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--c-primary)" }}>
                              <Users size={14} /> {t.teams?.length || 0} Joined
                          </div>
                      </td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td><span className={`badge ${t.public?"badge-accepted":"badge-inactive"}`}>{t.public?"Public":"Private"}</span></td>
                      <td>
                        <div style={{ display:"flex", gap:"0.4rem" }}>
                          <button className="btn-ghost" style={{ padding:"0.35rem 0.65rem", fontSize:"0.78rem" }} onClick={()=>openEdit(t)}>
                            <Pencil size={12}/>
                          </button>
                          <button className="btn-danger" style={{ padding:"0.35rem 0.65rem" }} onClick={()=>deleteTourney(t._id)}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
             {allTournaments.map(t => {
               const joinedTeams = t.teams?.filter(jt => myTeams.some(mt => mt._id === (jt._id || jt))) || [];
               return (
                 <div key={t._id} className="card" style={{ position: "relative", overflow: "hidden", border: joinedTeams.length > 0 ? "1px solid var(--c-primary)" : "1px solid var(--c-border)" }}>
                    <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: "0.5rem" }}>
                      {joinedTeams.length > 0 && <span className="badge badge-accepted" style={{ fontSize: "0.65rem" }}>Registered</span>}
                      <span className={`badge badge-${t.status}`} style={{ fontSize: "0.65rem" }}>{t.status}</span>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--c-primary)", marginBottom: "0.25rem" }}>{t.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--c-muted)" }}>
                        <Trophy size={14} /> <span style={{ textTransform: "capitalize" }}>{t.sport}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#ddd", marginBottom: "1.2rem", height: "auto" }}>{t.description || "Exciting competitive event for elite teams."}</p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "1.5rem" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Users size={14} /> {t.teams?.length || 0} Joined
                       </div>
                       <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Calendar size={14} /> {fmt(t.startDate)}
                       </div>
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => setShowJoinModal({ tourneyId: t._id, tourneyName: t.name })}
                    >
                      Enter Arena
                    </button>
                 </div>
               );
             })}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <div className="modal-title">{editTourney?"Edit Tournament":"Host Tournament"}</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={()=>setShowModal(false)}><X size={16}/></button>
            </div>

            <div className="form-grid" style={{ gap:"0.9rem" }}>
              <div className="field-group">
                <label className="field-label">Tournament Name</label>
                <input className="field-input" placeholder="e.g. Winter Cup 2026" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              </div>
              <div className="field-group">
                <label className="field-label">Sport</label>
                <input className="field-input" placeholder="e.g. Basketball" value={form.sport} onChange={e=>setForm(f=>({...f,sport:e.target.value}))}/>
              </div>
              <div className="field-group">
                <label className="field-label">Description (Optional)</label>
                <textarea className="field-input" style={{ minHeight: 60 }} placeholder="Short summary of rules or prizes..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label">Start Date</label>
                  <input className="field-input" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/>
                </div>
                <div className="field-group">
                  <label className="field-label">End Date</label>
                  <input className="field-input" type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/>
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label">Initial Status</label>
                  <select className="field-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option value="planned">Planned (Recruiting)</option>
                    <option value="active">Active (Ongoing)</option>
                    <option value="finished">Finished (Completed)</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Visibility</label>
                  <select className="field-select" value={form.public?"public":"private"} onChange={e=>setForm(f=>({...f,public:e.target.value==="public"}))}>
                    <option value="public">Public (Visible to All)</option>
                    <option value="private">Private (Invite Only)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving?<Loader2 size={14} className="spinner-icon"/>:<Plus size={14}/>}
                {editTourney?"Update Tournament":"Publish Tournament"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-backdrop" onClick={()=>setShowJoinModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <div className="modal-title">Register Team</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={()=>setShowJoinModal(null)}><X size={16}/></button>
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1.2rem" }}>
              Enter your club's elite squad into <strong>{showJoinModal.tourneyName}</strong>.
            </p>

            <div className="field-group">
              <label className="field-label">Select Participating Team</label>
              <select className="field-select" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)}>
                <option value="">-- Choose a Team --</option>
                {myTeams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
              {myTeams.length === 0 && (
                <div style={{ fontSize: "0.75rem", color: "#ff8800", marginTop: "0.5rem" }}>
                   You haven't created any teams yet. Create one in the Teams section first.
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "2rem" }}>
              <button className="btn-ghost" onClick={()=>setShowJoinModal(null)}>Back</button>
              <button className="btn-primary" onClick={handleJoin} disabled={joining || !selectedTeam}>
                {joining ? <Loader2 size={14} className="spinner-icon"/> : <Trophy size={14}/>} {joining ? "Registering..." : "Confirm Registration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
