import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, UserCheck, ClubIcon, Trophy, MessageSquare,
  MapPin, Bell, LogOut, ChevronRight, Building2, CalendarClock, TrendingUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const navItems = [
  { to: "/club/dashboard",    icon: LayoutDashboard, label: "Dashboard"      },
  { to: "/club/profile",      icon: Building2,        label: "Club Profile"   },
  { to: "/club/members",      icon: Users,            label: "Members"        },
  { to: "/club/join-requests",icon: UserCheck,        label: "Join Requests"  },
  { to: "/club/teams",        icon: ClubIcon,         label: "Teams"          },
  { to: "/club/playgrounds",  icon: MapPin,           label: "Playgrounds"    },
  { to: "/club/bookings",     icon: CalendarClock,    label: "Bookings"       },
  { to: "/club/chat",         icon: MessageSquare,    label: "Communications" },
  { to: "/club/feed",         icon: TrendingUp,       label: "Social Feed"    },
  { to: "/club/tournaments",  icon: Trophy,           label: "Tournaments"    },
  { to: "/club/talent",       icon: UserCheck,        label: "Discover Talent"},
];

export default function ClubLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clubBranding, setClubBranding] = useState({ name: "", profilePic: "" });

  useEffect(() => {
    fetch(`${API}/api/club/profile`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d && !d.message) {
          setClubBranding({
            name: d.name || user?.name || "Official Club",
            profilePic: d.profilePic || user?.profilePic || ""
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="club-shell">
      {/* ── Sidebar ── */}
      <aside className="club-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon"><Building2 size={22} /></span>
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
            <div className="user-avatar" style={{ border: "1px solid var(--c-border)", background: "var(--c-surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {clubBranding.profilePic ? (
                <img src={`${API}${clubBranding.profilePic}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontWeight: 600 }}>{clubBranding.name ? clubBranding.name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : "C")}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                {clubBranding.name || user?.name || "Official Club"}
              </span>
              <span className="user-role">Club Manager</span>
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
