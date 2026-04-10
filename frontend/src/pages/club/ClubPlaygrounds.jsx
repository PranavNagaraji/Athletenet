import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Loader2, X, AlertCircle, Image as ImageIcon, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { VALIDATION_LIMITS, isTimeRangeValid, validateFile } from "../../utils/formValidation";
import "../club/ClubLayout.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = import.meta.env.VITE_BACKEND_URL;

const SPORTS = ["football","cricket","basketball","volleyball","tennis","badminton",
  "table_tennis","hockey","rugby","baseball","golf","squash","kabaddi",
  "handball","futsal","swimming","athletics","running","cycling","skating","gymnastics"];

const emptyForm = { 
  name:"", address:"", sports:[], 
  size:{ length:"", width:"" }, 
  status:"active", bookingEnabled:true, 
  location:{ type:"Point", coordinates:["",""] }, 
  images: [],
  openTime: "06:00",
  closeTime: "22:00",
  slotDuration: 60,
  customTimings: []
};

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lng, e.latlng.lat]); } });
  const latLng = position[1] && position[0] ? [position[1], position[0]] : null;
  return latLng ? <Marker position={latLng} /> : null;
}

export default function ClubPlaygrounds() {
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editPg, setEditPg]           = useState(null); // playground being edited
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [msg, setMsg]                 = useState(null);
  const [bookingsMap, setBookingsMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileError = validateFile(file);
    if (fileError) {
      showMsg("error", fileError);
      return;
    }
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setForm(f => ({ ...f, images: [...(f.images || []), data.url] }));
      else showMsg("error", data.message);
    } catch { showMsg("error", "Image upload failed"); }
    finally { setUploadingImg(false); }
  };

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch { showMsg("error", "Search failed"); }
    finally { setSearching(false); }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Auto-fill playground name if empty and result has name
    let newName = form.name;
    if (!newName) {
      newName = result.name || result.display_name.split(",")[0];
    }
    
    setForm(f => ({
      ...f,
      name: newName,
      location: { ...f.location, coordinates: [lon, lat] }
    }));
    setSearchResults([]);
    setSearchQuery("");
  };

  // Fetch club's playgrounds — we use /api/playground/nearby with wide range, or get by club profile first
  // Since there's no "get all playgrounds by club" endpoint, we get by location with a large radius,
  // OR we just get nearby with coords 0,0 and large distance. The cleanest available is /api/club/profile
  // to get the club id, then we don't have a direct endpoint. We'll work with what there is.
  // Actually looking at the API: there's no "GET /api/playground?clubId=..." endpoint.
  // We'll fetch all clubs to get the club id, get club profile, then filter or get all and filter by club.
  // Simplest: use getNearbyPlaygrounds with user's location or use a large radius from a default loc.
  const fetchPlaygrounds = async () => {
    setLoading(true);
    try {
      // Get club profile to find club _id, then we'll filter playgrounds
      const profileRes = await fetch(`${API}/api/club/profile`, { credentials:"include" });
      const profile = await profileRes.json();
      // There's no direct endpoint so we use nearby with large radius
      // For now use lat=0,lng=0,distance=20000000 to get all, filter by club._id
      const res  = await fetch(`${API}/api/playground/nearby?latitude=0&longitude=0&distance=20000000`);
      const data = await res.json();
      const filtered = Array.isArray(data) ? data.filter(p => p.club === profile._id || p.club?._id === profile._id) : [];
      setPlaygrounds(filtered);
    } catch { setPlaygrounds([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlaygrounds(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditPg(null); setShowModal(true); };
  const openEdit   = (pg) => {
    setForm({
      name: pg.name, address: pg.address,
      sports: pg.sports || [],
      size: { length: pg.size?.length || "", width: pg.size?.width || "" },
      status: pg.status || "active",
      bookingEnabled: pg.bookingEnabled ?? true,
      location: pg.location || { type:"Point", coordinates:["",""] },
      images: pg.images || [],
      openTime: pg.openTime || "06:00",
      closeTime: pg.closeTime || "22:00",
      slotDuration: pg.slotDuration || 60,
      customTimings: pg.customTimings || [],
    });
    setEditPg(pg); setShowModal(true);
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    const trimmedAddress = form.address.trim();
    const length = Number(form.size.length);
    const width = Number(form.size.width);
    const lng = parseFloat(form.location.coordinates[0]);
    const lat = parseFloat(form.location.coordinates[1]);
    const normalizedCustomTimings = form.customTimings.map((slot) => ({ start: slot.start, end: slot.end }));

    if (trimmedName.length < 3 || trimmedName.length > VALIDATION_LIMITS.titleMax) return showMsg("error", "Playground name must be between 3 and 100 characters.");
    if (trimmedAddress.length < 5 || trimmedAddress.length > VALIDATION_LIMITS.addressMax) return showMsg("error", "Please enter a complete address.");
    if (!Number.isFinite(length) || length < 5 || length > 500) return showMsg("error", "Length must be between 5 and 500 meters.");
    if (!Number.isFinite(width) || width < 5 || width > 500) return showMsg("error", "Width must be between 5 and 500 meters.");
    if (!isTimeRangeValid(form.openTime, form.closeTime)) return showMsg("error", "Close time must be after open time.");
    if (!Number.isInteger(Number(form.slotDuration)) || Number(form.slotDuration) < 15 || Number(form.slotDuration) > 240) return showMsg("error", "Slot duration must be between 15 and 240 minutes.");
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return showMsg("error", "Please pick a valid map location.");
    if (form.sports.length === 0) return showMsg("error", "Select at least one sport for this playground.");
    if (form.images.length > 6) return showMsg("error", "Please keep playground images to 6 or fewer.");
    if (normalizedCustomTimings.some((slot) => !isTimeRangeValid(slot.start, slot.end))) return showMsg("error", "Each custom operating interval must end after it starts.");

    setSaving(true);
    const payload = {
      ...form,
      name: trimmedName,
      address: trimmedAddress,
      size: { length, width },
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      customTimings: normalizedCustomTimings,
    };
    try {
      const url    = editPg ? `${API}/api/playground/${editPg._id}` : `${API}/api/playground/`;
      const method = editPg ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { showMsg("success", editPg ? "Playground updated!" : "Playground created!"); setShowModal(false); fetchPlaygrounds(); }
      else { const d = await res.json(); showMsg("error", d.message); }
    } catch { showMsg("error","Network error."); }
    setSaving(false);
  };

  const deletePg = async (id) => {
    if (!confirm("Delete this playground?")) return;
    const res = await fetch(`${API}/api/playground/${id}`, { method:"DELETE", credentials:"include" });
    if (res.ok) { showMsg("success","Deleted."); setPlaygrounds(p => p.filter(pg => pg._id !== id)); }
    else { const d = await res.json(); showMsg("error", d.message); }
  };

  const toggleBooking = async (id) => {
    const res = await fetch(`${API}/api/playground/${id}/booking`, { method:"PATCH", credentials:"include" });
    if (res.ok) { const d = await res.json(); setPlaygrounds(p => p.map(pg => pg._id===id ? {...pg,bookingEnabled:d.bookingEnabled}:pg)); }
  };

  const toggleSport = (s) => setForm(f => ({
    ...f, sports: f.sports.includes(s) ? f.sports.filter(x=>x!==s) : [...f.sports, s]
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Playgrounds</h1>
          <p>{playgrounds.length} playground{playgrounds.length!==1?"s":""} registered</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={15}/> Add Playground</button>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={14}/> {msg.text}</div>}

        {loading ? (
          <div className="loading-state"><Loader2 size={20} className="spinner-icon"/>Loading…</div>
        ) : playgrounds.length === 0 ? (
          <div className="empty-state" style={{ minHeight:300 }}>
            <MapPin size={48}/>
            <p>No playgrounds yet. Add your first playground.</p>
            <button className="btn-primary" onClick={openCreate}><Plus size={15}/>Add Playground</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {playgrounds.map(pg => (
              <div key={pg._id} className="card">
                <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem", flexWrap:"wrap" }}>
                  <div style={{ width: 100, height: 80, borderRadius: 8, overflow:"hidden", background:"var(--c-surface2)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {pg.images && pg.images.length > 0 ? (
                      <img src={`${API}${pg.images[0]}`} alt={pg.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    ) : <ImageIcon size={24} color="var(--c-muted)" />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem" }}>
                      <MapPin size={16} color="var(--c-primary)"/>
                      <span style={{ fontWeight:700, fontSize:"1rem" }}>{pg.name}</span>
                      <span className={`badge badge-${pg.status}`}>{pg.status}</span>
                    </div>
                    <p style={{ fontSize:"0.82rem", color:"var(--c-muted)", marginBottom:"0.5rem" }}>{pg.address}</p>
                    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                      {(pg.sports||[]).map(s => (
                        <span key={s} style={{ fontSize:"0.7rem", padding:"0.15rem 0.5rem", background:"rgba(249,115,22,0.1)", color:"var(--c-primary)", borderRadius:100, textTransform:"capitalize" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", flexShrink:0, alignItems:"center" }}>
                    <span style={{ fontSize:"0.78rem", color:"var(--c-muted)" }}>
                      {pg.size?.length}×{pg.size?.width}m
                    </span>
                    <button className="btn-ghost" style={{ padding:"0.35rem 0.65rem", fontSize:"0.78rem" }}
                      onClick={() => toggleBooking(pg._id)} title="Toggle booking">
                      {pg.bookingEnabled ? <ToggleRight size={16} color="var(--c-primary)"/> : <ToggleLeft size={16}/>}
                      {pg.bookingEnabled ? "Booking On" : "Booking Off"}
                    </button>
                    <button className="btn-ghost" style={{ padding:"0.35rem 0.65rem", fontSize:"0.78rem" }} onClick={() => openEdit(pg)}>
                      <Pencil size={13}/> Edit
                    </button>
                    <button className="btn-danger" onClick={() => deletePg(pg._id)}>
                      <Trash2 size={13}/> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth:560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <div className="modal-title">{editPg ? "Edit Playground" : "Add Playground"}</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>

            <div className="form-grid" style={{ gap:"0.9rem", maxHeight:"70vh", overflowY:"auto", paddingRight:"0.25rem" }}>
              <div className="field-group">
                <label className="field-label">Name</label>
                <input className="field-input" placeholder="Main Stadium" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required minLength={3} maxLength={VALIDATION_LIMITS.titleMax}/>
              </div>
              <div className="field-group">
                <label className="field-label">Address</label>
                <input className="field-input" placeholder="123 Sports Lane" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} required minLength={5} maxLength={VALIDATION_LIMITS.addressMax}/>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label">Length (m)</label>
                  <input className="field-input" type="number" min="5" max="500" placeholder="100" value={form.size.length} onChange={e=>setForm(f=>({...f,size:{...f.size,length:e.target.value}}))}/>
                </div>
                <div className="field-group">
                  <label className="field-label">Width (m)</label>
                  <input className="field-input" type="number" min="5" max="500" placeholder="60" value={form.size.width} onChange={e=>setForm(f=>({...f,size:{...f.size,width:e.target.value}}))}/>
                </div>
              </div>

              <div className="form-grid form-grid-3">
                <div className="field-group">
                  <label className="field-label"><Clock size={14} style={{verticalAlign:"-2px", marginRight:4}}/> Open Time</label>
                  <input type="time" className="field-input" value={form.openTime} onChange={e=>setForm(f=>({...f,openTime:e.target.value}))} />
                </div>
                <div className="field-group">
                  <label className="field-label"><Clock size={14} style={{verticalAlign:"-2px", marginRight:4}}/> Close Time</label>
                  <input type="time" className="field-input" value={form.closeTime} onChange={e=>setForm(f=>({...f,closeTime:e.target.value}))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Slot (Mins)</label>
                  <input type="number" className="field-input" min="15" max="240" step="15" placeholder="60" value={form.slotDuration} onChange={e=>setForm(f=>({...f,slotDuration:Number(e.target.value)}))} />
                </div>
              </div>

              {/* Custom Timings Section */}
              <div className="field-group" style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: 12, border: "1px solid var(--c-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                  <label className="field-label" style={{ margin: 0 }}>Custom Operating Intervals (Optional)</label>
                  <button type="button" className="btn-ghost" style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }} onClick={() => setForm(f => ({ ...f, customTimings: [...f.customTimings, { start: "09:00", end: "12:00" }] }))}>
                    <Plus size={14} /> Add Shift
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "1rem" }}>Define specific shifts (e.g., Morning 6-10, Evening 4-9). If empty, the global Open/Close times above will be used.</p>
                
                {form.customTimings.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <input type="time" className="field-input" value={t.start} onChange={e => {
                      const newT = [...form.customTimings];
                      newT[i].start = e.target.value;
                      setForm(f => ({ ...f, customTimings: newT }));
                    }} />
                    <span style={{ color: "var(--c-muted)" }}>to</span>
                    <input type="time" className="field-input" value={t.end} onChange={e => {
                      const newT = [...form.customTimings];
                      newT[i].end = e.target.value;
                      setForm(f => ({ ...f, customTimings: newT }));
                    }} />
                    <button type="button" className="btn-ghost" style={{ color: "var(--c-danger)", padding: "0.5rem" }} onClick={() => setForm(f => ({ ...f, customTimings: f.customTimings.filter((_, idx) => idx !== i) }))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="field-group">
                <label className="field-label">Images</label>
                <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.5rem" }}>
                  {(form.images || []).map((img, i) => (
                    <div key={i} style={{ position:"relative", width:80, height:80, borderRadius:8, overflow:"hidden", border:"1px solid var(--c-border)" }}>
                      <img src={`${API}${img}`} alt="pg" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      <button type="button" onClick={() => setForm(f => ({...f, images: f.images.filter((_, idx)=>idx!==i)}))} style={{ position:"absolute", top:2, right:2, background:"rgba(0,0,0,0.6)", color:"white", border:"none", borderRadius:"50%", padding:4, cursor:"pointer" }}><X size={12}/></button>
                    </div>
                  ))}
                  <label style={{ width:80, height:80, borderRadius:8, border:"1px dashed var(--c-border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", background:"var(--c-surface2)" }}>
                    {uploadingImg ? <Loader2 size={20} className="spinner-icon"/> : <Plus size={20} color="var(--c-muted)"/>}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={uploadingImg}/>
                  </label>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Location (Search or Click on map)</label>
                
                <div style={{ display:"flex", gap:"0.5rem", position:"relative", marginBottom:"1rem" }}>
                  <input className="field-input" placeholder="Search a place (e.g. Yankee Stadium)" 
                    value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} 
                    onKeyDown={e=>{if(e.key==='Enter') { e.preventDefault(); handleLocationSearch(); }}}
                  />
                  <button type="button" className="btn-primary" onClick={handleLocationSearch} disabled={searching} style={{ padding:"0 1rem" }}>
                    {searching ? <Loader2 size={16} className="spinner-icon"/> : "Search"}
                  </button>
                  {searchResults.length > 0 && (
                    <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"var(--c-surface)", border:"1px solid var(--c-border)", borderRadius:8, zIndex:1000, maxHeight:200, overflowY:"auto", marginTop:"0.2rem", boxShadow:"0 4px 12px rgba(0,0,0,0.5)" }}>
                      {searchResults.map((r, i) => (
                        <div key={i} onClick={() => selectSearchResult(r)} 
                          style={{ padding:"0.6rem", borderBottom:"1px solid var(--c-border)", cursor:"pointer", fontSize:"0.8rem", color:"var(--c-text)", transition:"background 0.2s" }} 
                          onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          {r.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ height: 300, width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid var(--c-border)" }}>
                  <MapContainer center={form.location.coordinates && form.location.coordinates[1] ? [form.location.coordinates[1], form.location.coordinates[0]] : [28.6139, 77.2090]} zoom={11} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker 
                      position={form.location.coordinates} 
                      setPosition={(coords) => setForm(f => ({ ...f, location: { ...f.location, coordinates: coords } }))} 
                    />
                  </MapContainer>
                </div>
                {form.location.coordinates[0] !== "" && (
                  <p style={{ fontSize:"0.75rem", color:"var(--c-muted)", marginTop:"0.4rem" }}>
                    Selected: {Number(form.location.coordinates[1]).toFixed(4)}° N, {Number(form.location.coordinates[0]).toFixed(4)}° E
                  </p>
                )}
              </div>
              <div className="field-group">
                <label className="field-label">Status</label>
                <select className="field-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Sports (select all that apply)</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem", marginTop:"0.25rem" }}>
                  {SPORTS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSport(s)}
                      style={{ padding:"0.2rem 0.65rem", borderRadius:100, fontSize:"0.72rem", fontWeight:600, textTransform:"capitalize", cursor:"pointer", border:"1.5px solid", transition:"all 0.15s",
                        background: form.sports.includes(s) ? "rgba(249,115,22,0.15)" : "transparent",
                        borderColor: form.sports.includes(s) ? "var(--c-primary)" : "rgba(255,255,255,0.1)",
                        color: form.sports.includes(s) ? "var(--c-primary)" : "var(--c-muted)",
                      }}>
                      {s.replace("_"," ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="spinner-icon"/> : <Plus size={14}/>}
                {editPg ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
