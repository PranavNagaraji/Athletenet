import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, Loader2, UserRound, AlertCircle, Building2, Send, Users, Compass, X, Plus, Edit3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { VALIDATION_LIMITS, getNumberInRange, validateFile } from "../../utils/formValidation";
import "../club/ClubLayout.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = import.meta.env.VITE_BACKEND_URL;
const SPORTS = ["football","cricket","basketball","volleyball","tennis","badminton","table_tennis","swimming","athletics"];

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return position.lat ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function AthleteProfile() {
  const { user, checkAuth } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  // Note: bio/location is part of User, age/height/weight/sports are Athlete
  const [form, setForm]     = useState({ height: "", weight: "", age: "", bio: "", sports: [], name: "", profilePic: "", location: { name: "", latitude: 0, longitude: 0 } });
  const [requests, setRequests] = useState([]);
  const [athleteData, setAthleteData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState(null);

  // For sports dropdown
  const [selectedSportToAdd, setSelectedSportToAdd] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/athlete/me`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/api/athlete/join-requests`, { credentials: "include" }).then(r => r.json())
    ])
    .then(([d, reqData]) => {
      setAthleteData(d);
      setRequests(Array.isArray(reqData) ? reqData : []);
      
      setForm({
        age: d.age || "", height: d.height || "", weight: d.weight || "",
        sports: d.user?.sports || [],
        bio: d.user?.bio || "", name: d.user?.name || user?.name || "", profilePic: d.user?.profilePic || user?.profilePic || "",
        location: d.user?.location || { name: "", latitude: 0, longitude: 0 }
      });
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileError = validateFile(file);
    if (fileError) {
      setMsg({ type: "error", text: fileError });
      return;
    }
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
    if (e) e.preventDefault();
    const age = getNumberInRange(form.age, 5, 100);
    const height = getNumberInRange(form.height, 50, 260);
    const weight = getNumberInRange(form.weight, 20, 300);
    const trimmedName = form.name.trim();
    const trimmedBio = form.bio.trim();
    const trimmedLocationName = form.location?.name?.trim() || "";

    if (trimmedName.length < VALIDATION_LIMITS.nameMin) return setMsg({ type: "error", text: "Please enter your full name." });
    if (trimmedBio.length > VALIDATION_LIMITS.bioMax) return setMsg({ type: "error", text: `Bio must be ${VALIDATION_LIMITS.bioMax} characters or fewer.` });
    if (form.age !== "" && age === null) return setMsg({ type: "error", text: "Age must be between 5 and 100." });
    if (form.height !== "" && height === null) return setMsg({ type: "error", text: "Height must be between 50 and 260 cm." });
    if (form.weight !== "" && weight === null) return setMsg({ type: "error", text: "Weight must be between 20 and 300 kg." });
    if (trimmedLocationName.length > VALIDATION_LIMITS.locationNameMax) return setMsg({ type: "error", text: "Location name is too long." });
    if (form.sports.length > 8) return setMsg({ type: "error", text: "Please keep your sports list to 8 or fewer." });

    setSaving(true); setMsg(null);
    
    const athPayload = { age, height, weight };
    // user updates go to specific fields
    const userPayload = { name: trimmedName, profilePic: form.profilePic, bio: trimmedBio, sports: form.sports, location: { ...form.location, name: trimmedLocationName } };

    try {
      const [resAth, resUser] = await Promise.all([
        fetch(`${API}/api/athlete/me`, {
          method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(athPayload),
        }),
        fetch(`${API}/api/user/profile`, {
          method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userPayload),
        })
      ]);
      if (resAth.ok && resUser.ok) {
        setMsg({ type: "success", text: "Profile updated successfully!" });
        checkAuth(); // update Context
        setIsEditing(false); // return to view mode on success
      } else setMsg({ type: "error", text: "Failed to update profile." });
    } catch { setMsg({ type: "error", text: "Network error." }); }
    finally { setSaving(false); }
  };

  const removeSport = (s) => setForm(f => ({ ...f, sports: f.sports.filter(x => x !== s) }));
  
  const addSport = () => {
    if (selectedSportToAdd && !form.sports.includes(selectedSportToAdd)) {
        setForm(f => ({ ...f, sports: [...f.sports, selectedSportToAdd] }));
        setSelectedSportToAdd("");
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) return setMsg({ type: "error", text: "Geolocation is not supported by your browser." });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, location: { ...f.location, latitude: pos.coords.latitude, longitude: pos.coords.longitude } }));
        setMsg({ type: "success", text: "Location pulled successfully!" });
      },
      () => setMsg({ type: "error", text: "Unable to retrieve location. Check permissions." })
    );
  };

  const handleCancelEdit = () => {
      // Revert states
      setIsEditing(false);
      setShowMapPicker(false);
      setForm({
        age: athleteData?.age || "", height: athleteData?.height || "", weight: athleteData?.weight || "",
        sports: athleteData?.user?.sports || [],
        bio: athleteData?.user?.bio || "", name: athleteData?.user?.name || user?.name || "", profilePic: athleteData?.user?.profilePic || user?.profilePic || "",
        location: athleteData?.user?.location || { name: "", latitude: 0, longitude: 0 }
      });
      setMsg(null);
  }

  if (loading) return <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading profile...</div>;

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const joinedClubsCount = athleteData?.clubs?.length || 0;
  const profileCompletion = [form.name, form.bio, form.age, form.height, form.weight, form.location?.name, form.sports.length > 0 ? "sports" : ""].filter(Boolean).length;
  const profileCompletionPercent = Math.round((profileCompletion / 7) * 100);

  // Unselected sports for the dropdown
  const availableSports = SPORTS.filter(s => !form.sports.includes(s));

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="page-header-left">
          <h1>Athlete HQ</h1>
          <p>Shape your athletic identity and track your career progression</p>
        </div>
        {!isEditing && (
            <button className="btn-ghost" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} /> Edit Profile
            </button>
        )}
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
                  Athlete Identity
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", lineHeight: 1, letterSpacing: "0.04em", color: "var(--theme-text)" }}>
                  {form.name || "Athlete Profile"}
                </div>
                <p style={{ margin: "0.55rem 0 0 0", color: "var(--theme-muted)", maxWidth: 520, lineHeight: 1.6 }}>
                  Keep your profile sharp so clubs and teams get a strong first impression of your game, discipline, and athletic identity.
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
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--theme-muted)", marginBottom: "0.25rem" }}>Sports</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "'Bebas Neue', sans-serif" }}>{form.sports.length}</div>
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

        {/* --- DASHBOARD STATS SECTION --- */}
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

          <div className="stat-card" style={{ cursor: "pointer", position: "relative" }}>
            <Link to="/athlete/requests" style={{ position: "absolute", inset: 0, zIndex: 10 }} />
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
              <span className="stat-value">0</span>
              <span className="stat-label">My Teams</span>
            </div>
          </div>
        </div>

        {/* --- PROFILE DATA SECTION --- */}
        {/* We dynamically wrap in <form> if editing, or <div> if just viewing */}
        {isEditing ? (
            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                
                {/* Identity Column (EDIT MODE) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid var(--theme-border)", paddingBottom: "0.8rem", margin: 0 }}>Identity & Bio</h2>
                    <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
                        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--theme-surface-2)", border: "2px solid var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                            {uploading ? <Loader2 size={24} className="spinner-icon" /> :
                            form.profilePic ? <img src={`${API}${form.profilePic}`} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> :
                            <UserRound size={40} color="var(--theme-muted)" />}
                            
                            <label style={{ position:"absolute", inset: 0, background: "rgba(0,0,0,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", cursor: "pointer" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                Upload
                                <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
                            </label>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="field-label" style={{ marginBottom: "0.4rem", display: "block" }}>Full Name</label>
                            <input className="field-input" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required minLength={VALIDATION_LIMITS.nameMin} maxLength={VALIDATION_LIMITS.nameMax} style={{ padding: "0.6rem 1rem" }} />
                        </div>
                    </div>

                    <div className="field-group" style={{ flex: 1 }}>
                        <label className="field-label">Biography / About</label>
                        <textarea 
                            className="field-input" rows="3" style={{ flex: 1 }}
                            value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} 
                            maxLength={VALIDATION_LIMITS.bioMax}
                            placeholder="Tell teams and clubs about your sports journey, achievements, and play style..." 
                        />
                    </div>

                    <div style={{ padding: "1.2rem", background: "var(--theme-surface-2)", borderRadius: 12, border: "1px solid var(--theme-border)", marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--theme-text)", fontWeight: 700, textTransform: "uppercase" }}>Base Location</div>
                            <button type="button" onClick={handleFetchLocation} className="btn-ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "var(--theme-surface)" }}>
                                <Compass size={14} /> Auto-Locate
                            </button>
                        </div>
                        <div className="field-group" style={{ marginBottom: "0.8rem" }}>
                            <input className="field-input" type="text" placeholder="City or Region Name (e.g. London)" value={form.location?.name || ""} onChange={e => setForm(f => ({ ...f, location: { ...f.location, name: e.target.value } }))} maxLength={VALIDATION_LIMITS.locationNameMax} style={{ padding: "0.5rem 0.8rem", fontSize: "0.85rem" }} />
                        </div>
                        
                        {!showMapPicker ? (
                            <button type="button" className="btn-ghost" style={{ width: "100%", justifyContent: "center", border: "1px dashed var(--theme-border-strong)", padding: "0.6rem", fontSize: "0.85rem" }} onClick={() => setShowMapPicker(true)}>
                                Choose exact point on Map
                            </button>
                        ) : (
                            <div style={{ height: 250, borderRadius: 8, overflow: "hidden", border: "1px solid var(--theme-border)", position: "relative" }}>
                                <MapContainer center={[(form.location?.latitude || 20.5937), (form.location?.longitude || 78.9629)]} zoom={form.location?.latitude ? 13 : 4} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <LocationPicker 
                                      position={{ lat: form.location?.latitude, lng: form.location?.longitude }} 
                                      setPosition={(pos) => setForm(f => ({ ...f, location: { ...f.location, latitude: pos.lat, longitude: pos.lng } }))} 
                                    />
                                </MapContainer>
                                <div className="badge badge-accepted" style={{ position: "absolute", bottom: 10, left: 10, background: "var(--theme-surface)", border: "1px solid var(--theme-border-strong)", color: "var(--theme-text)", zIndex: 400, pointerEvents: "none", padding: "0.4rem 0.8rem" }}>
                                    <Compass size={14}/> Click map to drop pin
                                </div>
                                <button type="button" className="btn-ghost" style={{ position: "absolute", top: 10, right: 10, padding: "0.2rem", zIndex: 400, background: "var(--theme-surface)" }} onClick={() => setShowMapPicker(false)}><X size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attributes Column (EDIT MODE) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid var(--theme-border)", paddingBottom: "0.8rem", margin: 0 }}>Physical Traits & Sports</h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div className="field-group">
                            <label className="field-label">Age</label>
                            <input className="field-input" type="number" min="5" max="100" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={{ padding: "0.6rem", textAlign: "center" }} />
                        </div>
                        <div className="field-group">
                            <label className="field-label">Height (cm)</label>
                            <input className="field-input" type="number" min="50" max="260" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} style={{ padding: "0.6rem", textAlign: "center" }} />
                        </div>
                        <div className="field-group">
                            <label className="field-label">Weight (kg)</label>
                            <input className="field-input" type="number" min="20" max="300" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={{ padding: "0.6rem", textAlign: "center" }} />
                        </div>
                    </div>

                    <div className="field-group" style={{ flex: 1 }}>
                        <label className="field-label">My Disciplines</label>
                        
                        {/* Active Sports Tags Editable */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                            {form.sports.length === 0 ? (
                                <span style={{ fontSize: "0.85rem", color: "var(--theme-muted)", fontStyle: "italic" }}>No sports added yet.</span>
                            ) : form.sports.map(s => (
                                <div key={s} style={{ 
                                    display: "inline-flex", alignItems: "center", gap: "0.4rem", 
                                    background: "var(--theme-primary)", color: "#fff", 
                                    padding: "0.3rem 0.6rem 0.3rem 0.8rem", borderRadius: 100, 
                                    fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize",
                                    boxShadow: "0 2px 8px rgba(249,115,22,0.2)"
                                }}>
                                    <span>{s.replace("_"," ")}</span>
                                    <button type="button" onClick={() => removeSport(s)} style={{ background: "rgba(0,0,0,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Sport Dropdown */}
                        {availableSports.length > 0 && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <select 
                                    className="field-select" 
                                    value={selectedSportToAdd} 
                                    onChange={e => setSelectedSportToAdd(e.target.value)}
                                    style={{ flex: 1, padding: "0.6rem 1rem", textTransform: "capitalize" }}
                                >
                                    <option value="" disabled>Select a sport to add...</option>
                                    {availableSports.map(s => (
                                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={addSport} disabled={!selectedSportToAdd} className="btn-primary" style={{ padding: "0 1rem" }}>
                                    <Plus size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--theme-border)", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                        <button type="button" onClick={handleCancelEdit} className="btn-ghost" disabled={saving}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: "center", fontSize: "1rem", padding: "1rem" }}>
                            {saving ? <Loader2 size={18} className="spinner-icon" /> : <Save size={18} />} Save All Changes
                        </button>
                    </div>
                </div>
            </form>

        ) : (

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                
                {/* Identity Column (VIEW MODE) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.6rem", background: "linear-gradient(180deg, var(--theme-surface) 0%, color-mix(in srgb, var(--theme-surface) 88%, var(--theme-surface-2) 12%) 100%)" }}>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 800, borderBottom: "1px solid var(--theme-border)", paddingBottom: "0.8rem", margin: 0, color: "var(--theme-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Identity & Bio</h2>
                    
                    <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", padding: "1rem", background: "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface-2)) 0%, var(--theme-surface-2) 100%)", borderRadius: 20, border: "1px solid color-mix(in srgb, var(--theme-primary) 20%, var(--theme-border))" }}>
                        <div style={{ width: 108, height: 108, borderRadius: "28px", background: "var(--theme-surface)", border: "3px solid var(--theme-primary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 14px 28px rgba(249,115,22,0.18)" }}>
                            {form.profilePic ? <img src={`${API}${form.profilePic}`} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> :
                            <UserRound size={40} color="var(--theme-muted)" />}
                        </div>
                        <div>
                            <div style={{ fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--theme-primary)", marginBottom: "0.35rem" }}>Athlete Card</div>
                            <h3 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0 0 0.35rem 0", color: "var(--theme-text)", lineHeight: 1 }}>{form.name}</h3>
                            <span className="badge badge-accepted" style={{ letterSpacing: "0.05em" }}>Verified Athlete</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, background: "var(--theme-surface-2)", padding: "1.3rem", borderRadius: 18, border: "1px solid var(--theme-border)", display: "flex", flexDirection: "column", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                        <div style={{ fontSize: "0.78rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "0.7rem" }}>Biography</div>
                        {form.bio ? (
                            <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.75, color: "var(--theme-text)", whiteSpace: "pre-wrap" }}>{form.bio}</p>
                        ) : (
                            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--theme-muted)", fontStyle: "italic" }}>No biography provided yet.</p>
                        )}
                        
                        <div style={{ borderTop: "1px solid var(--theme-border)", marginTop: "auto", paddingTop: "1rem" }}>
                           <div style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.95rem 1rem", background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)" }}>
                               <Compass size={24} color="var(--theme-primary)" />
                               <div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em" }}>Base Location</div>
                                  {form.location?.latitude ? (
                                      <div style={{ fontSize: "0.95rem", color: "var(--theme-text)", fontWeight: 700 }}>{form.location.name || "Custom Coordinates"}</div>
                                  ) : (
                                      <div style={{ fontSize: "0.85rem", color: "var(--theme-muted)", fontStyle: "italic" }}>Location not set.</div>
                                  )}
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Attributes Column (VIEW MODE) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.6rem", background: "linear-gradient(180deg, var(--theme-surface) 0%, color-mix(in srgb, var(--theme-surface) 88%, var(--theme-surface-2) 12%) 100%)" }}>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 800, borderBottom: "1px solid var(--theme-border)", paddingBottom: "0.8rem", margin: 0, color: "var(--theme-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Physical Traits & Sports</h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface-2)) 0%, var(--theme-surface-2) 100%)", padding: "1rem", borderRadius: 16, border: "1px solid color-mix(in srgb, var(--theme-primary) 18%, var(--theme-border))", textAlign: "center" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Age</div>
                            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--theme-primary)", fontFamily: "'Bebas Neue', sans-serif" }}>{form.age || "--"}</div>
                        </div>
                        <div style={{ background: "linear-gradient(180deg, color-mix(in srgb, #3b82f6 10%, var(--theme-surface-2)) 0%, var(--theme-surface-2) 100%)", padding: "1rem", borderRadius: 16, border: "1px solid color-mix(in srgb, #3b82f6 18%, var(--theme-border))", textAlign: "center" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Height</div>
                            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "'Bebas Neue', sans-serif" }}>{form.height ? `${form.height}cm` : "--"}</div>
                        </div>
                        <div style={{ background: "linear-gradient(180deg, color-mix(in srgb, #10b981 10%, var(--theme-surface-2)) 0%, var(--theme-surface-2) 100%)", padding: "1rem", borderRadius: 16, border: "1px solid color-mix(in srgb, #10b981 18%, var(--theme-border))", textAlign: "center" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Weight</div>
                            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--theme-text)", fontFamily: "'Bebas Neue', sans-serif" }}>{form.weight ? `${form.weight}kg` : "--"}</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, background: "var(--theme-surface-2)", padding: "1.25rem", borderRadius: 18, border: "1px solid var(--theme-border)" }}>
                        <div style={{ fontSize: "0.8rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "0.9rem" }}>My Disciplines</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {form.sports.length === 0 ? (
                                <span style={{ fontSize: "0.85rem", color: "var(--theme-muted)", fontStyle: "italic" }}>No sports added yet.</span>
                            ) : form.sports.map(s => (
                                <div key={s} style={{ 
                                    display: "inline-flex", alignItems: "center", 
                                    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))", color: "#fff",
                                    padding: "0.5rem 0.95rem", borderRadius: 999,
                                    fontSize: "0.86rem", fontWeight: 700, textTransform: "capitalize",
                                    boxShadow: "0 8px 18px rgba(249,115,22,0.18)"
                                }}>
                                    {s.replace("_"," ")}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        )}

        {/* --- RECENT JOIN REQUESTS SECTION --- */}
        <div className="card">
          <div className="card-title" style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <Send size={18} /> Recent Join Requests
          </div>
          {requests.length === 0 ? (
            <div className="empty-state" style={{ padding: "3rem 1rem", background: "transparent", border: "1px dashed var(--theme-border-strong)" }}>
              <Send size={32} opacity={0.5} />
              <p>You haven't sent any club join requests yet.</p>
              <Link to="/athlete/clubs" className="btn-primary" style={{ marginTop: "1rem" }}><Compass size={15}/> Discover Clubs</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club Name</th>
                    <th>Date Dispatch</th>
                    <th>Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 5).map(req => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 600 }}>{req.club?.name || "Club ID: " + req.club}</td>
                      <td style={{ color: "var(--theme-muted)", fontSize: "0.85rem" }}>
                        {new Date(req.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric'})}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status}
                        </span>
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
