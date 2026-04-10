import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, UserRound, Compass, Send, LogOut,
  ChevronRight, Activity, Users, Menu, X,
  CalendarClock, Trophy, TrendingUp, Star, ClipboardList
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";
import "../club/ClubLayout.css";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/coach/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/coach/profile", icon: UserRound, label: "My Profile" },
    ],
  },
  {
    label: "Coaching Tools",
    items: [
      { to: "/coach/teams", icon: Users, label: "Coaching Hub" },
      { to: "/coach/training", icon: CalendarClock, label: "Training Sessions" },
      { to: "/coach/performance", icon: Star, label: "Player Performance" },
      { to: "/coach/events", icon: Trophy, label: "Match & Events" },
      { to: "/coach/athletes", icon: TrendingUp, label: "Browse Athletes" },
      { to: "/coach/tasks", icon: ClipboardList, label: "My Tasks" },
    ],
  },
  {
    label: "Discovery",
    items: [
      { to: "/coach/clubs", icon: Compass, label: "Browse Clubs" },
      { to: "/coach/requests", icon: Send, label: "My Requests" },
    ],
  },
];

export default function CoachLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const toggleDesktop = () => setIsDesktopCollapsed((prev) => !prev);

  const displayName = user?.name || "Coach";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className={`club-shell ${isMobileOpen ? "sidebar-open" : ""} ${isDesktopCollapsed ? "sidebar-collapsed" : ""}`}>

      {/* App Topbar */}
      <div className="app-topbar animate-slide-up stagger-1">
        <div className="app-topbar-left">
          <button className="mobile-menu-btn hidden-desktop" onClick={toggleMobile} aria-label="Toggle mobile menu">
            <Menu size={20} />
          </button>
          <button className="mobile-menu-btn hidden-mobile" onClick={toggleDesktop} aria-label="Toggle desktop menu">
            <Menu size={20} />
          </button>
          <span className="mobile-logo-text hidden-desktop">AthleteNet</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <NotificationBell role="coach" />
          <ThemeToggle compact />
        </div>
      </div>

      {/* Mobile overlay */}
      <div className="sidebar-overlay" onClick={toggleMobile} role="presentation" />

      {/* Sidebar */}
      <aside className="club-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-row">
            <div className="logo-lockup">
              <span className="logo-icon"><Activity size={18} /></span>
              <div>
                <span className="logo-text">AthleteNet</span>
                <div className="logo-portal-badge">Coach Portal</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <button className="mobile-close-btn hidden-desktop" onClick={toggleMobile} aria-label="Close menu">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Coach navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-nav-group">
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon"><Icon size={17} /></span>
                  <span className="sidebar-link-text">{label}</span>
                  <ChevronRight size={14} className="link-arrow" />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.profilePic ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${user.profilePic}`}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{avatarLetter}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">Coach</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="club-main">
        <div className="animate-slide-up stagger-2" style={{ minHeight: "100%" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
