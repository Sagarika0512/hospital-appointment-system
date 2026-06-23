import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const logout = () => {
        setUser(null);
    };

    console.log(user);

    return(
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}