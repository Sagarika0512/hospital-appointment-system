import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
    const { user } = useContext(AuthContext);

    return (
        <nav>
            <Link to="/">Login</Link> |{" "}
            <Link to="/register">Register</Link> |{" "}
            <Link to="/doctors">Doctors</Link> |{" "}
            <Link to="/book-appointment">Book Appointment</Link> |{" "}
            <Link to="/appointments">Appointments</Link>

            {user && <span> | Welcome, {user.name}!</span>}
        </nav>

        
        
    );
}

export default Navbar;