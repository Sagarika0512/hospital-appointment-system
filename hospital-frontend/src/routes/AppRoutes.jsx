import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { AppShell } from "../components/layout/AppShell";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Doctors from "../pages/Doctors";
import Appointments from "../pages/Appointments";
import BookAppointment from "../pages/BookAppointment";
import Patients from "../pages/Patients";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes (Outside AppShell) */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Application Routes (Wrapped in AppShell) */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Patients />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;