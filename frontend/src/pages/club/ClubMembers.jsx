import { useEffect, useState } from "react";
import { Users, UserMinus, Loader2, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubMembers() {
  const { user } = useAuth();
  const [tab, setTab] = useState("athletes"); // "athletes" | "coaches"
  const [athletes, setAthletes] = useState([]);
  const [coaches, setCoaches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [msg, setMsg]           = useState(null);

  const clubId = user?._id;

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/club/athlete/${clubId}`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/api/club/coaches/${clubId}`, { credentials: "include" }).then(r => r.json()),
    ]).then(([a, c]) => {
      setAthletes(Array.isArray(a) ? a : []);
      setCoaches(Array.isArray(c) ? c : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [clubId]);

  const handleRemove = async (userId) => {
    if (!confirm("Remove this member from the club?")) return;
    const res = await fetch(`${API}/api/club/remove-user`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, clubId }),
    });
    if (res.ok) {
      setAthletes(a => a.filter(m => m.user?._id !== userId));
      setCoaches(c  => c.filter(m => m.user?._id !== userId));
      setMsg({ type: "success", text: "Member removed." });
      setTimeout(() => setMsg(null), 3000);
    } else {
      const d = await res.json();
      setMsg({ type: "error", text: d.message });
    }
  };

  const list = tab === "athletes" ? athletes : coaches;
  const filtered = list.filter(m =>
    m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Members</h1>
          <p>{athletes.length} athletes · {coaches.length} coaches</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* Tabs + Search */}
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.2rem", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {["athletes","coaches"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={tab === t ? "btn-primary" : "btn-ghost"}
                style={{ textTransform:"capitalize" }}>
                {t === "athletes" ? `Athletes (${athletes.length})` : `Coaches (${coaches.length})`}
              </button>
            ))}
          </div>
          <div className="input-group" style={{ flex:1, minWidth:200, maxWidth:320, margin:0 }}>
            <span className="input-icon"><Search size={14} /></span>
            <input
              style={{ background:"transparent",border:"none",outline:"none",color:"var(--c-text)",fontSize:"0.88rem",padding:"0.6rem 0.5rem 0.6rem 0" }}
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {loading ? (
            <div className="loading-state"><Loader2 size={20} className="spinner-icon" />Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Users size={36} /><p>No {tab} found.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Sports</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m._id}>
                    <td style={{ fontWeight:600 }}>{m.user?.name || "—"}</td>
                    <td style={{ color:"var(--c-muted)" }}>{m.user?.email || "—"}</td>
                    <td style={{ color:"var(--c-muted)", fontSize:"0.82rem" }}>
                      {m.user?.sports?.join(", ") || "—"}
                    </td>
                    <td>
                      <button className="btn-danger" onClick={() => handleRemove(m.user?._id)}>
                        <UserMinus size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
