import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const { setIsAuth } = useAuth();

    const [user, setUser] = useState(null);

    // 🔥 Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/auth/me`, {
                    withCredentials: true,
                });
                setUser(res.data.user);
            } catch (error) {
                console.error(error);
                navigate("/login"); // fallback safety
            }
        };

        fetchUser();
    }, [backendUrl, navigate]);

    // 🔥 Logout
    const handleLogout = async () => {
        try {
            await axios.post(`${backendUrl}/api/auth/logout`, {}, {
                withCredentials: true
            });
            setIsAuth(false);
            navigate("/login", { replace: true });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ padding: "40px", fontFamily: "Arial" }}>
            <h1>Home Page</h1>

            {user ? (
                <>
                    <p><b>Name:</b> {user.name}</p>
                    <p><b>Email:</b> {user.email}</p>
                    <p><b>Role:</b> {user.role}</p>
                </>
            ) : (
                <p>Loading user...</p>
            )}

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}
