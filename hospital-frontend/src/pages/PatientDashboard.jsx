import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAppointments } from "../services/appointmentService";
import { getDoctors } from "../services/doctorService";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardBody } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "../components/ui/Table";
import { SkeletonCard, SkeletonTable } from "../components/feedback/Skeleton";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import {
  CalendarIcon,
  ClockIcon,
  StethoscopeIcon,
  UserIcon,
} from "../components/ui/Icons";

// Helper: format "YYYY-MM-DD" -> "MMM D, YYYY"
function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Helper: format "HH:mm:ss" -> "h:mm A"
function formatTime(timeString) {
  if (!timeString) return "—";
  try {
    const parts = timeString.split(":");
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

// Helper: checks if appointment date/time is in the future
function isFutureAppointment(dateStr, timeStr) {
  if (!dateStr) return false;
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    let h = 0, m = 0, s = 0;
    if (timeStr) {
      const parts = timeStr.split(":").map(Number);
      h = parts[0] || 0;
      m = parts[1] || 0;
      s = parts[2] || 0;
    }
    const aptDateTime = new Date(year, month - 1, day, h, m, s);
    return aptDateTime >= new Date();
  } catch {
    return false;
  }
}

export function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [isMultiPage, setIsMultiPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state for appointment history
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch: appointments (JWT-scoped) + doctors directory (capped at backend max 50)
      const [appointmentsData, doctorsData] = await Promise.all([
        getAppointments(0, 50),
        getDoctors(0, 50),
      ]);

      const aptList = Array.isArray(appointmentsData)
        ? appointmentsData
        : appointmentsData?.content || [];

      const docList = Array.isArray(doctorsData)
        ? doctorsData
        : doctorsData?.content || [];

      // Extract accurate totalElements from PagedResponse metadata
      const totalCount = typeof appointmentsData?.totalElements === "number"
        ? appointmentsData.totalElements
        : aptList.length;

      const totalBackendPages = appointmentsData?.totalPages || 1;

      setAppointments(aptList);
      setDoctors(docList);
      setTotalAppointments(totalCount);
      setIsMultiPage(totalBackendPages > 1);
    } catch (err) {
      console.error("Failed to load patient dashboard data:", err);
      setError("Unable to retrieve your healthcare records. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Doctor specialization resolver matching doctor directory
  const getDoctorSpecialty = (doctorName) => {
    if (!doctorName) return "Specialist";
    const cleanTarget = doctorName.toLowerCase().replace(/^dr\.?\s+/i, "").trim();
    for (const doc of doctors) {
      const cleanDoc = (doc.name || "").toLowerCase().replace(/^dr\.?\s+/i, "").trim();
      if (cleanDoc === cleanTarget || doc.name?.toLowerCase() === doctorName.toLowerCase()) {
        return doc.specialization || "Specialist";
      }
    }
    return "Specialist";
  };

  // ── 1. Calculate Summary Metrics (100% Real Patient Data) ──
  // Metric 1: Total Appointments (derived from PagedResponse.totalElements)

  // Metric 2: Upcoming Appointments (Future date/time + status !== CANCELLED and !== COMPLETED)
  const upcomingList = appointments
    .filter((a) => a.status === "SCHEDULED" && isFutureAppointment(a.appointmentDate, a.appointmentTime))
    .sort((a, b) => {
      const dtA = new Date(`${a.appointmentDate}T${a.appointmentTime || "00:00:00"}`);
      const dtB = new Date(`${b.appointmentDate}T${b.appointmentTime || "00:00:00"}`);
      return dtA - dtB;
    });

  const upcomingCount = upcomingList.length;

  // Metric 3: Doctors Consulted (Unique doctor names in history)
  const uniqueDoctorNames = new Set(
    appointments.map((a) => a.doctorName).filter(Boolean)
  );
  const doctorsConsultedCount = uniqueDoctorNames.size;

  // Most immediate upcoming appointment
  const nextAppointment = upcomingList.length > 0 ? upcomingList[0] : null;

  // ── 2. Pagination for Appointment History Table ──
  const totalPages = Math.ceil(appointments.length / pageSize) || 1;
  const paginatedHistory = appointments.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="cp-dashboard-container">
        <PageHeader
          title={`Welcome back, ${user?.name || "Patient"}`}
          description="Access your scheduled consultations and medical appointment history."
        />

        {/* 3 StatCard Skeletons */}
        <div className="cp-stats-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Upcoming Section Skeleton */}
        <div className="cp-dashboard-section">
          <SkeletonCard />
        </div>

        {/* Table Skeleton */}
        <div className="cp-dashboard-section">
          <SkeletonTable rows={5} columns={5} />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="cp-dashboard-container">
        <PageHeader
          title={`Welcome back, ${user?.name || "Patient"}`}
          description="CarePulse Hospital Management System"
        />
        <ErrorState
          title="Failed to Load Dashboard"
          description={error}
          onRetry={loadDashboardData}
          retryLabel="Reload Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="cp-dashboard-container">
      {/* ── Page Header ── */}
      <PageHeader
        title={`Welcome back, ${user?.name || "Patient"}`}
        description="Review your upcoming medical appointments and specialist consultation history."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate("/book-appointment")}
          >
            Book Appointment
          </Button>
        }
      />

      {/* ── 3 Summary Stat Cards ── */}
      <section className="cp-stats-grid" aria-label="Appointment Summary Metrics">
        <StatCard
          title="Total Appointments"
          value={totalAppointments}
          subtitle={isMultiPage ? "Total records in system" : "All consultations recorded"}
          icon={<CalendarIcon size={22} />}
          variant="primary"
        />

        <StatCard
          title="Upcoming Appointments"
          value={upcomingCount}
          subtitle={
            isMultiPage
              ? `${upcomingCount} scheduled (loaded records)`
              : upcomingCount === 1
              ? "1 scheduled visit"
              : `${upcomingCount} scheduled visits`
          }
          icon={<ClockIcon size={22} />}
          variant="warning"
        />

        <StatCard
          title="Doctors Consulted"
          value={doctorsConsultedCount}
          subtitle={
            isMultiPage
              ? `${doctorsConsultedCount} specialists (loaded records)`
              : doctorsConsultedCount === 1
              ? "1 medical specialist"
              : `${doctorsConsultedCount} medical specialists`
          }
          icon={<StethoscopeIcon size={22} />}
          variant="success"
        />
      </section>

      {/* ── Upcoming Appointment Section ── */}
      <section className="cp-dashboard-section" aria-label="Upcoming Appointment">
        <div className="cp-section-header">
          <div>
            <h2 className="cp-section-title">Upcoming Appointment</h2>
            <p className="cp-section-subtitle">Your next scheduled consultation</p>
          </div>
        </div>

        {nextAppointment ? (
          <div className="cp-upcoming-card">
            <div className="cp-upcoming-header">
              <div className="cp-upcoming-doctor">
                <div className="cp-doctor-avatar" aria-hidden="true">
                  <UserIcon size={24} />
                </div>
                <div className="cp-doctor-info">
                  <span className="cp-doctor-name">
                    {nextAppointment.doctorName ? `Dr. ${nextAppointment.doctorName}` : "Doctor Assigned"}
                  </span>
                  <span className="cp-doctor-specialty">
                    {getDoctorSpecialty(nextAppointment.doctorName)}
                  </span>
                </div>
              </div>

              <StatusBadge status={nextAppointment.status} />
            </div>

            {/* Date & Time Metadata */}
            <div className="cp-upcoming-meta">
              <div className="cp-meta-item">
                <CalendarIcon size={16} aria-hidden="true" />
                <span>Date: <strong>{formatDate(nextAppointment.appointmentDate)}</strong></span>
              </div>
              <div className="cp-meta-item">
                <ClockIcon size={16} aria-hidden="true" />
                <span>Time: <strong>{formatTime(nextAppointment.appointmentTime)}</strong></span>
              </div>
            </div>

            {/* Reason if provided */}
            {nextAppointment.reason && (
              <div className="cp-upcoming-reason">
                <strong>Reason for Visit:</strong> {nextAppointment.reason}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                icon={<ClockIcon size={32} />}
                title="No Upcoming Appointments"
                description="You currently have no scheduled appointments. Browse available doctors to book a consultation."
                action={
                  <Button variant="outline" size="md" onClick={() => navigate("/doctors")}>
                    Find a Doctor
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )}
      </section>

      {/* ── Appointment History Section ── */}
      <section className="cp-dashboard-section" aria-label="Appointment History">
        <div className="cp-section-header">
          <div>
            <h2 className="cp-section-title">Appointment History</h2>
            <p className="cp-section-subtitle">Complete log of all past and scheduled visits</p>
          </div>
        </div>

        {appointments.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell style={{ fontWeight: "var(--cp-font-weight-semibold)", color: "var(--cp-text-primary)" }}>
                      {apt.doctorName ? `Dr. ${apt.doctorName}` : "Doctor"}
                    </TableCell>
                    <TableCell style={{ color: "var(--cp-text-secondary)" }}>
                      {getDoctorSpecialty(apt.doctorName)}
                    </TableCell>
                    <TableCell>{formatDate(apt.appointmentDate)}</TableCell>
                    <TableCell>{formatTime(apt.appointmentTime)}</TableCell>
                    <TableCell style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {apt.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div style={{ padding: "0 1.25rem" }}>
                <Pagination
                  pageNo={currentPage}
                  totalPages={totalPages}
                  totalElements={appointments.length}
                  pageSize={pageSize}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}

            {isMultiPage && (
              <div style={{ padding: "0.5rem 1.25rem 1rem", fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-muted)" }}>
                Displaying the 50 most recent appointments on dashboard. Full archive available in{" "}
                <button
                  type="button"
                  onClick={() => navigate("/appointments")}
                  style={{ color: "var(--cp-primary)", textDecoration: "underline", background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer" }}
                >
                  My Appointments
                </button>.
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                icon={<CalendarIcon size={32} />}
                title="No Appointment History"
                description="You haven't scheduled any appointments yet. Consult with medical specialists across departments."
                action={
                  <Button variant="primary" size="md" onClick={() => navigate("/doctors")}>
                    Find Doctors
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )}
      </section>
    </div>
  );
}

export default PatientDashboard;
