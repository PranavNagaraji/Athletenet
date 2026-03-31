import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, UserCheck, ClubIcon, Trophy, MessageSquare,
  MapPin, LogOut, ChevronRight, Building2, CalendarClock, TrendingUp, Menu, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import "./ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const navItems = [
  { to: "/club/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/club/profile", icon: Building2, label: "Club Profile" },
  { to: "/club/members", icon: Users, label: "Members" },
  { to: "/club/join-requests", icon: UserCheck, label: "Join Requests" },
  { to: "/club/teams", icon: ClubIcon, label: "Teams" },
  { to: "/club/playgrounds", icon: MapPin, label: "Playgrounds" },
  { to: "/club/bookings", icon: CalendarClock, label: "Bookings" },
  { to: "/club/chat", icon: MessageSquare, label: "Communications" },
  { to: "/club/feed", icon: TrendingUp, label: "Social Feed" },
  { to: "/club/tournaments", icon: Trophy, label: "Tournaments" },
  { to: "/club/talent", icon: UserCheck, label: "Discover Talent" },
];

export default function ClubLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clubBranding, setClubBranding] = useState({ name: "", profilePic: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  useEffect(() => {
    fetch(`${API}/api/club/profile`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.message) {
          setClubBranding({
            name: d.name || user?.name || "Official Club",
            profilePic: d.profilePic || user?.profilePic || "",
          });
        }
      })
      .catch(() => {});
  }, [user]);

  // Close sidebar on route change for mobile only (desktop keeps it open)
  useEffect(() => {
    if (window.innerWidth < 1025) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`club-shell ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile Top Navbar */}
      <div className="mobile-topbar animate-slide-up stagger-1">
        <div className="mobile-topbar-left">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <span className="mobile-logo-text">AthleteNet</span>
        </div>
        <ThemeToggle compact />
      </div>

      {/* Overlay for mobile sidebar */}
      <div className="sidebar-overlay" onClick={toggleSidebar}></div>

      {/* Sidebar */}
      <aside className="club-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-row">
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <span className="logo-icon"><Building2 size={24} /></span>
              <span className="logo-text">AthleteNet</span>
            </div>
            <button className="mobile-close-btn" onClick={toggleSidebar}>
              <X size={24} />
            </button>
            <div className="hidden lg:block ml-auto"><ThemeToggle compact /></div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Icon size={20} />
              <span>{label}</span>
              <ChevronRight size={16} className="link-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {clubBranding.profilePic ? (
                <img src={`${API}${clubBranding.profilePic}`} alt="club avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <span style={{ fontWeight: 800 }}>{clubBranding.name ? clubBranding.name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : "C")}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">
                {clubBranding.name || user?.name || "Official Club"}
              </span>
              <span className="user-role">Club Manager</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="club-main">
        <div className="animate-slide-up stagger-2" style={{ flex: 1, minHeight: "100%", display: "flex", flexDirection: "column" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
