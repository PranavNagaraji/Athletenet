import { useEffect, useState } from "react";
import { ClubIcon, Plus, Trash2, UserPlus, UserMinus, Pencil, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubTeams() {
  const { user } = useAuth();
  const [teams, setTeams]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [msg, setMsg]             = useState(null);
  // for adding members to a team
  const [addModal, setAddModal]   = useState(null); // { teamId, type:"athlete"|"coach" }
  const [addUserId, setAddUserId] = useState("");

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const fetchTeams = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/team/club/${user._id}`, { credentials:"include" });
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch { setTeams([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeams(); }, [user]);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    const res = await fetch(`${API}/api/team/create`, {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });
    if (res.ok) { showMsg("success","Team created!"); setNewTeamName(""); setShowModal(false); fetchTeams(); }
    else { const d = await res.json(); showMsg("error", d.message); }
    setCreating(false);
  };

  const deleteTeam = async (id) => {
    if (!confirm("Delete this team?")) return;
    const res = await fetch(`${API}/api/team/${id}`, { method:"DELETE", credentials:"include" });
    if (res.ok) { showMsg("success","Team deleted."); setTeams(t => t.filter(tm => tm._id !== id)); }
    else { const d = await res.json(); showMsg("error", d.message); }
  };

  const addMember = async () => {
    if (!addUserId.trim() || !addModal) return;
    const { teamId, type } = addModal;
    const body = type === "athlete" ? { teamId, athleteId: addUserId } : { teamId, coachId: addUserId };
    const res = await fetch(`${API}/api/team/${type}`, {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { showMsg("success","Member added!"); setAddModal(null); setAddUserId(""); fetchTeams(); }
    else { const d = await res.json(); showMsg("error", d.message); }
  };

  const removeMember = async (teamId, userId, type) => {
    const body = type === "athlete" ? { teamId, athleteId: userId } : { teamId, coachId: userId };
    const res = await fetch(`${API}/api/team/${type}`, {
      method:"DELETE", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { showMsg("success","Member removed."); fetchTeams(); }
    else { const d = await res.json(); showMsg("error", d.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Teams</h1>
          <p>{teams.length} team{teams.length !== 1 ? "s" : ""} in your club</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Team
        </button>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {loading ? (
          <div className="loading-state"><Loader2 size={20} className="spinner-icon" />Loading teams…</div>
        ) : teams.length === 0 ? (
          <div className="empty-state" style={{ minHeight:300 }}>
            <ClubIcon size={48} />
            <p>No teams yet. Create your first team.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />New Team</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {teams.map(team => (
              <div key={team._id} className="card">
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                  <ClubIcon size={18} color="var(--c-primary)" />
                  <span style={{ fontWeight:700, fontSize:"1rem", flex:1 }}>{team.name}</span>
                  <span style={{ fontSize:"0.78rem", color:"var(--c-muted)" }}>
                    {team.athletes?.length || 0} athletes · {team.coaches?.length || 0} coaches
                  </span>
                  <button className="btn-ghost" style={{ padding:"0.3rem 0.6rem" }}
                    onClick={() => setExpandedId(expandedId === team._id ? null : team._id)}>
                    {expandedId === team._id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                  <button className="btn-primary" style={{ padding:"0.35rem 0.7rem", fontSize:"0.78rem" }}
                    onClick={() => { setAddModal({ teamId: team._id, type:"athlete" }); }}>
                    <UserPlus size={13}/> Add
                  </button>
                  <button className="btn-danger" onClick={() => deleteTeam(team._id)}>
                    <Trash2 size={13}/> Delete
                  </button>
                </div>

                {expandedId === team._id && (
                  <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid var(--c-border)" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                      {/* Athletes */}
                      <div>
                        <div style={{ fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--c-muted)", marginBottom:"0.5rem", fontWeight:600 }}>
                          Athletes ({team.athletes?.length || 0})
                        </div>
                        {(!team.athletes || team.athletes.length === 0)
                          ? <p style={{ fontSize:"0.82rem", color:"var(--c-muted)" }}>No athletes.</p>
                          : team.athletes.map(id => (
                            <div key={id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.3rem 0", fontSize:"0.85rem" }}>
                              <span style={{ color:"var(--c-muted)" }}>{typeof id === "object" ? id.name || id._id : id}</span>
                              <button className="btn-danger" style={{ padding:"0.2rem 0.5rem", fontSize:"0.72rem" }}
                                onClick={() => removeMember(team._id, typeof id==="object"?id._id:id, "athlete")}>
                                <UserMinus size={11}/> Remove
                              </button>
                            </div>
                          ))
                        }
                      </div>
                      {/* Coaches */}
                      <div>
                        <div style={{ fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--c-muted)", marginBottom:"0.5rem", fontWeight:600 }}>
                          Coaches ({team.coaches?.length || 0})
                        </div>
                        {(!team.coaches || team.coaches.length === 0)
                          ? <p style={{ fontSize:"0.82rem", color:"var(--c-muted)" }}>No coaches.</p>
                          : team.coaches.map(id => (
                            <div key={id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.3rem 0", fontSize:"0.85rem" }}>
                              <span style={{ color:"var(--c-muted)" }}>{typeof id === "object" ? id.name || id._id : id}</span>
                              <button className="btn-danger" style={{ padding:"0.2rem 0.5rem", fontSize:"0.72rem" }}
                                onClick={() => removeMember(team._id, typeof id==="object"?id._id:id, "coach")}>
                                <UserMinus size={11}/> Remove
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <div className="modal-title">Create New Team</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <div className="field-group">
              <label className="field-label">Team Name</label>
              <input className="field-input" placeholder="e.g. Team Alpha"
                value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createTeam()} />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createTeam} disabled={creating}>
                {creating ? <Loader2 size={14} className="spinner-icon"/> : <Plus size={14}/>} Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addModal && (
        <div className="modal-backdrop" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <div className="modal-title">Add Member to Team</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setAddModal(null)}><X size={16}/></button>
            </div>
            <div style={{ marginBottom:"0.75rem" }}>
              <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
                {["athlete","coach"].map(t => (
                  <button key={t} onClick={() => setAddModal(a => ({...a, type:t}))}
                    className={addModal.type===t?"btn-primary":"btn-ghost"}
                    style={{ textTransform:"capitalize", flex:1 }}>{t}</button>
                ))}
              </div>
              <div className="field-group">
                <label className="field-label">User ID</label>
                <input className="field-input" placeholder="Paste the user's _id here"
                  value={addUserId} onChange={e => setAddUserId(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={addMember}><UserPlus size={14}/> Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
