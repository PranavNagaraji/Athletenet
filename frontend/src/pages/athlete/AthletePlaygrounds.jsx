import { useEffect, useState } from "react";
import { MapPin, Loader2, Calendar, Clock, AlertCircle, X, CheckCircle } from "lucide-react";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthletePlaygrounds() {
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  // Booking Modal State
  const [selectedPg, setSelectedPg] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDisabled, setBookingDisabled] = useState(false);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  useEffect(() => {
    // Fetch all playgrounds
    fetch(`${API}/api/playground/nearby?latitude=0&longitude=0&distance=20000000`)
      .then(r => r.json())
      .then(d => setPlaygrounds(Array.isArray(d) ? d : []))
      .catch(() => showMsg("error", "Failed to load playgrounds"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPg && bookingDate) {
      setLoadingSlots(true);
      fetch(`${API}/api/booking/slots/${selectedPg._id}?date=${bookingDate}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => {
            setAvailableSlots(Array.isArray(data) ? data : []);
            setSelectedSlot(null);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedPg, bookingDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    setBookingDisabled(true);

    try {
      const res = await fetch(`${API}/api/booking`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playground: selectedPg._id,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Playground booked successfully!");
        setSelectedPg(null);
      } else {
        showMsg("error", data.message || "Booking failed.");
      }
    } catch { showMsg("error", "Network error."); }
    finally { setBookingDisabled(false); }
  };

  const filtered = playgrounds.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Book Playgrounds</h1>
          <p>Discover available turfs, courts, and fields</p>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15}/> {msg.text}</div>}

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", background:"var(--c-surface)", border:"1px solid var(--c-border)", borderRadius:8, padding:"0.6rem 1rem" }}>
            <MapPin size={18} color="var(--c-muted)" style={{ marginRight:"0.8rem" }} />
            <input 
              type="text" placeholder="Search by name or location..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background:"transparent", border:"none", color:"var(--c-text)", width:"100%", outline:"none", fontSize:"0.95rem" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading facilities...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <MapPin size={40} />
            <p>No playgrounds found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {filtered.map(pg => (
              <div key={pg._id} className="card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
                <div style={{ height: 160, background: "var(--c-surface2)", position: "relative" }}>
                  {pg.images?.length > 0 ? (
                    <img src={`${API}${pg.images[0]}`} alt={pg.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)" }}>
                      <MapPin size={40} opacity={0.5} />
                    </div>
                  )}
                  {pg.bookingEnabled && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(16, 185, 129, 0.9)", color: "#fff", padding: "0.2rem 0.6rem", fontSize: "0.75rem", borderRadius: 100, fontWeight: 600 }}>
                      Open for Booking
                    </div>
                  )}
                </div>
                
                <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>{pg.name}</h3>
                  <p style={{ margin: "0 0 0.8rem 0", color: "var(--c-muted)", fontSize: "0.85rem", display: "flex", alignItems: "start", gap: "0.4rem" }}>
                    <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    {pg.address || "No address provided"}
                  </p>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.2rem", flex: 1 }}>
                    {(pg.sports || []).map(f => (
                      <span key={f} style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.75rem", color: "var(--c-text)", border: "1px solid var(--c-border)" }}>
                        {f}
                      </span>
                    ))}
                  </div>

                  <button 
                    className="btn-primary" 
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={!pg.bookingEnabled}
                    onClick={() => {
                       setSelectedPg(pg);
                       setBookingDate("");
                       setAvailableSlots([]);
                    }}
                  >
                    <Calendar size={16} /> {pg.bookingEnabled ? "Select Date & Book" : "Maintenance Mode"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPg && (
        <div className="modal-backdrop" onClick={() => setSelectedPg(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <div className="modal-title">Select Time Slot: {selectedPg.name}</div>
              <button className="btn-ghost" style={{ padding:"0.3rem" }} onClick={() => setSelectedPg(null)}><X size={16}/></button>
            </div>
            
            <form onSubmit={handleBook} className="form-grid">
              <div className="field-group">
                <label className="field-label"><Calendar size={14} style={{verticalAlign:"-2px", marginRight:4}}/> Choose Date</label>
                <input type="date" className="field-input" required min={new Date().toISOString().split('T')[0]} value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
              </div>

              {bookingDate && (
                  <div className="field-group">
                      <label className="field-label"><Clock size={14} style={{verticalAlign:"-2px", marginRight:4}}/> Available Slots</label>
                      {loadingSlots ? (
                          <div style={{ padding: "1rem", textAlign: "center" }}><Loader2 size={20} className="spinner-icon" /></div>
                      ) : availableSlots.length === 0 ? (
                          <div style={{ padding: "1rem", textAlign: "center", color: "var(--c-muted)", fontSize: "0.85rem" }}>No slots available for this date.</div>
                      ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", maxHeight: 250, overflowY: "auto", padding: "0.2rem" }}>
                              {availableSlots
                                .filter(slot => {
                                   const isFuture = new Date(slot.start) > new Date();
                                   return isFuture && slot.status === "available";
                                })
                                .map((slot, idx) => (
                                  <button 
                                      key={idx} type="button" 
                                      className={selectedSlot === slot ? "btn-primary" : "btn-ghost"}
                                      style={{ fontSize: "0.85rem", padding: "0.6rem", border: "1px solid var(--c-border)" }}
                                      onClick={() => setSelectedSlot(slot)}
                                  >
                                      {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})} - {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setSelectedPg(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={bookingDisabled || !selectedSlot}>
                  {bookingDisabled ? <Loader2 size={16} className="spinner-icon"/> : <CheckCircle size={16}/>} Confirm {selectedSlot ? "Slot" : "Selection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
