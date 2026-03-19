import { useEffect, useState } from "react";
import { Users, Search, Contact, Loader2, Dumbbell, Star, ChevronRight, AlertCircle } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubTalent() {
  const [tab, setTab] = useState("athletes");
  const [athletes, setAthletes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/athlete/all`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/coach/all`).then(r => r.ok ? r.json() : [])
    ])
    .then(([athData, coachData]) => {
      setAthletes(Array.isArray(athData) ? athData : []);
      setCoaches(Array.isArray(coachData) ? coachData : []);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const getFiltered = (arr) => {
    return arr.filter(item => {
      const name = item.user?.name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    });
  };

  const currentData = tab === "athletes" ? getFiltered(athletes) : getFiltered(coaches);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Discover Talent</h1>
          <p>Browse global athletes and coaches to join your club's roster</p>
        </div>
      </div>

      <div className="page-body">
        
        {/* Search & Tabs */}
        <div className="card" style={{ padding: "0.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", flex: 1, minWidth: 250, alignItems: "center", background: "var(--c-surface2)", borderRadius: 8, padding: "0.6rem 1rem" }}>
              <Search size={18} color="var(--c-muted)" style={{ marginRight: "0.8rem" }} />
              <input 
                type="text" placeholder={`Search ${tab}...`} 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", color: "var(--c-text)", width: "100%", outline: "none", fontSize: "0.95rem" }}
              />
            </div>

            <div style={{ display: "flex", background: "var(--c-surface2)", borderRadius: 8, padding: "0.3rem" }}>
              <button className={`btn-ghost ${tab === "athletes" ? "btn-primary" : ""}`} style={{ padding: "0.5rem 1rem" }} onClick={() => setTab("athletes")}>
                <Dumbbell size={16} /> Athletes
              </button>
              <button className={`btn-ghost ${tab === "coaches" ? "btn-primary" : ""}`} style={{ padding: "0.5rem 1rem" }} onClick={() => setTab("coaches")}>
                <Star size={16} /> Coaches
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading talent network...</div>
        ) : currentData.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p>No {tab} found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.2rem", marginTop: "1.5rem" }}>
            {currentData.map(person => (
              <div key={person._id} className="card" style={{ display: "flex", flexDirection: "column", padding: "1.2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ width: 55, height: 55, borderRadius: "50%", background: "var(--c-surface2)", border: "1px solid var(--c-border)", overflow: "hidden" }}>
                    {person.user?.profilePic ? (
                       <img src={`${API}${person.user.profilePic}`} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                    ) : (
                       <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Contact size={24} color="var(--c-muted)"/></div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>{person.user?.name || "Anonymous User"}</h3>
                    <div style={{ fontSize: "0.8rem", color: "var(--c-primary)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.2rem" }}>
                       {tab === "athletes" ? <Dumbbell size={12}/> : <Star size={12}/>} 
                       {tab === "athletes" ? "Athlete" : "Coach"}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, fontSize: "0.85rem", color: "var(--c-muted)", background: "rgba(255,255,255,0.02)", padding: "0.8rem", borderRadius: 8, marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span>Age:</span> <strong style={{color:"var(--c-text)"}}>{person.age || "—"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span>Height / Weight:</span> <strong style={{color:"var(--c-text)"}}>{person.height ? `${person.height}cm` : "—"} / {person.weight ? `${person.weight}kg` : "—"}</strong>
                  </div>
                  
                  {tab === "athletes" ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Sports:</span> 
                      <strong style={{color:"var(--c-text)", textAlign:"right", maxWidth:"60%", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textTransform:"capitalize"}} title={person.sports?.join(", ")}>
                        {person.sports?.length > 0 ? person.sports.join(", ") : "—"}
                      </strong>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                        <span>Experience:</span> <strong style={{color:"var(--c-text)"}}>{person.experience ? `${person.experience} yrs` : "—"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Specialization:</span> 
                        <strong style={{color:"var(--c-text)", textAlign:"right", maxWidth:"60%", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={person.specialization}>
                          {person.specialization || "—"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile viewing removed as per request */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
