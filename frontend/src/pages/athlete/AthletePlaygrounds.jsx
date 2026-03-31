import { useEffect, useState, useMemo } from "react";
import { MapPin, Loader2, Calendar, Clock, AlertCircle, X, CheckCircle, Navigation, Info, User } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "../club/ClubLayout.css";

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = import.meta.env.VITE_BACKEND_URL;

// Haversine formula for distance in KM
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.flyTo(center, 13, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function AthletePlaygrounds() {
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  // Map state
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Initial Map Center
  const [userLoc, setUserLoc] = useState(null); // Explicit [lat, lng] of user
  
  // Modals
  const [selectedPg, setSelectedPg] = useState(null);
  const [infoModalPg, setInfoModalPg] = useState(null);

  // Booking states
  const [bookingDate, setBookingDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDisabled, setBookingDisabled] = useState(false);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  useEffect(() => {
    const initializeGeo = async () => {
        setLoading(true);
        let activePos = null;

        // Try getting turfs right away
        let fetchedPlaygrounds = [];
        try {
            const r = await fetch(`${API}/api/playground/nearby?latitude=0&longitude=0&distance=20000000`);
            const d = await r.json();
            fetchedPlaygrounds = Array.isArray(d) ? d : [];
        } catch { showMsg("error", "Failed to reach server"); }

        // Attempt browser Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    activePos = [pos.coords.latitude, pos.coords.longitude];
                    setUserLoc(activePos);
                    setMapCenter(activePos);
                    setPlaygrounds(fetchedPlaygrounds);
                    setLoading(false);
                    showMsg("success", "Using precise precise GPS location!");
                },
                async () => {
                   // Fallback to Profile location if denied
                   try {
                     const r = await fetch(`${API}/api/athlete/me`, { credentials: "include" });
                     const profile = await r.json();
                     if (profile?.user?.location?.latitude) {
                         activePos = [profile.user.location.latitude, profile.user.location.longitude];
                         setUserLoc(activePos);
                         setMapCenter(activePos);
                         showMsg("info", "GPS denied. Using base location from your Profile.");
                     } else {
                         showMsg("alert", "Location restricted. Update Profile Base Location for sorting.");
                     }
                   } catch { console.log("Failed to fetch fallback profile loc"); }
                   setPlaygrounds(fetchedPlaygrounds);
                   setLoading(false);
                }
            );
        } else {
            setPlaygrounds(fetchedPlaygrounds);
            setLoading(false);
        }
    };
    initializeGeo();
  }, []);

  // Distance logic & Sorting
  const filtered = useMemo(() => {
    let result = playgrounds.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.address?.toLowerCase().includes(search.toLowerCase())
    );

    // Compute distance if user location is known
    if (userLoc) {
        result = result.map(pg => {
            const coords = pg.location?.coordinates;
            let dist = null;
            if (coords && coords.length >= 2) {
                dist = getDistance(userLoc[0], userLoc[1], coords[1], coords[0]);
            }
            return { ...pg, calculatedDistance: dist };
        });
        
        // Sort closest first
        result.sort((a, b) => {
            if (a.calculatedDistance === null) return 1;
            if (b.calculatedDistance === null) return -1;
            return a.calculatedDistance - b.calculatedDistance;
        });
    }

    return result;
  }, [playgrounds, search, userLoc]);

  // Handle clicking a turf card to view map easily
  const handleCardClick = (pg) => {
      const coords = pg.location?.coordinates;
      if (coords && coords.length >= 2) {
          setMapCenter([coords[1], coords[0]]);
      }
  };

  // Booking slots logic
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
      } else showMsg("error", data.message || "Booking failed.");
    } catch { showMsg("error", "Network error."); }
    finally { setBookingDisabled(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-left">
          <h1>Turf Explorer</h1>
          <p>Find, inspect, and book playgrounds securely around your coordinates</p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1.5rem", padding: "1.5rem 2.5rem", minHeight: 0, position: "relative" }}>
        
        {/* Absolute position messages so they don't break flex layout */}
        {msg && (
            <div className={`alert alert-${msg.type}`} style={{ position: "absolute", top: "1.5rem", left: "2.5rem", right: "2.5rem", zIndex: 100, boxShadow: "var(--theme-shadow)" }}>
                <AlertCircle size={15}/> {msg.text}
            </div>
        )}

        {/* LEFT PANEL: LIST OF TURFS */}
        <div style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 16, overflow: "hidden", zIndex: 10 }}>
            
            <div style={{ padding: "1.2rem", borderBottom: "1px solid var(--theme-border)", background: "var(--theme-surface-2)" }}>
              <div style={{ display:"flex", alignItems:"center", background:"var(--theme-surface)", border:"1px solid var(--theme-border-strong)", borderRadius:8, padding:"0.6rem 1rem", width: "100%" }}>
                <MapPin size={18} color="var(--theme-muted)" style={{ marginRight:"0.8rem" }} />
                <input 
                  type="text" placeholder="Search turfs by name..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background:"transparent", border:"none", color:"var(--theme-text)", width:"100%", outline:"none", fontSize:"0.95rem" }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
                {loading ? (
                    <div className="loading-state" style={{ height: "100%" }}><Loader2 size={24} className="spinner-icon"/> Pinpointing turfs...</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state" style={{ height: "100%", border: "none" }}>
                        <MapPin size={40} opacity={0.5} />
                        <p>No nearby turfs match your filter.</p>
                    </div>
                ) : (
                    filtered.map(pg => (
                        <div 
                            key={pg._id} 
                            className="card" 
                            style={{ padding: 0, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", transform: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                            onClick={() => handleCardClick(pg)}
                        >
                            <div style={{ display: "flex", padding: "1rem", gap: "1rem" }}>
                                <div style={{ width: 80, height: 80, borderRadius: 8, background: "var(--theme-surface-2)", overflow: "hidden", flexShrink: 0 }}>
                                    {pg.images?.length > 0 ? (
                                        <img src={`${API}${pg.images[0]}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={24} color="var(--theme-muted)" /></div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                    <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pg.name}</h3>
                                    
                                    <div style={{ fontSize: "0.8rem", color: "var(--theme-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.4rem" }}>
                                        <Navigation size={12} />
                                        {pg.calculatedDistance !== null && pg.calculatedDistance !== undefined 
                                            ? `${pg.calculatedDistance.toFixed(1)} km away` 
                                            : "Distance Unknown"}
                                    </div>
                                    
                                    <div style={{ fontSize: "0.8rem", color: "var(--theme-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pg.address}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", borderTop: "1px solid var(--theme-border)" }}>
                                <button className="btn-ghost" style={{ flex: 1, borderRadius: 0, border: "none", borderRight: "1px solid var(--theme-border)", fontSize: "0.8rem", padding: "0.6rem" }} onClick={(e) => { e.stopPropagation(); setInfoModalPg(pg); }}>
                                    <Info size={14} /> Details
                                </button>
                                <button className="btn-primary" disabled={!pg.bookingEnabled} style={{ flex: 1, borderRadius: 0, border: "none", fontSize: "0.8rem", padding: "0.6rem" }} onClick={(e) => { e.stopPropagation(); setSelectedPg(pg); setBookingDate(""); setAvailableSlots([]); }}>
                                    <Calendar size={14} /> Book
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* RIGHT PANEL: LEAFLET MAP */}
        <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", border: "1px solid var(--theme-border)", background: "var(--theme-surface-2)", position: "relative" }}>
            <MapContainer center={mapCenter} zoom={userLoc ? 12 : 5} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapUpdater center={mapCenter} />
                
                {/* User Location Marker */}
                {userLoc && (
                    <Marker position={userLoc} icon={L.divIcon({ className: "custom-user-marker", html: `<div style="width:16px;height:16px;background:var(--theme-primary);border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>`})}>
                        <Popup><strong>You are here</strong></Popup>
                    </Marker>
                )}

                {/* Turf Markers */}
                {filtered.map(pg => {
                    const coords = pg.location?.coordinates;
                    if (!coords || coords.length < 2) return null;
                    const position = [coords[1], coords[0]];
                    return (
                        <Marker key={pg._id} position={position}>
                            <Popup>
                                <div style={{ minWidth: 160 }}>
                                    <h4 style={{ margin: "0 0 5px 0", fontSize: "1rem", color: "#111" }}>{pg.name}</h4>
                                    <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#555" }}>
                                        {pg.calculatedDistance !== null && pg.calculatedDistance !== undefined ? `${pg.calculatedDistance.toFixed(1)} km away` : pg.address}
                                    </p>
                                    <button className="btn-primary" style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", width: "100%", justifyContent: "center" }} onClick={(e) => { e.stopPropagation(); setInfoModalPg(pg); }}>
                                        Full Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Locate Me Overlay Button */}
            <button 
                onClick={() => {
                   if(userLoc) setMapCenter(userLoc);
                }} 
                style={{ position: "absolute", bottom: "2rem", right: "1rem", zIndex: 999, width: 48, height: 48, borderRadius: "50%", background: "var(--theme-surface)", border: "1px solid var(--theme-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}
                title="Center on my location"
            >
                <Navigation size={20} color="var(--theme-primary)" />
            </button>
        </div>

      </div>

      {/* --- Look Map & Turf Info Modal --- */}
      {infoModalPg && (
        <div className="modal-backdrop" onClick={() => setInfoModalPg(null)} style={{ zIndex: 9999 }}>
            <div className="modal" style={{ maxWidth: 650, padding: 0, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                <div style={{ height: 250, background: "var(--theme-surface-2)", position: "relative", zIndex: 10 }}>
                    {infoModalPg.location?.coordinates && infoModalPg.location.coordinates.length >= 2 ? (
                        <MapContainer 
                            center={[infoModalPg.location.coordinates[1], infoModalPg.location.coordinates[0]]} 
                            zoom={16} 
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[infoModalPg.location.coordinates[1], infoModalPg.location.coordinates[0]]}>
                                <Popup>{infoModalPg.name}</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-muted)" }}>
                            Coordinates not properly set for this turf.
                        </div>
                    )}
                    <button className="btn-ghost" style={{ position: "absolute", top: 10, right: 10, zIndex: 999, background: "var(--theme-surface)", border: "1px solid var(--theme-border)", padding: "0.4rem" }} onClick={() => setInfoModalPg(null)}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>{infoModalPg.name}</h2>
                            <p style={{ color: "var(--theme-muted)", fontSize: "0.95rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <MapPin size={16} /> {infoModalPg.address}
                            </p>
                        </div>
                        {infoModalPg.calculatedDistance !== null && infoModalPg.calculatedDistance !== undefined && (
                            <div className="badge badge-accepted" style={{ fontSize: "0.85rem", background: "rgba(16, 185, 129, 0.1)", border: "none" }}>
                                {infoModalPg.calculatedDistance.toFixed(2)} km Away
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderTop: "1px solid var(--theme-border-strong)", paddingTop: "1.5rem" }}>
                        <div>
                            <div style={{ fontSize: "0.8rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>Facilities / Sports</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                {(infoModalPg.sports || []).map(f => (
                                    <span key={f} className="badge badge-accepted" style={{ background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)", color: "var(--theme-text)" }}>{f}</span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "0.8rem", color: "var(--theme-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>Contact Host / Club</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", background: "var(--theme-surface-2)", padding: "0.8rem", borderRadius: 8, border: "1px solid var(--theme-border)" }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--theme-surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <User size={18} color="var(--theme-primary)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{infoModalPg.club?.name || "Premium Club Admin"}</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--theme-primary)" }}>Click to message (Coming Soon)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Booking Modal --- */}
      {selectedPg && (
        <div className="modal-backdrop" onClick={() => setSelectedPg(null)} style={{ zIndex: 9999 }}>
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
                          <div style={{ padding: "1rem", textAlign: "center", color: "var(--theme-muted)", fontSize: "0.85rem" }}>No slots available for this date.</div>
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
                                      style={{ fontSize: "0.85rem", padding: "0.6rem", border: "1px solid var(--theme-border)" }}
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
