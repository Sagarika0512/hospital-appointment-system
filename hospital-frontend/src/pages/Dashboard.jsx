import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { PatientDashboard } from "./PatientDashboard";
import { AdminDashboard } from "./AdminDashboard";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";

  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Render the authenticated Patient Dashboard
  return <PatientDashboard />;
}


export default Dashboard;
