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
  const [clubAthletes, setClubAthletes] = useState([]);
  const [clubCoaches, setClubCoaches] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

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

  useEffect(() => { fetchTeams(); fetchClubMembers(); }, [user]);

  const fetchClubMembers = async () => {
    if (!user?._id) return;
    try {
      const [athRes, coachRes] = await Promise.all([
        fetch(`${API}/api/club/athlete/${user._id}`, { credentials:"include" }),
        fetch(`${API}/api/club/coaches/${user._id}`, { credentials:"include" }),
      ]);
      const [athleteData, coachData] = await Promise.all([athRes.json(), coachRes.json()]);
      setClubAthletes(Array.isArray(athleteData) ? athleteData : []);
      setClubCoaches(Array.isArray(coachData) ? coachData : []);
    } catch {
      setClubAthletes([]);
      setClubCoaches([]);
    }
  };

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
    if (!selectedMemberIds.length || !addModal) {
      showMsg("error", "Select one or more club members to add.");
      return;
    }
    const { teamId, type } = addModal;
    const body = type === "athlete"
      ? { teamId, athleteIds: selectedMemberIds }
      : { teamId, coachIds: selectedMemberIds };
    const res = await fetch(`${API}/api/team/${type}`, {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showMsg("success","Members added!");
      setAddModal(null);
      setSelectedMemberIds([]);
      setMemberSearch("");
      fetchTeams();
    } else {
      const d = await res.json();
      showMsg("error", d.message || "Failed to add members.");
    }
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
                    onClick={() => { setAddModal({ teamId: team._id, type:"athlete" }); setSelectedMemberIds([]); setMemberSearch(""); }}>
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
      {addModal && (() => {
        const activeTeam = teams.find((t) => t._id === addModal.teamId);
        const activeTeamMembers = addModal.type === "athlete" ? activeTeam?.athletes || [] : activeTeam?.coaches || [];
        const teamMemberIds = new Set(
          activeTeamMembers
            .map((member) => typeof member === "object" ? member._id : member)
            .filter(Boolean)
        );
        const memberOptions = addModal.type === "athlete" ? clubAthletes : clubCoaches;
        const filteredOptions = memberOptions
          .filter((member) => {
            const label = (member.user?.name || member.name || "").toLowerCase();
            const email = (member.user?.email || "").toLowerCase();
            return label.includes(memberSearch.toLowerCase()) || email.includes(memberSearch.toLowerCase());
          })
          .map((member) => ({
            id: member.user?._id || member._id,
            name: member.user?.name || member.name || "Unknown",
            email: member.user?.email || "",
            avatar: member.user?.profilePic || member.profilePic || "",
          }));

        return (
          <div className="modal-backdrop" onClick={() => setAddModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
                <div className="modal-title">Add {addModal.type === "athlete" ? "Athlete" : "Coach"} to Team</div>
                <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setAddModal(null)}><X size={16}/></button>
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
                  {["athlete","coach"].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setAddModal(a => ({ ...a, type: t })); setSelectedMemberIds([]); setMemberSearch(""); }}
                      className={addModal.type === t ? "btn-primary" : "btn-ghost"}
                      style={{ textTransform:"capitalize", flex: 1 }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="field-group">
                  <label className="field-label">Search {addModal.type === "athlete" ? "athletes" : "coaches"}</label>
                  <input
                    className="field-input"
                    placeholder={`Search ${addModal.type === "athlete" ? "athletes" : "coaches"} by name or email`}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: "1rem" }}>
                {filteredOptions.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2rem 1rem", textAlign: "center" }}>
                    <p style={{ margin: 0, color: "var(--c-muted)", fontSize: "0.95rem" }}>
                      {memberOptions.length === 0
                        ? `No ${addModal.type === "athlete" ? "club athletes" : "club coaches"} currently available.`
                        : `No matching ${addModal.type === "athlete" ? "athletes" : "coaches"}.`}
                    </p>
                  </div>
                ) : (
                  filteredOptions.map((member) => {
                    const alreadyAdded = teamMemberIds.has(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (alreadyAdded) return;
                          setSelectedMemberIds((curr) => curr.includes(member.id)
                            ? curr.filter((item) => item !== member.id)
                            : [...curr, member.id]
                          );
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          padding: "0.8rem 1rem",
                          marginBottom: "0.5rem",
                          borderRadius: 10,
                          border: selectedMemberIds.includes(member.id) ? "1px solid var(--c-primary)" : "1px solid var(--c-border)",
                          background: selectedMemberIds.includes(member.id) ? "var(--c-surface)" : "transparent",
                          cursor: alreadyAdded ? "default" : "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.93rem" }}>{member.name}</div>
                          <div style={{ color: "var(--c-muted)", fontSize: "0.82rem" }}>{member.email || "No email"}</div>
                        </div>
                        <button
                          type="button"
                          className={alreadyAdded ? "btn-ghost" : selectedMemberIds.includes(member.id) ? "btn-primary" : "btn-ghost"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (alreadyAdded) return;
                            setSelectedMemberIds((curr) => curr.includes(member.id)
                              ? curr.filter((item) => item !== member.id)
                              : [...curr, member.id]
                            );
                          }}
                          disabled={alreadyAdded}
                          style={{ padding: "0.45rem 0.85rem", whiteSpace: "nowrap" }}
                        >
                          {alreadyAdded ? "Added" : selectedMemberIds.includes(member.id) ? "Selected" : "Select"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={addMember} disabled={selectedMemberIds.length === 0}>
                  <UserPlus size={14}/> Add {selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
