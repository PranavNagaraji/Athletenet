import { useEffect, useState } from "react";
import { Trophy, Plus, Trash2, Pencil, Loader2, X, Calendar, AlertCircle } from "lucide-react";
import "../club/ClubLayout.css";
import { VALIDATION_LIMITS, isDateRangeValid } from "../../utils/formValidation";

const API = import.meta.env.VITE_BACKEND_URL;

const emptyForm = { name:"", sport:"", startDate:"", endDate:"", status:"upcoming", public:true };

export default function ClubCompetitions() {
  const [comps, setComps]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editComp, setEditComp]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3000); };

  const fetchComps = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/competition`, { credentials:"include" });
      const data = await res.json();
      setComps(Array.isArray(data) ? data : []);
    } catch { setComps([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComps(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditComp(null); setShowModal(true); };
  const openEdit   = (c) => {
    setForm({
      name:      c.name,
      sport:     c.sport,
      startDate: c.startDate ? c.startDate.slice(0,10) : "",
      endDate:   c.endDate   ? c.endDate.slice(0,10)   : "",
      status:    c.status,
      public:    c.public ?? true,
    });
    setEditComp(c); setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      name: form.name.trim(),
      sport: form.sport.trim().toLowerCase(),
    };
    if (payload.name.length < 3 || payload.name.length > VALIDATION_LIMITS.titleMax) return showMsg("error", "Competition name must be between 3 and 100 characters.");
    if (!payload.sport || payload.sport.length > VALIDATION_LIMITS.sportMax) return showMsg("error", "Please enter a valid sport.");
    if (!isDateRangeValid(payload.startDate, payload.endDate)) return showMsg("error", "End date must be the same as or after the start date.");

    setSaving(true);
    try {
      const url    = editComp ? `${API}/api/competition/${editComp._id}` : `${API}/api/competition`;
      const method = editComp ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { showMsg("success", editComp?"Competition updated!":"Competition created!"); setShowModal(false); fetchComps(); }
      else { const d = await res.json(); showMsg("error", d.message); }
    } catch { showMsg("error","Network error."); }
    setSaving(false);
  };

  const deleteComp = async (id) => {
    if (!confirm("Delete this competition?")) return;
    const res = await fetch(`${API}/api/competition/${id}`, { method:"DELETE", credentials:"include" });
    if (res.ok) { showMsg("success","Deleted."); setComps(c=>c.filter(x=>x._id!==id)); }
    else { const d = await res.json(); showMsg("error",d.message); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Competitions</h1>
          <p>{comps.length} competition{comps.length!==1?"s":""}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={15}/> New Competition</button>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={14}/> {msg.text}</div>}

        {loading ? (
          <div className="loading-state"><Loader2 size={20} className="spinner-icon"/>Loading…</div>
        ) : comps.length === 0 ? (
          <div className="empty-state" style={{ minHeight:300 }}>
            <Trophy size={48}/>
            <p>No competitions yet. Create your first one.</p>
            <button className="btn-primary" onClick={openCreate}><Plus size={15}/>New Competition</button>
          </div>
        ) : (
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Sport</th><th>Start</th><th>End</th><th>Status</th><th>Visibility</th><th></th></tr>
              </thead>
              <tbody>
                {comps.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight:600 }}>{c.name}</td>
                    <td style={{ textTransform:"capitalize",color:"var(--c-muted)" }}>{c.sport}</td>
                    <td style={{ color:"var(--c-muted)",fontSize:"0.85rem" }}><Calendar size={12} style={{marginRight:4,display:"inline"}}/>{fmt(c.startDate)}</td>
                    <td style={{ color:"var(--c-muted)",fontSize:"0.85rem" }}>{fmt(c.endDate)}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td><span className={`badge ${c.public?"badge-accepted":"badge-inactive"}`}>{c.public?"Public":"Private"}</span></td>
                    <td>
                      <div style={{ display:"flex", gap:"0.4rem" }}>
                        <button className="btn-ghost" style={{ padding:"0.35rem 0.65rem", fontSize:"0.78rem" }} onClick={()=>openEdit(c)}>
                          <Pencil size={12}/> Edit
                        </button>
                        <button className="btn-danger" onClick={()=>deleteComp(c._id)}>
                          <Trash2 size={12}/> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <div className="modal-title">{editComp?"Edit Competition":"New Competition"}</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={()=>setShowModal(false)}><X size={16}/></button>
            </div>

            <div className="form-grid" style={{ gap:"0.9rem" }}>
              <div className="field-group">
                <label className="field-label">Competition Name</label>
                <input className="field-input" placeholder="e.g. Summer League 2025" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required minLength={3} maxLength={VALIDATION_LIMITS.titleMax}/>
              </div>
              <div className="field-group">
                <label className="field-label">Sport</label>
                <input className="field-input" placeholder="e.g. Football" value={form.sport} onChange={e=>setForm(f=>({...f,sport:e.target.value}))} required maxLength={VALIDATION_LIMITS.sportMax}/>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label">Start Date</label>
                  <input className="field-input" type="date" required value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/>
                </div>
                <div className="field-group">
                  <label className="field-label">End Date</label>
                  <input className="field-input" type="date" required min={form.startDate || undefined} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/>
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select className="field-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Visibility</label>
                  <select className="field-select" value={form.public?"public":"private"} onChange={e=>setForm(f=>({...f,public:e.target.value==="public"}))}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving?<Loader2 size={14} className="spinner-icon"/>:<Plus size={14}/>}
                {editComp?"Save Changes":"Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
