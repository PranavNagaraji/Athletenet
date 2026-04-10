import { useEffect, useState } from "react";
import { AlertCircle, Building2, Loader2, Save } from "lucide-react";
import "../club/ClubLayout.css";
import { useAuth } from "../../context/AuthContext";
import { VALIDATION_LIMITS, validateFile } from "../../utils/formValidation";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubProfile() {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({
    establishedYear: "",
    specialization: "",
    facilities: "",
    name: "",
    profilePic: "",
    clubId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/club/profile`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        setForm({
          establishedYear: data.establishedYear || "",
          specialization: data.specialization || "",
          facilities: Array.isArray(data.facilities) ? data.facilities.join(", ") : "",
          name: data.name || user?.name || "",
          profilePic: data.profilePic || user?.profilePic || "",
          clubId: data._id || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileError = validateFile(file);
    if (fileError) {
      setMsg({ type: "error", text: fileError });
      return;
    }
    setUploading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setForm((current) => ({ ...current, profilePic: data.url }));
      } else {
        setMsg({ type: "error", text: data.message });
      }
    } catch {
      setMsg({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedSpecialization = form.specialization.trim();
    const facilitiesList = form.facilities
      ? form.facilities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const establishedYear = form.establishedYear === "" ? undefined : Number(form.establishedYear);
    const currentYear = new Date().getFullYear();

    if (trimmedName.length < VALIDATION_LIMITS.nameMin) return setMsg({ type: "error", text: "Please enter a valid club name." });
    if (trimmedName.length > VALIDATION_LIMITS.clubNameMax) return setMsg({ type: "error", text: "Club name is too long." });
    if (trimmedSpecialization.length > VALIDATION_LIMITS.specializationMax) return setMsg({ type: "error", text: "Specialization is too long." });
    if (form.facilities.length > VALIDATION_LIMITS.facilitiesMax) return setMsg({ type: "error", text: "Facilities list is too long." });
    if (establishedYear !== undefined && (!Number.isInteger(establishedYear) || establishedYear < 1800 || establishedYear > currentYear)) {
      return setMsg({ type: "error", text: "Established year must be between 1800 and the current year." });
    }

    setSaving(true);
    setMsg(null);

    const payload = {
      name: trimmedName,
      profilePic: form.profilePic,
      establishedYear,
      specialization: trimmedSpecialization || null,
      facilities: facilitiesList,
    };

    try {
      const [resClub, resUser] = await Promise.all([
        fetch(`${API}/api/club/profile`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${API}/api/user/profile`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, profilePic: form.profilePic }),
        }),
      ]);

      if (resClub.ok && resUser.ok) {
        setMsg({ type: "success", text: "Profile updated successfully." });
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
    return (
      <div className="loading-state">
        <Loader2 size={20} className="spinner-icon" /> Loading profile...
      </div>
    );
  }

  const facilities = form.facilities
    ? form.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const brandFields = [
    form.name,
    form.profilePic,
    form.establishedYear,
    form.specialization,
    facilities.length ? "facilities" : "",
  ].filter(Boolean).length;
  const brandCompletion = Math.round((brandFields / 5) * 100);
  const clubAge = form.establishedYear ? Math.max(1, new Date().getFullYear() - Number(form.establishedYear)) : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Club HQ</h1>
          <p>Shape a confident club identity so your profile feels trusted, competitive, and ready for discovery.</p>
        </div>
      </div>

      <div className="page-body stack-lg">
        {msg ? (
          <div className={`alert alert-${msg.type}`}>
            <AlertCircle size={15} /> {msg.text}
          </div>
        ) : null}

        <section className="dashboard-hero">
          <div className="dashboard-hero-grid">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div className="upload-avatar-xl">
                {form.profilePic ? (
                  <img src={`${API}${form.profilePic}`} alt={form.name || "Club"} />
                ) : (
                  <Building2 size={38} color="var(--theme-muted)" />
                )}
              </div>
              <div>
                <div className="dashboard-kicker">Club Identity</div>
                <div className="dashboard-title">{form.name || "Official Club"}</div>
                <p className="dashboard-sub" style={{ marginTop: "0.55rem" }}>
                  Your name, specialization, image, and facilities create the first impression athletes and coaches see across the platform.
                </p>
                <div className="cluster-row" style={{ marginTop: "0.85rem" }}>
                  {form.specialization ? <span className="pill pill-primary">{form.specialization}</span> : null}
                  {form.establishedYear ? <span className="pill">Est. {form.establishedYear}</span> : null}
                  <span className="pill">{facilities.length} facilities</span>
                </div>
              </div>
            </div>

            <div className="dashboard-metric-grid">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <span className="dashboard-mini-label" style={{ marginBottom: 0 }}>Brand Strength</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "var(--font-heading)" }}>
                  {brandCompletion}%
                </span>
              </div>
              <div className="dashboard-progress">
                <span style={{ width: `${brandCompletion}%` }} />
              </div>
              <div className="dashboard-mini-grid">
                <div className="dashboard-mini-card">
                  <div className="dashboard-mini-label">Facilities</div>
                  <div className="dashboard-mini-value">{facilities.length}</div>
                </div>
                <div className="dashboard-mini-card">
                  <div className="dashboard-mini-label">Since</div>
                  <div className="dashboard-mini-value">{form.establishedYear || "--"}</div>
                </div>
                <div className="dashboard-mini-card">
                  <div className="dashboard-mini-label">Years</div>
                  <div className="dashboard-mini-value">{clubAge || "--"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="profile-form-grid">
          <div className="card stack-md" style={{ display: "flex", flexDirection: "column" }}>
            <h2 className="card-section-title">Brand Identity</h2>

            <div className="media-upload-card">
              <div className="upload-avatar-xl">
                {uploading ? (
                  <Loader2 size={24} className="spinner-icon" />
                ) : form.profilePic ? (
                  <img src={`${API}${form.profilePic}`} alt={form.name || "Club"} />
                ) : (
                  <Building2 size={38} color="var(--theme-muted)" />
                )}
              </div>
              <div>
                <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-flex" }}>
                  {uploading ? "Uploading..." : "Upload Club Image"}
                  <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
                </label>
                <p className="upload-note">Use a sharp crest or club photo. JPG, PNG, or WEBP up to 5MB.</p>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Club Name</label>
              <input
                className="field-input"
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Thunder FC"
                required
                minLength={VALIDATION_LIMITS.nameMin}
                maxLength={VALIDATION_LIMITS.clubNameMax}
              />
            </div>

            <div style={{ padding: "1rem 1.1rem", borderRadius: 18, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)" }}>
              <div className="section-kicker" style={{ marginBottom: "0.45rem" }}>Visibility Tip</div>
              <p style={{ margin: 0, color: "var(--theme-muted)", lineHeight: 1.7 }}>
                This name and image are what members see in search, social feed, and requests. Clear branding raises trust immediately.
              </p>
            </div>
          </div>

          <div className="card stack-md" style={{ display: "flex", flexDirection: "column" }}>
            <h2 className="card-section-title">Club Details</h2>

            <div className="form-grid form-grid-2">
              <div className="field-group">
                <label className="field-label">Established Year</label>
                <input
                  className="field-input"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={form.establishedYear}
                  onChange={(event) => setForm((current) => ({ ...current, establishedYear: event.target.value }))}
                  placeholder="e.g. 2010"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Specialization</label>
                <input
                  className="field-input"
                  type="text"
                  value={form.specialization}
                  onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value }))}
                  placeholder="e.g. Football"
                  maxLength={VALIDATION_LIMITS.specializationMax}
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Facilities</label>
              <input
                className="field-input"
                type="text"
                value={form.facilities}
                onChange={(event) => setForm((current) => ({ ...current, facilities: event.target.value }))}
                placeholder="e.g. Gym, Pool, Track, Indoor Court"
                maxLength={VALIDATION_LIMITS.facilitiesMax}
              />
            </div>

            {facilities.length > 0 ? (
              <div className="detail-pills">
                {facilities.map((facility) => (
                  <span key={facility} className="meta-pill">{facility}</span>
                ))}
              </div>
            ) : null}

            <div style={{ padding: "1rem 1.1rem", borderRadius: 18, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)" }}>
              <div className="section-kicker" style={{ marginBottom: "0.45rem" }}>System Reference</div>
              <div style={{ display: "grid", gap: "0.45rem", color: "var(--theme-muted)" }}>
                <div style={{ userSelect: "all" }}>
                  <strong style={{ color: "var(--theme-text)", marginRight: "0.4rem" }}>Admin User ID:</strong>
                  {user?._id || "Loading"}
                </div>
                <div style={{ userSelect: "all" }}>
                  <strong style={{ color: "var(--theme-text)", marginRight: "0.4rem" }}>Club Object ID:</strong>
                  {form.clubId || "Loading"}
                </div>
              </div>
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={15} className="spinner-icon" /> : <Save size={15} />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
