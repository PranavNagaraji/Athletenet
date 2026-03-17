import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute() {
    const { isAuth, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    return isAuth ? <Navigate to="/home" replace /> : <Outlet />;
}