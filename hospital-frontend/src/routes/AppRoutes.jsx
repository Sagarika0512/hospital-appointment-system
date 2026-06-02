import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Doctors from "../pages/Doctors";
import Appointments from "../pages/Appointments";
import BookAppointment from "../pages/BookAppointment";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/book-appointment" element={<BookAppointment />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;