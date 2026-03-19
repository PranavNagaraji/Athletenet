import { useEffect, useState } from "react";
import { Save, Loader2, UserRound, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CoachProfile() {
  const { user, checkAuth } = useAuth();
  const [form, setForm]     = useState({ height: "", weight: "", age: "", experience: "", specialization: "", name: "", profilePic: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState(null);

  useEffect(() => {
    fetch(`${API}/api/coach/me`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setForm({
          age: d.age || "", height: d.height || "", weight: d.weight || "",
          experience: d.experience || "", specialization: d.specialization || "",
          name: user?.name || "", profilePic: user?.profilePic || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setMsg(null);
    const fd = new FormData(); fd.append("image", file);
    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setForm(f => ({ ...f, profilePic: data.url }));
      else setMsg({ type: "error", text: data.message });
    } catch { setMsg({ type: "error", text: "Upload failed" }); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const coachPayload = { age: Number(form.age), height: Number(form.height), weight: Number(form.weight), experience: Number(form.experience), specialization: form.specialization };
    try {
      const [resObj, resUser] = await Promise.all([
        fetch(`${API}/api/coach/me`, {
          method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coachPayload),
        }),
        fetch(`${API}/api/user/profile`, {
          method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, profilePic: form.profilePic }),
        })
      ]);
      if (resObj.ok && resUser.ok) {
        setMsg({ type: "success", text: "Profile updated successfully!" });
        checkAuth(); // update Context
      } else setMsg({ type: "error", text: "Failed to update profile." });
    } catch { setMsg({ type: "error", text: "Network error." }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading profile...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1><p>Update your coaching background and user details</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15} /> {msg.text}</div>}

        <div className="card">
          <div className="card-title"><UserRound size={16} /> Coach Info</div>
          
          <div style={{ padding: "0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--c-border)", borderRadius: 8, fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1.5rem", display: "flex", alignItems: "center" }}>
            <span style={{ userSelect: "all" }}><strong style={{ color: "var(--c-text)", marginRight: "0.5rem" }}>Coach User ID:</strong> {user?._id || "Loading..."}</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", marginBottom:"2rem" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--c-surface2)", border:"1px solid var(--c-border)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
              {uploading ? <Loader2 size={24} className="spinner-icon" /> :
                form.profilePic ? <img src={`${API}${form.profilePic}`} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> :
                <UserRound size={32} color="var(--c-muted)" />}
            </div>
            <div>
              <label className="btn-ghost" style={{ cursor:"pointer", display:"inline-block" }}>
                {uploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
              </label>
              <p style={{ fontSize:"0.75rem", color:"var(--c-muted)", marginTop:"0.4rem" }}>JPG, PNG or WEBP. Max 5MB.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="form-grid" style={{ maxWidth: 600 }}>
            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input className="field-input" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.1rem" }}>
              <div className="field-group">
                <label className="field-label">Age</label>
                <input className="field-input" type="number" min="18" max="100" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              </div>
              <div className="field-group">
                <label className="field-label">Height (cm)</label>
                <input className="field-input" type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
              </div>
              <div className="field-group">
                <label className="field-label">Weight (kg)</label>
                <input className="field-input" type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="field-group">
                <label className="field-label">Experience (Years)</label>
                <input className="field-input" type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g 5" />
              </div>
              <div className="field-group">
                <label className="field-label">Specialization</label>
                <input className="field-input" type="text" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="e.g Head Soccer Coach" />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={15} className="spinner-icon" /> : <Save size={15} />} Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
