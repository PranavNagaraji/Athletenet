import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, UserCheck, Trophy, MessageSquare,
  MapPin, LogOut, ChevronRight, Building2, CalendarClock,
  TrendingUp, Menu, X, ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";
import "./ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/club/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/club/profile", icon: Building2, label: "Club Profile" },
    ],
  },
  {
    label: "Roster",
    items: [
      { to: "/club/members", icon: Users, label: "Members" },
      { to: "/club/join-requests", icon: UserCheck, label: "Join Requests", isBadge: true },
      { to: "/club/teams", icon: ShieldCheck, label: "Teams" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/club/playgrounds", icon: MapPin, label: "Playgrounds" },
      { to: "/club/bookings", icon: CalendarClock, label: "Bookings" },
      { to: "/club/tournaments", icon: Trophy, label: "Tournaments" },
    ],
  },
  {
    label: "Engage",
    items: [
      { to: "/club/chat", icon: MessageSquare, label: "Communications" },
      { to: "/club/feed", icon: TrendingUp, label: "Social Feed" },
      { to: "/club/talent", icon: UserCheck, label: "Discover Talent" },
    ],
  },
];

export default function ClubLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clubBranding, setClubBranding] = useState({ name: "", profilePic: "" });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

    fetch(`${API}/api/join-request/all-requests`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setPendingCount(arr.filter((item) => item.status === "pending").length);
      })
      .catch(() => {});
  }, [user]);

  // Close sidebar on route change for mobile only
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const toggleDesktop = () => setIsDesktopCollapsed((prev) => !prev);

  const displayName = clubBranding.name || user?.name || "Official Club";
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
          <NotificationBell role="club" />
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
              <span className="logo-icon"><Building2 size={18} /></span>
              <div>
                <span className="logo-text">AthleteNet</span>
                <div className="logo-portal-badge">Club Portal</div>
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
        <nav className="sidebar-nav" aria-label="Club navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-nav-group">
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map(({ to, icon: Icon, label, isBadge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon"><Icon size={17} /></span>
                  <span className="sidebar-link-text">{label}</span>
                  {isBadge && pendingCount > 0 ? (
                    <span className="nav-badge">{pendingCount}</span>
                  ) : (
                    <ChevronRight size={14} className="link-arrow" />
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {clubBranding.profilePic ? (
                <img
                  src={`${API}${clubBranding.profilePic}`}
                  alt="Club avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{avatarLetter}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">Club Manager</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="club-main">
        <div className="animate-slide-up stagger-2" style={{ flex: 1, minHeight: "100%", display: "flex", flexDirection: "column" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
