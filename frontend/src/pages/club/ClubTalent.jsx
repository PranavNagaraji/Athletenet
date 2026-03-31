import { useEffect, useState } from "react";
import { Search, Loader2, Dumbbell, Star, MapPin, X, Users, Ruler, Weight, Calendar, UserCircle } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const renderAvatar = (name, url, size = 56) => {
  if (url) {
    return (
      <img
        src={`${API}${url}`}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--theme-primary)", boxShadow: "0 0 0 3px rgba(249,115,22,0.15)" }}
      />
    );
  }
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, var(--theme-primary), #c2410c)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 800, border: "3px solid rgba(249,115,22,0.4)", boxShadow: "0 0 0 3px rgba(249,115,22,0.15)", flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--theme-surface-2)", padding: "0.35rem 0.65rem", borderRadius: 20, border: "1px solid var(--theme-border)" }}>
    <Icon size={12} color="var(--theme-primary)" />
    <span style={{ fontSize: "0.72rem", color: "var(--theme-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
    <span style={{ fontSize: "0.8rem", color: "var(--theme-text)", fontWeight: 700 }}>{value}</span>
  </div>
);

export default function ClubTalent() {
  const [tab, setTab] = useState("athletes");
  const [athletes, setAthletes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

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
    const q = search.toLowerCase();
    return arr.filter(item => {
      const name = item.user?.name || "";
      const sports = (item.user?.sports || []).join(" ");
      const bio = item.user?.bio || "";
      const location = item.user?.location?.name || "";
      return name.toLowerCase().includes(q) || sports.toLowerCase().includes(q) || bio.toLowerCase().includes(q) || location.toLowerCase().includes(q);
    });
  };

  const currentData = tab === "athletes" ? getFiltered(athletes) : getFiltered(coaches);

  return (
    <div style={{ padding: "1.5rem", paddingBottom: "3rem" }}>
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: "1.5rem" }}>
        <div className="page-header-left">
          <h1>Discover Talent</h1>
          <p>Browse global athletes and coaches to recruit for your club's roster</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search size={18} color="var(--theme-primary)" style={{ position: "absolute", top: "50%", left: "1.1rem", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder={`Search ${tab} by name, sport, location…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.95rem 1.2rem 0.95rem 3.2rem", fontSize: "1rem", background: "var(--theme-surface)", border: "2px solid var(--theme-border)", borderRadius: 14, color: "var(--theme-text)", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocus={e => { e.target.style.borderColor = "var(--theme-primary)"; e.target.style.boxShadow = "0 0 0 4px rgba(249,115,22,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--theme-border)"; e.target.style.boxShadow = "none"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--theme-muted)", display: "flex" }}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", background: "var(--theme-surface)", borderRadius: 12, padding: "0.35rem", border: "1px solid var(--theme-border)", gap: "0.3rem" }}>
          <button
            onClick={() => { setTab("athletes"); setSearch(""); }}
            style={{ padding: "0.6rem 1.2rem", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s",
              background: tab === "athletes" ? "var(--theme-primary)" : "transparent",
              color: tab === "athletes" ? "#fff" : "var(--theme-muted)" }}
          >
            <Dumbbell size={15} /> Athletes
            <span style={{ background: tab === "athletes" ? "rgba(255,255,255,0.2)" : "var(--theme-surface-2)", padding: "0.1rem 0.5rem", borderRadius: 20, fontSize: "0.75rem" }}>{athletes.length}</span>
          </button>
          <button
            onClick={() => { setTab("coaches"); setSearch(""); }}
            style={{ padding: "0.6rem 1.2rem", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s",
              background: tab === "coaches" ? "var(--theme-primary)" : "transparent",
              color: tab === "coaches" ? "#fff" : "var(--theme-muted)" }}
          >
            <Star size={15} /> Coaches
            <span style={{ background: tab === "coaches" ? "rgba(255,255,255,0.2)" : "var(--theme-surface-2)", padding: "0.1rem 0.5rem", borderRadius: 20, fontSize: "0.75rem" }}>{coaches.length}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 size={24} className="spinner-icon" /> Loading talent network…</div>
      ) : currentData.length === 0 ? (
        <div className="empty-state">
          <Users size={48} opacity={0.3} />
          <p style={{ marginTop: "1rem", color: "var(--theme-muted)" }}>No {tab} found{search ? ` matching "${search}"` : " yet"}.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.2rem" }}>
          {currentData.map(person => {
            const u = person.user || {};
            const name = u.name || "Anonymous";
            const bio = u.bio || "";
            const sports = u.sports || [];
            const location = u.location?.name || null;
            const age = person.age || null;
            const height = person.height || null;
            const weight = person.weight || null;
            const experience = person.experience || null;
            const specialization = person.specialization || null;

            return (
              <div
                key={person._id}
                onClick={() => setSelected(person)}
                className="card"
                style={{ display: "flex", flexDirection: "column", padding: "1.5rem", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
              >
                {/* Top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: tab === "athletes" ? "linear-gradient(90deg, var(--theme-primary), #c2410c)" : "linear-gradient(90deg, #10b981, #047857)" }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  {renderAvatar(name, u.profilePic, 52)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--theme-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--theme-primary)", background: "rgba(249,115,22,0.1)", padding: "0.15rem 0.6rem", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        {tab === "athletes" ? <Dumbbell size={11} /> : <Star size={11} />}
                        {tab === "athletes" ? "Athlete" : "Coach"}
                      </span>
                      {location && (
                        <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)", display: "flex", alignItems: "center", gap: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <MapPin size={11} /> {location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {bio ? (
                  <p style={{ fontSize: "0.83rem", color: "var(--theme-muted)", marginBottom: "1rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {bio}
                  </p>
                ) : (
                  <p style={{ fontSize: "0.83rem", color: "var(--theme-border)", marginBottom: "1rem", fontStyle: "italic" }}>No biography provided.</p>
                )}

                {/* Sports tags */}
                {sports.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                    {sports.slice(0, 4).map(sport => (
                      <span key={sport} style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--theme-primary)", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", padding: "0.2rem 0.6rem", borderRadius: 20, textTransform: "capitalize" }}>
                        {sport}
                      </span>
                    ))}
                    {sports.length > 4 && <span style={{ fontSize: "0.72rem", color: "var(--theme-muted)", padding: "0.2rem 0.6rem" }}>+{sports.length - 4} more</span>}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "auto" }}>
                  {age && <StatBadge icon={Calendar} label="Age" value={`${age}y`} />}
                  {height && <StatBadge icon={Ruler} label="Ht" value={`${height}cm`} />}
                  {weight && <StatBadge icon={Weight} label="Wt" value={`${weight}kg`} />}
                  {experience && <StatBadge icon={Star} label="Exp" value={`${experience}y`} />}
                  {specialization && <StatBadge icon={Dumbbell} label="Spec" value={specialization} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Detail Modal */}
      {selected && (() => {
        const u = selected.user || {};
        const name = u.name || "Anonymous";
        const bio = u.bio || "";
        const sports = u.sports || [];
        const location = u.location?.name || null;
        return (
          <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--theme-surface)", borderRadius: 20, padding: "2rem", maxWidth: 480, width: "100%", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", border: "1px solid var(--theme-border)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: "1.2rem", right: "1.2rem", background: "var(--theme-surface-2)", border: "none", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-muted)", transition: "all 0.2s" }}>
                <X size={16} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", marginBottom: "1.5rem" }}>
                {renderAvatar(name, u.profilePic, 72)}
                <div>
                  <h2 style={{ margin: 0, color: "var(--theme-text)", fontWeight: 800, fontSize: "1.3rem" }}>{name}</h2>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--theme-primary)", background: "rgba(249,115,22,0.1)", padding: "0.2rem 0.8rem", borderRadius: 20, marginTop: "0.3rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    {tab === "athletes" ? <Dumbbell size={12} /> : <Star size={12} />}
                    {tab === "athletes" ? "Athlete" : "Coach"}
                  </span>
                  {location && <div style={{ fontSize: "0.8rem", color: "var(--theme-muted)", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}><MapPin size={12} /> {location}</div>}
                </div>
              </div>

              {bio ? (
                <p style={{ fontSize: "0.9rem", color: "var(--theme-muted)", lineHeight: 1.7, marginBottom: "1.5rem", padding: "1rem", background: "var(--theme-surface-2)", borderRadius: 12, border: "1px solid var(--theme-border)" }}>{bio}</p>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--theme-border)", fontStyle: "italic", marginBottom: "1.5rem" }}>No biography provided.</p>
              )}

              {sports.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--theme-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.6rem" }}>Sports & Disciplines</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {sports.map(sport => (
                      <span key={sport} style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--theme-primary)", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", padding: "0.3rem 0.8rem", borderRadius: 20, textTransform: "capitalize" }}>{sport}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                {[
                  { label: "Age", value: selected.age ? `${selected.age} years` : null, icon: Calendar },
                  { label: "Height", value: selected.height ? `${selected.height} cm` : null, icon: Ruler },
                  { label: "Weight", value: selected.weight ? `${selected.weight} kg` : null, icon: Weight },
                  { label: "Experience", value: selected.experience ? `${selected.experience} years` : null, icon: Star },
                  { label: "Specialization", value: selected.specialization || null, icon: Dumbbell },
                ].filter(s => s.value).map(stat => (
                  <div key={stat.label} style={{ background: "var(--theme-surface-2)", padding: "0.8rem 1rem", borderRadius: 10, border: "1px solid var(--theme-border)", display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <stat.icon size={16} color="var(--theme-primary)" />
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>{stat.label}</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--theme-text)", marginTop: "0.1rem" }}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selected.clubs?.length > 0 && (
                <div style={{ marginTop: "1.2rem", padding: "0.8rem 1rem", background: "var(--theme-surface-2)", borderRadius: 10, border: "1px solid var(--theme-border)", fontSize: "0.82rem", color: "var(--theme-muted)" }}>
                  <strong style={{ color: "var(--theme-text)" }}>Clubs:</strong> {selected.clubs.length} club{selected.clubs.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
