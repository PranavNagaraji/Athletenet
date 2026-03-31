import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { LayoutDashboard, UserRound, Compass, Send, LogOut, ChevronRight, Activity, Users, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import "../club/ClubLayout.css";

const navItems = [
  { to: "/coach/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/coach/profile", icon: UserRound, label: "My Profile" },
  { to: "/coach/clubs", icon: Compass, label: "Browse Clubs" },
  { to: "/coach/teams", icon: Users, label: "My Teams" },
  { to: "/coach/requests", icon: Send, label: "My Requests" },
];

export default function CoachLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

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
              <span className="logo-icon"><Activity size={24} /></span>
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
            <div className="user-avatar" style={{ overflow: "hidden" }}>
              {user?.profilePic ? (
                <img src={`${import.meta.env.VITE_BACKEND_URL}${user.profilePic}`} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                user?.name?.[0]?.toUpperCase() || "C"
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || "Coach"}</span>
              <span className="user-role">Coach</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="club-main">
        <div className="animate-slide-up stagger-2" style={{ minHeight: "100%" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
