import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search, UserMinus, Users, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubMembers() {
  const { user } = useAuth();
  const [tab, setTab] = useState("athletes");
  const [athletes, setAthletes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  const clubId = user?._id;

  useEffect(() => {
    if (!clubId) return;

    setLoading(true);
    Promise.all([
      fetch(`${API}/api/club/athlete/${clubId}`, { credentials: "include" }).then((response) => response.json()),
      fetch(`${API}/api/club/coaches/${clubId}`, { credentials: "include" }).then((response) => response.json()),
    ])
      .then(([athleteData, coachData]) => {
        setAthletes(Array.isArray(athleteData) ? athleteData : []);
        setCoaches(Array.isArray(coachData) ? coachData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  const handleRemove = async (userId) => {
    if (!confirm("Remove this member from the club?")) return;

    const res = await fetch(`${API}/api/club/remove-user`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, clubId }),
    });

    if (res.ok) {
      setAthletes((current) => current.filter((member) => member.user?._id !== userId));
      setCoaches((current) => current.filter((member) => member.user?._id !== userId));
      setMsg({ type: "success", text: "Member removed." });
      setTimeout(() => setMsg(null), 3000);
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.message });
    }
  };

  const list = tab === "athletes" ? athletes : coaches;
  const filtered = list.filter((member) => {
    const haystack = [member.user?.name, member.user?.email].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Members</h1>
          <p>{athletes.length} athletes and {coaches.length} coaches currently active in your club environment.</p>
        </div>
      </div>

      <div className="page-body stack-md">
        {msg ? (
          <div className={`alert alert-${msg.type}`}>
            <AlertCircle size={15} /> {msg.text}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["athletes", "coaches"].map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={tab === value ? "btn-primary" : "btn-ghost"}
                style={{ textTransform: "capitalize" }}
              >
                {value === "athletes" ? `Athletes (${athletes.length})` : `Coaches (${coaches.length})`}
              </button>
            ))}
          </div>

          <div className="search-shell" style={{ flex: "1 1 320px", maxWidth: 420 }}>
            <div className="search-shell-icon">
              <Search size={18} />
            </div>
            <input
              className="search-shell-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search ? (
              <button type="button" className="search-shell-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div className="loading-state">
              <Loader2 size={20} className="spinner-icon" /> Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Users size={36} />
              <p>No {tab} found for that search.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Sports</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member) => (
                    <tr key={member._id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                          <div className="avatar-badge round" style={{ width: 40, height: 40, borderRadius: "50%" }}>
                            {member.user?.profilePic ? (
                              <img src={`${API}${member.user.profilePic}`} alt={member.user?.name || "Member"} />
                            ) : (
                              <span style={{ fontWeight: 800 }}>
                                {member.user?.name?.charAt(0)?.toUpperCase() || "M"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ color: "var(--theme-text)", fontWeight: 700 }}>{member.user?.name || "-"}</div>
                            <div style={{ color: "var(--theme-muted)", fontSize: "0.78rem", textTransform: "capitalize" }}>
                              {member.user?.role || tab.slice(0, -1)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--theme-muted)" }}>{member.user?.email || "-"}</td>
                      <td>
                        <div className="detail-pills">
                          {Array.isArray(member.user?.sports) && member.user.sports.length > 0 ? (
                            member.user.sports.slice(0, 3).map((sport) => (
                              <span key={sport} className="meta-pill" style={{ textTransform: "capitalize" }}>
                                {sport.replaceAll("_", " ")}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "var(--theme-muted)", fontSize: "0.82rem" }}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button className="btn-danger" onClick={() => handleRemove(member.user?._id)}>
                          <UserMinus size={13} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
