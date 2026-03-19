import { useEffect, useState } from "react";
import { Save, Loader2, Building2, AlertCircle } from "lucide-react";
import "../club/ClubLayout.css";

import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubProfile() {
  const { user, checkAuth }   = useAuth();
  const [form, setForm]       = useState({ establishedYear: "", specialization: "", facilities: "", name: "", profilePic: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState(null);

  useEffect(() => {
    fetch(`${API}/api/club/profile`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setForm({
          establishedYear: d.establishedYear || "",
          specialization:  d.specialization  || "",
          facilities:      Array.isArray(d.facilities) ? d.facilities.join(", ") : "",
          name:            d.name || user?.name || "",
          profilePic:      d.profilePic || user?.profilePic || "",
          clubId:          d._id || "",
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
      if (data.success) {
        setForm(f => ({ ...f, profilePic: data.url }));
      } else setMsg({ type: "error", text: data.message });
    } catch { setMsg({ type: "error", text: "Upload failed" }); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      name:            form.name,
      profilePic:      form.profilePic,
      establishedYear: Number(form.establishedYear) || undefined,
      specialization:  form.specialization || null,
      facilities:      form.facilities ? form.facilities.split(",").map(s => s.trim()).filter(Boolean) : [],
    };
    try {
      const [resClub, resUser] = await Promise.all([
        fetch(`${API}/api/club/profile`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${API}/api/user/profile`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, profilePic: form.profilePic }),
        })
      ]);

      if (resClub.ok && resUser.ok) {
        setMsg({ type: "success", text: "Profile updated successfully!" });
        checkAuth(); // refresh user context
      } else {
        setMsg({ type: "error", text: "Failed to update profile." });
      }
    } catch { setMsg({ type: "error", text: "Network error." }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-state"><Loader2 size={20} className="spinner-icon" /> Loading profile…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Club Profile</h1>
          <p>Update your club's official identity and public information</p>
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--c-primary)", background: "rgba(249,115,22,0.1)", padding: "0.4rem 0.8rem", borderRadius: 6, display: "inline-block" }}>
             Tip: This name and photo will represent your club in the Social Feed and Search.
          </div>
        </div>
      </div>

      <div className="page-body">
        {msg && (
          <div className={`alert alert-${msg.type}`}>
            <AlertCircle size={15} /> {msg.text}
          </div>
        )}

        <div className="card">
          <div className="card-title"><Building2 size={16} /> Club Details</div>
          
          <div style={{ padding: "0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--c-border)", borderRadius: 8, fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ userSelect: "all" }}><strong style={{ color: "var(--c-text)", marginRight: "0.5rem" }}>Admin User ID:</strong> {user?._id || "Loading..."}</div>
            <div style={{ userSelect: "all" }}><strong style={{ color: "var(--c-text)", marginRight: "0.5rem" }}>Club Object ID:</strong> {form.clubId || "Loading..."}</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", marginBottom:"2rem" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--c-surface2)", border:"1px solid var(--c-border)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
              {uploading ? <Loader2 size={24} className="spinner-icon" /> :
                form.profilePic ? <img src={`${API}${form.profilePic}`} alt="Club" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> :
                <Building2 size={32} color="var(--c-muted)" />}
            </div>
            <div>
              <label className="btn-ghost" style={{ cursor:"pointer", display:"inline-block" }}>
                {uploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
              </label>
              <p style={{ fontSize:"0.75rem", color:"var(--c-muted)", marginTop:"0.4rem" }}>JPG, PNG or WEBP. Max 5MB.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="form-grid" style={{ maxWidth: 560 }}>
            <div className="field-group">
              <label className="field-label">Club Name</label>
              <input
                className="field-input" type="text"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Thunder FC" required
              />
            </div>

            <div className="form-grid form-grid-2">
              <div className="field-group">
                <label className="field-label">Established Year</label>
                <input
                  className="field-input"
                  type="number" min="1800" max={new Date().getFullYear()}
                  value={form.establishedYear}
                  onChange={e => setForm(f => ({ ...f, establishedYear: e.target.value }))}
                  placeholder="e.g. 2010"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Specialization (Sport)</label>
                <input
                  className="field-input"
                  type="text"
                  value={form.specialization}
                  onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                  placeholder="e.g. Football"
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Facilities (comma-separated)</label>
              <input
                className="field-input"
                type="text"
                value={form.facilities}
                onChange={e => setForm(f => ({ ...f, facilities: e.target.value }))}
                placeholder="e.g. Gym, Pool, Track, Indoor Court"
              />
            </div>

            <div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={15} className="spinner-icon" /> : <Save size={15} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
