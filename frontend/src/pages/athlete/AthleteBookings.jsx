import { useEffect, useState } from "react";
import { Loader2, CalendarClock, XCircle, AlertCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [canceling, setCanceling] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const fetchBookings = () => {
    fetch(`${API}/api/booking/my-bookings`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => showMsg("error", "Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if(!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCanceling(id);
    try {
      const res = await fetch(`${API}/api/booking/cancel/${id}`, {
        method: "PUT", credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Booking cancelled.");
        // locally update status
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: "cancelled" } : b));
      } else {
        showMsg("error", data.message || "Failed to cancel.");
      }
    } catch { showMsg("error", "Network error."); }
    finally { setCanceling(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Bookings</h1>
          <p>Manage your active playground reservations</p>
        </div>
        <div>
          <Link to="/athlete/playgrounds" className="btn-primary">
            <Calendar size={16} /> Book Playground
          </Link>
        </div>
      </div>

      <div className="page-body">
        {msg && <div className={`alert alert-${msg.type}`}><AlertCircle size={15}/> {msg.text}</div>}

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
             <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading your bookings...</div>
          ) : bookings.length === 0 ? (
             <div className="empty-state">
              <CalendarClock size={40} />
              <p>You have no playground bookings.</p>
              <Link to="/athlete/playgrounds" className="btn-primary" style={{ marginTop: "1rem" }}><Calendar size={15}/> Find Playgrounds</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Playground</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(book => {
                    const startDate = new Date(book.startTime);
                    const endDate = new Date(book.endTime);
                    const dateStr = startDate.toLocaleDateString();
                    const timeStr = `${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                    
                    const isCancelled = book.status === "cancelled";
                    const isPast = endDate < new Date();

                    return (
                      <tr key={book._id}>
                        <td style={{ fontWeight: 600 }}>{book.playground?.name || "Unknown Playground"}</td>
                        <td>{dateStr}</td>
                        <td style={{ color: "var(--c-muted)", fontSize: "0.85rem" }}>{timeStr}</td>
                        <td>
                          <span className={`badge badge-${book.status || (isPast ? "rejected" : "accepted")}`}>
                            {book.status || (isPast ? "Past" : "Active")}
                          </span>
                        </td>
                        <td>
                          {!isCancelled && !isPast && (
                            <button 
                              className="btn-danger" 
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                              onClick={() => handleCancel(book._id)}
                              disabled={canceling === book._id}
                            >
                              {canceling === book._id ? <Loader2 size={12} className="spinner-icon"/> : <XCircle size={12}/>} Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
