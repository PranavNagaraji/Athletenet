import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, Building2, Search, Loader2 } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteTournaments() {
  const [tourneys, setTourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tournament Arena</h1>
          <p>Discover and participate in tournaments hosted by elite clubs</p>
        </div>
      </div>

      <div className="page-body">
        {/* Search */}
        <div className="card" style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
            <Search size={18} color="var(--c-muted)" />
            <input 
                type="text" placeholder="Search tournaments, sports, or clubs..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: "0.95rem" }}
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
                        <span style={{ fontWeight: 600, color: "#fff" }}>{t.club?.admin?.name || "Premium Club"}</span>
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
                    <div style={{ marginTop: "1rem", padding: "0.8rem", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
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

                <div style={{ padding: "1rem 1.2rem", background: "rgba(255,255,255,0.02)", borderTop: "1px solid var(--c-border)", display: "flex", gap: "0.8rem" }}>
                    <button className="btn-primary" style={{ flex: 1, fontSize: "0.85rem" }}>
                        View Details
                    </button>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: "0.85rem", border: "1px solid var(--c-border)" }}>
                        Contact Host
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
