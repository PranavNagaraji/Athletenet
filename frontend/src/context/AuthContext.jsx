import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
const API = import.meta.env.VITE_BACKEND_URL || "";

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth]     = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser]         = useState(null);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsAuth(true);
                return true;
            } else {
                setUser(null);
                setIsAuth(false);
                return false;
            }
        } catch {
            setUser(null);
            setIsAuth(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
        setUser(null);
        setIsAuth(false);
    };

    useEffect(() => { checkAuth(); }, []);

    return (
        <AuthContext.Provider value={{ isAuth, isLoading, user, checkAuth, logout, setIsAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};
