import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, UserRound, Compass, Send, LogOut, ChevronRight, Activity, Users, MessageSquare, MapPin, CalendarClock, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const navItems = [
  { to: "/athlete/dashboard", icon: LayoutDashboard, label: "Dashboard"      },
  { to: "/athlete/feed",      icon: Activity,        label: "Social Feed"    },
  { to: "/athlete/tournaments",icon: Trophy,          label: "Tournaments"    },
  { to: "/athlete/profile",   icon: UserRound,       label: "My Profile"     },
  { to: "/athlete/clubs",     icon: Compass,         label: "Browse Clubs"   },
  { to: "/athlete/teams",     icon: MessageSquare,   label: "Messenger & Teams" },
  { to: "/athlete/requests",   icon: Send,            label: "My Requests"    },
  { to: "/athlete/playgrounds",icon: MapPin,          label: "Book Turf"      },
  { to: "/athlete/bookings",   icon: CalendarClock,   label: "My Bookings"    },
];

export default function AthleteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="club-shell">
      {/* ── Sidebar ── */}
      <aside className="club-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon"><Activity size={22} /></span>
          <span className="logo-text">AthleteNet</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }>
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="link-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar" style={{ overflow: "hidden" }}>
              {user?.profilePic ? (
                <img src={`${import.meta.env.VITE_BACKEND_URL}${user.profilePic}`} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}} />
              ) : (
                user?.name?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || "Athlete"}</span>
              <span className="user-role">Athlete</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="club-main">
        <Outlet />
      </main>
    </div>
  );
}
