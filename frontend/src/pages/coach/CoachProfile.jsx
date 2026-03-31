import { useEffect, useState } from "react";
import { Save, Loader2, UserRound, AlertCircle, Building2, Send, Users, Compass } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CoachProfile() {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({ height: "", weight: "", age: "", experience: "", specialization: "", name: "", profilePic: "" });
  const [coachData, setCoachData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/coach/me`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API}/api/coach/join-request`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([coachRes, requestsRes]) => {
        setCoachData(coachRes);
        setRequests(Array.isArray(requestsRes) ? requestsRes : []);
        setForm({
          age: coachRes.age || "",
          height: coachRes.height || "",
          weight: coachRes.weight || "",
          experience: coachRes.experience || "",
          specialization: coachRes.specialization || "",
          name: coachRes.user?.name || user?.name || "",
          profilePic: coachRes.user?.profilePic || user?.profilePic || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setForm((f) => ({ ...f, profilePic: data.url }));
      else setMsg({ type: "error", text: data.message });
    } catch {
      setMsg({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const coachPayload = {
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      experience: Number(form.experience),
      specialization: form.specialization,
    };
    try {
      const [resObj, resUser] = await Promise.all([
        fetch(`${API}/api/coach/me`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(coachPayload),
        }),
        fetch(`${API}/api/user/profile`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, profilePic: form.profilePic }),
        }),
      ]);
      if (resObj.ok && resUser.ok) {
        setMsg({ type: "success", text: "Profile updated successfully!" });
        checkAuth();
      } else {
        setMsg({ type: "error", text: "Failed to update profile." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state"><Loader2 size={24} className="spinner-icon" /> Loading profile...</div>;
  }

  const joinedClubsCount = coachData?.clubs?.length || 0;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const profileCompletion = [form.name, form.age, form.height, form.weight, form.experience, form.specialization, form.profilePic].filter(Boolean).length;
  const profileCompletionPercent = Math.round((profileCompletion / 7) * 100);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="page-header-left">
          <h1>Coach HQ</h1>
          <p>Present your coaching identity with clarity, authority, and trust</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: "1.5rem" }}><AlertCircle size={15} /> {msg.text}</div>}

        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            padding: "1.6rem",
            background: "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 12%, var(--theme-surface)) 0%, var(--theme-surface) 58%)",
            border: "1px solid color-mix(in srgb, var(--theme-primary) 24%, var(--theme-border))",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 1fr)", gap: "1.2rem", alignItems: "stretch" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ width: 88, height: 88, borderRadius: 24, overflow: "hidden", border: "3px solid rgba(255,255,255,0.6)", boxShadow: "0 16px 34px rgba(249,115,22,0.18)", background: "var(--theme-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {form.profilePic ? (
                  <img src={`${API}${form.profilePic}`} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <UserRound size={36} color="var(--theme-muted)" />
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--theme-primary)", marginBottom: "0.4rem" }}>
                  Coach Identity
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", lineHeight: 1, letterSpacing: "0.04em", color: "var(--theme-text)" }}>
                  {form.name || "Coach Profile"}
                </div>
                <p style={{ margin: "0.55rem 0 0 0", color: "var(--theme-muted)", maxWidth: 520, lineHeight: 1.6 }}>
                  Keep your profile sharp so clubs immediately understand your experience, discipline, and coaching specialization.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.8rem", background: "rgba(255,255,255,0.38)", border: "1px solid var(--theme-border)", borderRadius: 18, padding: "1rem 1.1rem", backdropFilter: "blur(6px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--theme-muted)" }}>Profile Strength</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--theme-text)" }}>{profileCompletionPercent}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "var(--theme-surface-3)", overflow: "hidden" }}>
                <div style={{ width: `${profileCompletionPercent}%`, height: "100%", background: "linear-gradient(90deg, var(--theme-primary), var(--theme-primary-dark))", borderRadius: 999 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.8rem" }}>
                <div style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 14, padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--theme-muted)", marginBottom: "0.25rem" }}>Years</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "'Bebas Neue', sans-serif" }}>{form.experience || 0}</div>
                </div>
                <div style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 14, padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--theme-muted)", marginBottom: "0.25rem" }}>Clubs</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "'Bebas Neue', sans-serif" }}>{joinedClubsCount}</div>
                </div>
                <div style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 14, padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--theme-muted)", marginBottom: "0.25rem" }}>Requests</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "'Bebas Neue', sans-serif" }}>{pendingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))", color: "var(--theme-primary)" }}>
              <Building2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{joinedClubsCount}</span>
              <span className="stat-label">Joined Clubs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))", color: "#eab308" }}>
              <Send size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{pendingCount}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))", color: "#3b82f6" }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">-</span>
              <span className="stat-label">My Teams</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.6rem", background: "linear-gradient(180deg, var(--theme-surface) 0%, color-mix(in srgb, var(--theme-surface) 88%, var(--theme-surface-2) 12%) 100%)" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, borderBottom: "1px solid var(--theme-border)", paddingBottom: "0.8rem", margin: 0, color: "var(--theme-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Identity & Presence
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", background: "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface-2)) 0%, var(--theme-surface-2) 100%)", borderRadius: 20, border: "1px solid color-mix(in srgb, var(--theme-primary) 20%, var(--theme-border))" }}>
              <div style={{ width: 108, height: 108, borderRadius: "28px", background: "var(--theme-surface)", border: "3px solid var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 14px 28px rgba(249,115,22,0.18)" }}>
                {uploading ? (
                  <Loader2 size={24} className="spinner-icon" />
                ) : form.profilePic ? (
                  <img src={`${API}${form.profilePic}`} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <UserRound size={42} color="var(--theme-muted)" />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", minWidth: 0 }}>
                <div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--theme-primary)", marginBottom: "0.35rem" }}>
                    Profile Photo
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--theme-text)", lineHeight: 1.1 }}>
                    {form.name || "Coach"}
                  </div>
                </div>
                <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-flex", width: "fit-content" }}>
                  {uploading ? "Uploading..." : "Upload Photo"}
                  <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
                </label>
                <p style={{ fontSize: "0.75rem", color: "var(--theme-muted)", margin: 0 }}>JPG, PNG or WEBP. Max 5MB.</p>
              </div>
            </div>

            <div style={{ padding: "1rem", background: "var(--theme-surface-2)", borderRadius: 18, border: "1px solid var(--theme-border)" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "0.7rem" }}>Coach Snapshot</div>
              <div style={{ fontSize: "0.96rem", lineHeight: 1.7, color: "var(--theme-text)" }}>
                Position yourself clearly for clubs by maintaining a complete profile with your full name, physical details, coaching experience, and specialization.
              </div>
            </div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.6rem", background: "linear-gradient(180deg, var(--theme-surface) 0%, color-mix(in srgb, var(--theme-surface) 88%, var(--theme-surface-2) 12%) 100%)" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, borderBottom: "1px solid var(--theme-border)", paddingBottom: "0.8rem", margin: 0, color: "var(--theme-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Edit Coaching Profile
            </h2>

            <form onSubmit={handleSave} className="form-grid">
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input className="field-input" type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                <div className="field-group">
                  <label className="field-label">Age</label>
                  <input className="field-input" type="number" min="18" max="100" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Height (cm)</label>
                  <input className="field-input" type="number" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Weight (kg)</label>
                  <input className="field-input" type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label">Experience (Years)</label>
                  <input className="field-input" type="number" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="e.g 5" />
                </div>
                <div className="field-group">
                  <label className="field-label">Specialization</label>
                  <input className="field-input" type="text" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} placeholder="e.g Head Soccer Coach" />
                </div>
              </div>

              <div style={{ padding: "0.95rem 1rem", background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)", borderRadius: 14, fontSize: "0.86rem", color: "var(--theme-muted)" }}>
                <strong style={{ color: "var(--theme-text)", marginRight: "0.5rem" }}>Coach User ID:</strong>
                <span style={{ userSelect: "all" }}>{user?._id || "Loading..."}</span>
              </div>

              <button type="submit" className="btn-primary" disabled={saving} style={{ width: "100%", justifyContent: "center", padding: "1rem" }}>
                {saving ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />} Save Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
