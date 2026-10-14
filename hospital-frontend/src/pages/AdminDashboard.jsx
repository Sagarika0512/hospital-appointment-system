import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../services/doctorService";
import { getPatients } from "../services/patientService";
import { getAppointments } from "../services/appointmentService";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";
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
  StethoscopeIcon,
  UsersIcon,
  ChevronRightIcon,
} from "../components/ui/Icons";

/**
 * Helper: format "YYYY-MM-DD" -> "MMM D, YYYY"
 */
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

/**
 * Helper: format "HH:mm:ss" or "HH:mm" -> "h:mm A"
 */
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

/**
 * Ensures "Dr." prefix is formatted cleanly for display.
 */
function formatDoctorName(name) {
  if (!name) return "Doctor";
  const trimmed = name.trim();
  return trimmed.toLowerCase().startsWith("dr.") ? trimmed : `Dr. ${trimmed}`;
}

export function AdminDashboard() {
  const navigate = useNavigate();

  // Metrics State
  const [totalDoctors, setTotalDoctors] = useState(null);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(null);

  const [totalPatients, setTotalPatients] = useState(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState(null);

  const [totalAppointments, setTotalAppointments] = useState(null);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);

  // Recent Appointments State
  const [recentAppointments, setRecentAppointments] = useState([]);

  // 1. Fetch Total Doctors
  const loadDoctorsCount = async () => {
    setDoctorsLoading(true);
    setDoctorsError(null);
    try {
      const response = await getDoctors(0, 1);
      const total = typeof response?.totalElements === "number"
        ? response.totalElements
        : Array.isArray(response)
        ? response.length
        : response?.content?.length || 0;
      setTotalDoctors(total);
    } catch (err) {
      console.error("Failed to load doctor count:", err);
      setDoctorsError("Failed to load doctor metrics");
    } finally {
      setDoctorsLoading(false);
    }
  };

  // 2. Fetch Total Patients
  const loadPatientsCount = async () => {
    setPatientsLoading(true);
    setPatientsError(null);
    try {
      const response = await getPatients(0, 1);
      const total = typeof response?.totalElements === "number"
        ? response.totalElements
        : Array.isArray(response)
        ? response.length
        : response?.content?.length || 0;
      setTotalPatients(total);
    } catch (err) {
      console.error("Failed to load patient count:", err);
      setPatientsError("Failed to load patient metrics");
    } finally {
      setPatientsLoading(false);
    }
  };

  // 3. Fetch Appointments (Metadata Total + Recent List)
  const loadAppointmentsData = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      // Request top 8 recent appointments sorted by appointmentDate descending
      const response = await getAppointments(0, 8, "appointmentDate", "desc");
      const total = typeof response?.totalElements === "number"
        ? response.totalElements
        : Array.isArray(response)
        ? response.length
        : response?.content?.length || 0;

      const list = Array.isArray(response)
        ? response
        : response?.content || [];

      setTotalAppointments(total);
      setRecentAppointments(list);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setAppointmentsError("Unable to retrieve appointment activity from server");
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorsCount();
    loadPatientsCount();
    loadAppointmentsData();
  }, []);

  // Compute status distribution from safely retrieved recent appointments
  const statusStats = (() => {
    const total = recentAppointments.length;
    let scheduled = 0;
    let completed = 0;
    let cancelled = 0;

    recentAppointments.forEach((apt) => {
      const status = (apt.status || "").toUpperCase();
      if (status === "SCHEDULED") scheduled++;
      else if (status === "COMPLETED") completed++;
      else if (status === "CANCELLED") cancelled++;
    });

    const scheduledPct = total > 0 ? Math.round((scheduled / total) * 100) : 0;
    const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      scheduledPct,
      completedPct,
      cancelledPct,
    };
  })();

  return (
    <div className="cp-dashboard-container">
      {/* ── Page Header ── */}
      <PageHeader
        title="Admin Dashboard"
        description="Overview of hospital clinical operations, physician staff, and patient appointment activity."
      />

      {/* ── Section 1: Summary Metric Cards (Total Doctors, Total Patients, Total Appointments) ── */}
      <section className="cp-stats-grid" aria-label="Hospital Overview Metrics">
        {/* Total Doctors */}
        {doctorsLoading ? (
          <SkeletonCard />
        ) : doctorsError ? (
          <Card>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-danger)" }}>{doctorsError}</span>
                <Button variant="outline" size="xs" onClick={loadDoctorsCount}>Retry</Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <StatCard
            title="Total Doctors"
            value={totalDoctors !== null ? totalDoctors : "—"}
            subtitle="Registered medical specialists"
            icon={<StethoscopeIcon size={22} />}
            variant="primary"
            id="stat-total-doctors"
          />
        )}

        {/* Total Patients */}
        {patientsLoading ? (
          <SkeletonCard />
        ) : patientsError ? (
          <Card>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-danger)" }}>{patientsError}</span>
                <Button variant="outline" size="xs" onClick={loadPatientsCount}>Retry</Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <StatCard
            title="Total Patients"
            value={totalPatients !== null ? totalPatients : "—"}
            subtitle="Registered patient profiles"
            icon={<UsersIcon size={22} />}
            variant="success"
            id="stat-total-patients"
          />
        )}

        {/* Total Appointments */}
        {appointmentsLoading ? (
          <SkeletonCard />
        ) : appointmentsError ? (
          <Card>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-danger)" }}>{appointmentsError}</span>
                <Button variant="outline" size="xs" onClick={loadAppointmentsData}>Retry</Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <StatCard
            title="Total Appointments"
            value={totalAppointments !== null ? totalAppointments : "—"}
            subtitle="All recorded consultations"
            icon={<CalendarIcon size={22} />}
            variant="warning"
            id="stat-total-appointments"
          />
        )}
      </section>

      {/* ── Section 2: Recent Appointments Status Summary ── */}
      <section className="cp-status-distribution-card" aria-label="Recent Appointments Status Summary">
        <div className="cp-distribution-header">
          <div>
            <h3 className="cp-distribution-title">Recent Appointments Status Summary</h3>
            <span className="cp-distribution-scope">
              Scope: Status breakdown of the {statusStats.total} most recent appointments
            </span>
          </div>
        </div>

        {/* Proportional Segment Bar */}
        <div className="cp-distribution-bar" role="progressbar" aria-label="Appointment status distribution percentage">
          {statusStats.total > 0 ? (
            <>
              {statusStats.scheduledPct > 0 && (
                <div
                  className="cp-distribution-segment-scheduled"
                  style={{ width: `${statusStats.scheduledPct}%` }}
                  title={`Scheduled: ${statusStats.scheduled} (${statusStats.scheduledPct}%)`}
                />
              )}
              {statusStats.completedPct > 0 && (
                <div
                  className="cp-distribution-segment-completed"
                  style={{ width: `${statusStats.completedPct}%` }}
                  title={`Completed: ${statusStats.completed} (${statusStats.completedPct}%)`}
                />
              )}
              {statusStats.cancelledPct > 0 && (
                <div
                  className="cp-distribution-segment-cancelled"
                  style={{ width: `${statusStats.cancelledPct}%` }}
                  title={`Cancelled: ${statusStats.cancelled} (${statusStats.cancelledPct}%)`}
                />
              )}
            </>
          ) : (
            <div style={{ width: "100%", backgroundColor: "var(--cp-surface-muted)" }} />
          )}
        </div>

        {/* Distribution Details Legend */}
        <div className="cp-distribution-legend">
          {/* Scheduled */}
          <div className="cp-distribution-item">
            <span className="cp-distribution-dot" style={{ backgroundColor: "var(--cp-warning)" }} aria-hidden="true" />
            <div className="cp-distribution-info">
              <span className="cp-distribution-label">Scheduled</span>
              <div className="cp-distribution-val">
                {statusStats.scheduled}
                <span className="cp-distribution-pct">({statusStats.scheduledPct}%)</span>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="cp-distribution-item">
            <span className="cp-distribution-dot" style={{ backgroundColor: "var(--cp-success)" }} aria-hidden="true" />
            <div className="cp-distribution-info">
              <span className="cp-distribution-label">Completed</span>
              <div className="cp-distribution-val">
                {statusStats.completed}
                <span className="cp-distribution-pct">({statusStats.completedPct}%)</span>
              </div>
            </div>
          </div>

          {/* Cancelled */}
          <div className="cp-distribution-item">
            <span className="cp-distribution-dot" style={{ backgroundColor: "var(--cp-danger)" }} aria-hidden="true" />
            <div className="cp-distribution-info">
              <span className="cp-distribution-label">Cancelled</span>
              <div className="cp-distribution-val">
                {statusStats.cancelled}
                <span className="cp-distribution-pct">({statusStats.cancelledPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Recent Appointments Ledger ── */}
      <section className="cp-dashboard-section" aria-label="Recent Appointments Ledger">
        <Card>
          <CardHeader
            title="Recent Appointments"
            subtitle="Latest scheduled and completed consultations across all hospital departments"
            action={
              <Button
                variant="outline"
                size="sm"
                iconRight={<ChevronRightIcon size={16} />}
                onClick={() => navigate("/appointments")}
                id="view-all-appointments-btn"
              >
                View All Appointments
              </Button>
            }
          />

          <CardBody style={{ padding: 0 }}>
            {appointmentsLoading ? (
              <div style={{ padding: "1.5rem" }}>
                <SkeletonTable rows={5} columns={6} />
              </div>
            ) : appointmentsError ? (
              <div style={{ padding: "1.5rem" }}>
                <ErrorState
                  title="Failed to Load Recent Appointments"
                  description={appointmentsError}
                  onRetry={loadAppointmentsData}
                  retryLabel="Retry Loading"
                />
              </div>
            ) : recentAppointments.length === 0 ? (
              <div style={{ padding: "1.5rem" }}>
                <EmptyState
                  icon={<CalendarIcon size={36} />}
                  title="No Appointments on Record"
                  description="There are currently no appointments registered in the hospital management system."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/appointments")}
                    >
                      Open Appointments Ledger
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Desktop View Table (>= 768px) */}
                <div className="cp-tablet-desktop">
                  <div className="cp-table-container" style={{ border: "none", borderRadius: 0 }}>
                    <Table aria-label="Recent appointments table">
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ width: "90px" }}>Ref ID</TableHead>
                          <TableHead>Physician</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead style={{ width: "130px", textAlign: "right" }}>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAppointments.map((appointment) => (
                          <TableRow key={appointment.id} id={`admin-apt-row-${appointment.id}`}>
                            <TableCell>
                              <span style={{ fontWeight: "var(--cp-font-weight-medium)", color: "var(--cp-text-muted)" }}>
                                #{appointment.id}
                              </span>
                            </TableCell>
                            <TableCell>
                              <strong style={{ color: "var(--cp-text-primary)" }}>
                                {formatDoctorName(appointment.doctorName)}
                              </strong>
                            </TableCell>
                            <TableCell>{appointment.patientName || "—"}</TableCell>
                            <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                            <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
                            <TableCell>
                              <span
                                title={appointment.reason}
                                style={{
                                  display: "inline-block",
                                  maxWidth: "220px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {appointment.reason || "—"}
                              </span>
                            </TableCell>
                            <TableCell style={{ textAlign: "right" }}>
                              <StatusBadge status={appointment.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile View Card Stack (< 768px) */}
                <div className="cp-mobile-only" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {recentAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="cp-appointment-card"
                        id={`admin-apt-card-${appointment.id}`}
                      >
                        <div className="cp-appointment-card-header">
                          <div>
                            <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-muted)" }}>
                              Ref #{appointment.id}
                            </span>
                            <h4 className="cp-appointment-card-doctor">
                              {formatDoctorName(appointment.doctorName)}
                            </h4>
                            <div style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-secondary)", marginTop: "2px" }}>
                              Patient: {appointment.patientName || "—"}
                            </div>
                          </div>
                          <StatusBadge status={appointment.status} />
                        </div>

                        <div className="cp-appointment-card-details">
                          <div>
                            <span className="cp-appointment-detail-label">Date</span>
                            <div style={{ fontWeight: "var(--cp-font-weight-medium)" }}>
                              {formatDate(appointment.appointmentDate)}
                            </div>
                          </div>
                          <div>
                            <span className="cp-appointment-detail-label">Time</span>
                            <div style={{ fontWeight: "var(--cp-font-weight-medium)" }}>
                              {formatTime(appointment.appointmentTime)}
                            </div>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div className="cp-appointment-card-reason">
                            <strong style={{ color: "var(--cp-text-primary)" }}>Reason: </strong>
                            {appointment.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

export default AdminDashboard;
