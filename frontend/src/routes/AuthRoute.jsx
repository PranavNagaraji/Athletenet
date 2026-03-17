import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthRoute() {
    const { isAuth, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}