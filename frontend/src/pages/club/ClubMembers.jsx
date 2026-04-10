import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search, UserMinus, Users, X, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonRow() {
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div className="skeleton skeleton-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <div className="skeleton skeleton-text" style={{ width: 120 }} />
            <div className="skeleton skeleton-text-sm" style={{ width: 70 }} />
          </div>
        </div>
      </td>
      <td><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton" style={{ width: 72, height: 30, borderRadius: 8 }} /></td>
    </tr>
  );
}

export default function ClubMembers() {
  const { user } = useAuth();
  const [tab, setTab] = useState("athletes");
  const [athletes, setAthletes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const clubId = user?._id;

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/club/athlete/${clubId}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API}/api/club/coaches/${clubId}`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([athleteData, coachData]) => {
        setAthletes(Array.isArray(athleteData) ? athleteData : []);
        setCoaches(Array.isArray(coachData) ? coachData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      const res = await fetch(`${API}/api/club/remove-user`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, clubId }),
      });
      if (res.ok) {
        setAthletes((curr) => curr.filter((m) => m.user?._id !== userId));
        setCoaches((curr) => curr.filter((m) => m.user?._id !== userId));
        showMsg("success", "Member removed from the club.");
      } else {
        const data = await res.json();
        showMsg("error", data.message || "Failed to remove member.");
      }
    } catch {
      showMsg("error", "Network error. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const list = tab === "athletes" ? athletes : coaches;
  const filtered = list.filter((member) => {
    const haystack = [member.user?.name, member.user?.email].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Users size={10} /> Roster</div>
          <h1>Members</h1>
          <p>
            {athletes.length} athlete{athletes.length !== 1 ? "s" : ""} and {coaches.length} coach{coaches.length !== 1 ? "es" : ""} currently active in your club.
          </p>
        </div>
      </div>

      <div className="page-body stack-md">

        {/* Alert */}
        {msg && (
          <div className={`alert alert-${msg.type}`} role="alert">
            <AlertCircle size={15} /> {msg.text}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {/* Tab bar */}
          <div className="tab-bar">
            {[
              { value: "athletes", label: "Athletes", count: athletes.length },
              { value: "coaches", label: "Coaches", count: coaches.length },
            ].map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`tab-btn ${tab === value ? "active" : ""}`}
              >
                {label}
                <span className="tab-count">{count}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="search-shell" style={{ flex: "1 1 280px", maxWidth: 400 }}>
            <div className="search-shell-icon"><Search size={16} /></div>
            <input
              className="search-shell-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search members"
            />
            {search && (
              <button type="button" className="search-shell-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
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
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {search ? <Search size={24} /> : <Users size={24} />}
              </div>
              <h3>{search ? "No results found" : `No ${tab} yet`}</h3>
              <p>
                {search
                  ? `No ${tab} match "${search}". Try a different name or email.`
                  : `Your club doesn't have any ${tab} yet. Approve join requests to add them.`}
              </p>
              {search && (
                <button className="btn-ghost btn-sm" onClick={() => setSearch("")} style={{ marginTop: "0.5rem" }}>
                  Clear search
                </button>
              )}
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
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="avatar-badge round" style={{ width: 36, height: 36, fontSize: "0.9rem" }}>
                            {member.user?.profilePic ? (
                              <img src={`${API}${member.user.profilePic}`} alt={member.user?.name} />
                            ) : (
                              <span>{member.user?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--theme-text)", fontSize: "0.9rem" }}>
                              {member.user?.name || "—"}
                            </div>
                            <div style={{ color: "var(--theme-muted)", fontSize: "0.74rem", textTransform: "capitalize", marginTop: "1px" }}>
                              {member.user?.role || tab.slice(0, -1)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--theme-muted)", fontSize: "0.875rem" }}>
                        {member.user?.email || "—"}
                      </td>
                      <td>
                        <div className="detail-pills">
                          {Array.isArray(member.user?.sports) && member.user.sports.length > 0
                            ? member.user.sports.slice(0, 3).map((sport) => (
                                <span key={sport} className="meta-pill" style={{ textTransform: "capitalize" }}>
                                  {sport.replaceAll("_", " ")}
                                </span>
                              ))
                            : <span style={{ color: "var(--theme-muted)", fontSize: "0.8rem" }}>—</span>}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleRemove(member.user?._id)}
                          disabled={removingId === member.user?._id}
                          aria-label={`Remove ${member.user?.name || "member"}`}
                        >
                          {removingId === member.user?._id
                            ? <Loader2 size={13} className="spinner-icon" />
                            : <UserMinus size={13} />}
                          Remove
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
