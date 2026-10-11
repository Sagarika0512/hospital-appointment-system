import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useContext(AuthContext);
    const token = localStorage.getItem("token");

    if (!user || !token) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (user.role || "").replace("ROLE_", "");
        const isAllowed = allowedRoles.some(
            (r) => r.replace("ROLE_", "") === userRole
        );
        if (!isAllowed) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;