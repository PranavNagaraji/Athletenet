import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Redirect the user to their role-specific dashboard
export default function HomePage() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;
        if (!user) { navigate("/login", { replace: true }); return; }

        const roleRoutes = {
            club: "/club/dashboard",
            athlete: "/athlete/dashboard",
            coach: "/coach/dashboard",
        };
        navigate(roleRoutes[user.role] || "/login", { replace: true });
    }, [user, isLoading, navigate]);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--theme-bg)", color: "var(--theme-muted)", fontFamily: "var(--font-ui)" }}>
            Redirecting to your dashboard...
        </div>
    );
}
