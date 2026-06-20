import { useContent } from "react";
import { AuthContext } from "../context/AuthContext";


function ProtectedRoute() {

    const { user } = useContent(AuthContext);

    if(!user){
        return <h1>Please Login</h1>
    }

    return <h1>Protected Route</h1>
}

export default ProtectedRoute;