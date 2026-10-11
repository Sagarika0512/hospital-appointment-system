import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

    // Initialize user and token from localStorage so login survives page refresh
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem("token");
            const stored = localStorage.getItem("user");
            if (!token || !stored) {
                return null;
            }
            return JSON.parse(stored);
        } catch {
            return null;
        }
    });

    // Call this after a successful login.
    // userData includes: name, email, role, patientId (null for ADMIN).
    const loginUser = (userData, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    // Call this to log out
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    const isAuthenticated = Boolean(user && localStorage.getItem("token"));

    return (
        <AuthContext.Provider value={{ user, setUser, loginUser, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}