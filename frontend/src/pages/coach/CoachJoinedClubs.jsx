import { useEffect, useState } from "react";
import { AlertCircle, Compass, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

function SkeletonClubCard() {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.25rem" }}>
      <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
        <div className="skeleton skeleton-circle" style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "grid", gap: "0.4rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          <div className="skeleton skeleton-text-sm" style={{ width: "85%" }} />
        </div>
      </div>
      <div className="skeleton skeleton-text-sm" style={{ width: "90%" }} />
      <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
    </div>
  );
}

export default function CoachJoinedClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/coach/me`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (data && Array.isArray(data.clubs)) {
          setClubs(data.clubs);
        } else {
          setClubs([]);
        }
      })
      .catch(() => setError("Unable to load joined clubs. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow"><Compass size={10} /> My Clubs</div>
          <h1>Joined Clubs</h1>
          <p>Review the clubs you coach for and continue managing your active club relationships.</p>
        </div>
      </div>

      <div className="page-body stack-lg">
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="entity-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonClubCard key={index} />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Compass size={24} /></div>
            <h3>No joined clubs yet</h3>
            <p>Browse available clubs to find the right organizations for your coaching experience.</p>
            <Link to="/coach/clubs" className="btn-primary" style={{ marginTop: "0.75rem" }}>
              <Compass size={15} /> Browse Clubs
            </Link>
          </div>
        ) : (
          <div className="entity-grid">
            {clubs.map((club) => {
              const clubName = club.name || club.admin?.name || "Club";
              const specialization = club.specialization || "Multi-sport club";
              const established = club.establishedYear ? `Established ${club.establishedYear}` : "New club";
              const facilities = Array.isArray(club.facilities) ? club.facilities.filter(Boolean) : [];

              return (
                <div key={club._id} className="card entity-card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div className="avatar-badge round" style={{ width: 56, height: 56, display: "grid", placeItems: "center", fontSize: "1.3rem" }}>
                      {clubName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3>{clubName}</h3>
                      <div className="entity-subtitle">{specialization}</div>
                    </div>
                  </div>

                  <div className="detail-pills" style={{ marginBottom: "1rem" }}>
                    <span className="pill pill-primary">{specialization}</span>
                    <span className="meta-pill">{established}</span>
                    {facilities.length > 0 && <span className="meta-pill">{facilities.length} facilities</span>}
                  </div>

                  <p style={{ color: "var(--theme-muted)", lineHeight: 1.7 }}>
                    {club.description || "This club is part of your active coaching network. Use the club page to coordinate with players and staff."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
