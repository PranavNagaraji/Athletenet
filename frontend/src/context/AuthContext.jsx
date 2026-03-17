import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [isAuth, setIsAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            await axios.get(`${backendUrl}/api/auth/me`, {
                withCredentials: true,
            });
            setIsAuth(true);
            return true;
        } catch {
            setIsAuth(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [backendUrl]);

    return (
        <AuthContext.Provider value={{ isAuth, isLoading, checkAuth, setIsAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

// safer hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
};
