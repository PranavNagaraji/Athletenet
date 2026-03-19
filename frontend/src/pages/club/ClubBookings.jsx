import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Calendar, Edit2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import "./ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubBookings() {
  const [playgrounds, setPlaygrounds] = useState([]);
  const [bookingsByPg, setBookingsByPg] = useState({});
  const [slotsByPg, setSlotsByPg] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch(`${API}/api/club/profile`, { credentials: "include" });
      const profile = await profileRes.json();

      const pgRes = await fetch(`${API}/api/playground/nearby?latitude=0&longitude=0&distance=20000000`);
      const allPg = await pgRes.json();
      const clubPgs = allPg.filter(p => String(p.club?._id || p.club) === String(profile._id));
      setPlaygrounds(clubPgs);

      const bookingDb = {};
      const slotDb = {};
      await Promise.all(clubPgs.map(async (pg) => {
        // Bookings
        const bRes = await fetch(`${API}/api/booking/playground/${pg._id}`, { credentials: "include" });
        if (bRes.ok) bookingDb[pg._id] = await bRes.json();
        
        // Slots for selected date
        if (pg.bookingEnabled) {
          const sRes = await fetch(`${API}/api/booking/slots/${pg._id}?date=${selectedDate}`, { credentials: "include" });
          if (sRes.ok) slotDb[pg._id] = await sRes.json();
        }
      }));

      setBookingsByPg(bookingDb);
      setSlotsByPg(slotDb);
    } catch (err) {
      showMsg("error", "Failed to load bookings database.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = async (pgId, currentMode) => {
    const newMode = currentMode === "manual" ? "open" : "manual";
    try {
      const res = await fetch(`${API}/api/playground/${pgId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityMode: newMode })
      });
      if (res.ok) {
        showMsg("success", `Mode changed to ${newMode}.`);
        fetchData();
      }
    } catch { showMsg("error", "Failed to update mode."); }
  };

  const handleBlock = async (pgId, slot, action) => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/booking/block`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playgroundId: pgId, startTime: slot.start, endTime: slot.end, action })
      });
      if (res.ok) {
        showMsg("success", "Slot status updated.");
        fetchData();
      } else {
        const d = await res.json();
        showMsg("error", d.message || "Action failed.");
      }
    } catch (err) {
      showMsg("error", "Network error.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading booking ledger...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Facility Bookings</h1>
          <p>Track all active and past reservations for your playgrounds</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="field-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.8rem", background: "var(--c-surface2)", padding: "0.4rem 1rem", borderRadius: 12, border: "1px solid var(--c-border)" }}>
            <Calendar size={16} color="var(--c-primary)" />
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{ background:"transparent", border:"none", color:"#fff", outline:"none", fontSize:"0.9rem" }} />
          </div>
          <Link to="/club/playgrounds" className="btn-ghost" style={{ border: "1px solid var(--c-border)" }}>
            <Edit2 size={16} /> Manage Playgrounds
          </Link>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15}/> {msg.text}</div>}

        {playgrounds.length === 0 ? (
          <div className="empty-state">
            <CalendarClock size={40} />
            <p>You haven't listed any playgrounds yet.</p>
            <Link to="/club/playgrounds" className="btn-primary" style={{ marginTop: "1rem" }}><Calendar size={15}/> Add a Playground</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {playgrounds.map(pg => {
              const bks = bookingsByPg[pg._id] || [];
              return (
                <div key={pg._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "1rem 1.2rem", background: "var(--c-surface2)", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <div>
                       <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                         {pg.name}
                         {!pg.bookingEnabled && <span style={{ fontSize: "0.7rem", color: "var(--c-primary)", background: "rgba(249,115,22,0.15)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>Unbookable</span>}
                         <span style={{ fontSize: "0.7rem", color: "var(--c-muted)", background: "rgba(255,255,255,0.05)", padding: "0.1rem 0.4rem", borderRadius: 4, textTransform: "uppercase" }}>{pg.availabilityMode || "open"} Mode</span>
                       </h3>
                        <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.85rem", color: "var(--c-muted)" }}>
                          {pg.address} • {bks.length} historical booking{bks.length !== 1 && "s"}.
                        </p>
                     </div>
                     <button className="btn-ghost" style={{ fontSize: "0.75rem", border: "1px solid var(--c-border)" }} onClick={() => handleToggleMode(pg._id, pg.availabilityMode)}>
                        Switch to {pg.availabilityMode === "manual" ? "Open" : "Manual"} Mode
                     </button>
                  </div>

                  {/* Daily Schedule View */}
                  <div style={{ padding: "1.2rem", borderBottom: "1px solid var(--c-border)" }}>
                    <h4 style={{ fontSize: "0.85rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <CalendarClock size={14} /> Schedule for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                      {(slotsByPg[pg._id] || []).map((slot, idx) => {
                        const isBlocked = slot.status === "blocked";
                        const isTaken = slot.status === "booked";
                        const isProvided = slot.status === "available";
                        const isHidden = slot.status === "hidden";
                        const isPast = new Date(slot.end) < new Date();
                        const mode = pg.availabilityMode || "open";
                        
                        return (
                          <div key={idx} style={{ 
                            padding: "0.8rem 1rem", 
                            background: isTaken ? "rgba(249,115,22,0.05)" : isBlocked ? "rgba(239,68,68,0.05)" : isHidden ? "rgba(255,255,255,0.01)" : "rgba(16,185,129,0.05)",
                            border: `1px solid ${isTaken ? "rgba(249,115,22,0.2)" : isBlocked ? "rgba(239,68,68,0.2)" : isHidden ? "var(--c-border)" : "rgba(16,185,129,0.2)"}`,
                            borderRadius: 12,
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            opacity: isPast ? 0.6 : 1
                          }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{slot.time}</div>
                              <div style={{ fontSize: "0.75rem", color: isTaken ? "var(--c-primary)" : isBlocked ? "#f87171" : isHidden ? "var(--c-muted)" : "var(--c-success)" }}>
                                {isTaken ? `Booked by ${slot.bookedBy?.name || "Athlete"}` : isBlocked ? "Blocked" : isHidden ? "Hidden (Closed)" : "Provided (Open)"}
                              </div>
                            </div>
                            {!isTaken && !isPast && (
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                {mode === "manual" ? (
                                  <button 
                                    className={isHidden ? "btn-success" : "btn-ghost"}
                                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem", borderRadius: 8 }}
                                    onClick={() => handleBlock(pg._id, slot, isHidden ? "provide" : "unprovide")}
                                    disabled={refreshing}
                                  >
                                    {isHidden ? "Provide Slot" : "Hide Slot"}
                                  </button>
                                ) : (
                                  <button 
                                    className={isBlocked ? "btn-success" : "btn-danger"}
                                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem", borderRadius: 8 }}
                                    onClick={() => handleBlock(pg._id, slot, isBlocked ? "unblock" : "block")}
                                    disabled={refreshing}
                                  >
                                    {isBlocked ? "Unblock" : "Block"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{ padding: "1rem 1.2rem", background: "rgba(0,0,0,0.1)", fontSize: "0.85rem", fontWeight: 600, color: "var(--c-muted)" }}>
                    All Historical Bookings
                  </div>
                  
                  {bks.length === 0 ? (
                    <div style={{ padding: "1.5rem", color: "var(--c-muted)", textAlign: "center", fontStyle: "italic", fontSize: "0.9rem" }}>
                      No one has booked {pg.name} yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Booked By</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bks.map(book => {
                            const startDate = new Date(book.startTime);
                            const endDate = new Date(book.endTime);
                            const dateStr = startDate.toLocaleDateString();
                            const timeStr = `${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                            
                            const isPast = endDate < new Date();
                            const displayStatus = book.status === "cancelled" ? "Cancelled" : (isPast ? "Past" : "Active");
                            const statusBadge = book.status === "cancelled" ? "danger" : (isPast ? "rejected" : "accepted");

                            return (
                              <tr key={book._id}>
                                <td style={{ fontWeight: 600 }}>
                                  {book.bookedBy?.name || "Unknown User"}
                                  <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", fontWeight: 400 }}>{book.bookedBy?.email}</div>
                                </td>
                                <td>{dateStr}</td>
                                <td style={{ color: "var(--c-muted)", fontSize: "0.85rem" }}>{timeStr}</td>
                                <td>
                                  <span className={`badge badge-${statusBadge}`}>
                                    {displayStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
