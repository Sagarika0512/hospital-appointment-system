import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getAppointments,
  cancelAppointment,
  completeAppointment,
} from "../services/appointmentService";
import { notify } from "../components/feedback/toast";
import { AdminAppointments } from "./AdminAppointments";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Pagination } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "../components/ui/Table";
import { SkeletonTable, SkeletonCard } from "../components/feedback/Skeleton";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import {
  CalendarIcon,
  EyeIcon,
  XIcon,
  CheckIcon,
  CalendarPlusIcon,
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

export function Appointments() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";

  if (isAdmin) {
    return <AdminAppointments />;
  }

  // Data & Pagination state

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pageNo, setPageNo] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Status Filter state (Client-side on loaded page, as backend does not filter by status)
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Detail Modal state
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Cancellation Confirmation Dialog state
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Admin Complete Dialog state (ADMIN only)
  const [appointmentToComplete, setAppointmentToComplete] = useState(null);
  const [completing, setCompleting] = useState(false);

  const loadAppointmentsData = async (targetPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAppointments(targetPage, pageSize);
      const list = Array.isArray(response)
        ? response
        : response?.content || [];

      const total = typeof response?.totalElements === "number"
        ? response.totalElements
        : list.length;

      const pages = typeof response?.totalPages === "number"
        ? response.totalPages
        : 1;

      setAppointments(list);
      setTotalElements(total);
      setTotalPages(pages);
      setPageNo(targetPage);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Unable to retrieve appointments. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointmentsData(0);
  }, []);

  // Filter appointments for the current page based on status
  const filteredAppointments = useMemo(() => {
    if (statusFilter === "ALL") return appointments;
    return appointments.filter(
      (a) => (a.status || "").toUpperCase() === statusFilter.toUpperCase()
    );
  }, [appointments, statusFilter]);

  // Compute status counts for the loaded page
  const pageStatusCounts = useMemo(() => {
    const counts = { ALL: appointments.length, SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 };
    appointments.forEach((a) => {
      const s = (a.status || "").toUpperCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [appointments]);

  const handlePageChange = (newPage) => {
    loadAppointmentsData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open cancellation confirmation dialog
  const handleOpenCancelDialog = (appointment) => {
    setAppointmentToCancel(appointment);
  };

  // Confirm cancellation
  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setCancelling(true);
    try {
      const updated = await cancelAppointment(appointmentToCancel.id);
      notify.appointmentCancelled();

      // Update local appointment state immediately
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentToCancel.id ? { ...a, status: updated?.status || "CANCELLED" } : a
        )
      );

      // If details modal is open for this appointment, update it
      if (selectedAppointment?.id === appointmentToCancel.id) {
        setSelectedAppointment((prev) =>
          prev ? { ...prev, status: updated?.status || "CANCELLED" } : null
        );
      }

      setAppointmentToCancel(null);
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to cancel appointment. Please try again.";
      notify.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  // Complete appointment (ADMIN only)
  const handleConfirmComplete = async () => {
    if (!appointmentToComplete) return;
    setCompleting(true);
    try {
      const updated = await completeAppointment(appointmentToComplete.id);
      notify.appointmentCompleted();

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentToComplete.id ? { ...a, status: updated?.status || "COMPLETED" } : a
        )
      );

      if (selectedAppointment?.id === appointmentToComplete.id) {
        setSelectedAppointment((prev) =>
          prev ? { ...prev, status: updated?.status || "COMPLETED" } : null
        );
      }

      setAppointmentToComplete(null);
    } catch (err) {
      console.error("Failed to complete appointment:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to mark appointment as completed.";
      notify.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="cp-appointments-container">
      {/* ── Page Header ── */}
      <PageHeader
        title={isAdmin ? "All Appointments" : "My Appointments"}
        description={
          isAdmin
            ? "Comprehensive clinical schedule and appointment administration ledger."
            : "View and manage your scheduled, completed, and past medical consultations."
        }
        action={
          !isAdmin && (
            <Button
              variant="primary"
              size="md"
              icon={<CalendarPlusIcon size={16} />}
              onClick={() => navigate("/book-appointment")}
              id="book-new-appointment-btn"
            >
              Book Appointment
            </Button>
          )
        }
      />

      {/* ── Status Filter Toolbar ── */}
      <section className="cp-appointments-toolbar" aria-label="Appointment status filter">
        <div className="cp-appointments-tabs" role="tablist">
          {[
            { id: "ALL", label: "All" },
            { id: "SCHEDULED", label: "Scheduled" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = pageStatusCounts[tab.id];
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={`cp-appointments-tab ${isActive ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
                id={`filter-tab-${tab.id.toLowerCase()}`}
              >
                <span>{tab.label}</span>
                {!loading && typeof count === "number" && (
                  <span className="cp-tab-count" aria-hidden="true">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!loading && !error && (
          <div className="cp-appointments-meta-note">
            Showing <strong>{filteredAppointments.length}</strong> {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} record(s) on page {pageNo + 1} of {totalPages}
          </div>
        )}
      </section>

      {/* ── Content View Area (Loading / Error / Empty / Data) ── */}
      {loading ? (
        <Card className="cp-appointments-table-card">
          <SkeletonTable rows={5} columns={isAdmin ? 7 : 6} />
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to Load Appointments"
          description={error}
          onRetry={() => loadAppointmentsData(pageNo)}
          retryLabel="Reload Appointments"
        />
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarIcon size={36} />}
            title="You don't have any appointments yet."
            description="Schedule a consultation with our medical specialists to get started."
            action={
              <Button
                variant="primary"
                size="md"
                icon={<CalendarPlusIcon size={16} />}
                onClick={() => navigate("/doctors")}
                id="empty-find-doctors-btn"
              >
                Find Doctors
              </Button>
            }
          />
        </Card>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarIcon size={36} />}
            title={`No ${statusFilter.toLowerCase()} appointments`}
            description={`There are no appointments with status "${statusFilter}" on this page.`}
            action={
              <Button
                variant="outline"
                size="md"
                onClick={() => setStatusFilter("ALL")}
                id="clear-status-filter-btn"
              >
                Clear Status Filter
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* ── Desktop Tabular View (>= 768px) ── */}
          <div className="cp-appointments-desktop-view">
            <div className="cp-appointments-table-card">
              <Table aria-label="Appointments list">
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "90px" }}>Ref ID</TableHead>
                    <TableHead>Physician</TableHead>
                    {isAdmin && <TableHead>Patient</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead style={{ width: "130px" }}>Status</TableHead>
                    <TableHead style={{ textAlign: "right", minWidth: "180px" }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const isScheduled = appointment.status === "SCHEDULED";
                    return (
                      <TableRow key={appointment.id} id={`appointment-row-${appointment.id}`}>
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
                        {isAdmin && (
                          <TableCell>{appointment.patientName || "—"}</TableCell>
                        )}
                        <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                        <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
                        <TableCell>
                          <span
                            title={appointment.reason}
                            style={{
                              display: "inline-block",
                              maxWidth: "200px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {appointment.reason || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.status} />
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          <div className="cp-appointment-row-actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<EyeIcon size={15} />}
                              onClick={() => setSelectedAppointment(appointment)}
                              aria-label={`View details for appointment #${appointment.id}`}
                              id={`view-details-${appointment.id}`}
                            >
                              Details
                            </Button>

                            {/* Cancel Action: allowed only when SCHEDULED */}
                            {isScheduled && (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<XIcon size={14} />}
                                onClick={() => handleOpenCancelDialog(appointment)}
                                aria-label={`Cancel appointment #${appointment.id}`}
                                id={`cancel-apt-${appointment.id}`}
                              >
                                Cancel
                              </Button>
                            )}

                            {/* Complete Action: ADMIN ONLY and only when SCHEDULED */}
                            {isAdmin && isScheduled && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<CheckIcon size={14} />}
                                onClick={() => setAppointmentToComplete(appointment)}
                                id={`complete-apt-${appointment.id}`}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ── Mobile Card Stack View (< 768px) ── */}
          <div className="cp-appointments-mobile-view">
            <div className="cp-appointments-mobile-stack" aria-label="Appointments list">
              {filteredAppointments.map((appointment) => {
                const isScheduled = appointment.status === "SCHEDULED";
                return (
                  <div key={appointment.id} className="cp-appointment-card" id={`appointment-card-${appointment.id}`}>
                    <div className="cp-appointment-card-header">
                      <div>
                        <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-muted)" }}>
                          Ref #{appointment.id}
                        </span>
                        <h3 className="cp-appointment-card-doctor">
                          {formatDoctorName(appointment.doctorName)}
                        </h3>
                        {isAdmin && appointment.patientName && (
                          <div style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-secondary)", marginTop: "2px" }}>
                            Patient: {appointment.patientName}
                          </div>
                        )}
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

                    <div className="cp-appointment-card-footer">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<EyeIcon size={16} />}
                        onClick={() => setSelectedAppointment(appointment)}
                        fullWidth
                      >
                        Details
                      </Button>

                      {isScheduled && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<XIcon size={16} />}
                          onClick={() => handleOpenCancelDialog(appointment)}
                          fullWidth
                        >
                          Cancel
                        </Button>
                      )}

                      {isAdmin && isScheduled && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<CheckIcon size={16} />}
                          onClick={() => setAppointmentToComplete(appointment)}
                          fullWidth
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Pagination (Server-Driven) ── */}
          {totalPages > 1 && (
            <div style={{ marginTop: "0.5rem" }}>
              <Pagination
                pageNo={pageNo}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            </div>
          )}
        </>
      )}

      {/* ── Appointment Details Modal ── */}
      {selectedAppointment && (
        <Modal
          isOpen={Boolean(selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          description={`Reference ID #${selectedAppointment.id}`}
          size="md"
        >
          <div className="cp-appointment-detail-grid">
            <div className="cp-appointment-detail-item">
              <span className="cp-appointment-detail-label">Status</span>
              <div style={{ marginTop: "2px" }}>
                <StatusBadge status={selectedAppointment.status} />
              </div>
            </div>

            <div className="cp-appointment-detail-item">
              <span className="cp-appointment-detail-label">Physician</span>
              <span className="cp-appointment-detail-value">
                {formatDoctorName(selectedAppointment.doctorName)}
              </span>
            </div>

            <div className="cp-appointment-detail-item">
              <span className="cp-appointment-detail-label">Patient</span>
              <span className="cp-appointment-detail-value">
                {selectedAppointment.patientName || user?.name || "Patient"}
              </span>
            </div>

            <div className="cp-appointment-detail-item">
              <span className="cp-appointment-detail-label">Consultation Date</span>
              <span className="cp-appointment-detail-value">
                {formatDate(selectedAppointment.appointmentDate)}
              </span>
            </div>

            <div className="cp-appointment-detail-item">
              <span className="cp-appointment-detail-label">Scheduled Time</span>
              <span className="cp-appointment-detail-value">
                {formatTime(selectedAppointment.appointmentTime)}
              </span>
            </div>

            <div className="cp-appointment-detail-item" style={{ gridColumn: "1 / -1" }}>
              <span className="cp-appointment-detail-label">Reason for Consultation</span>
              <span className="cp-appointment-detail-value" style={{ fontWeight: "normal" }}>
                {selectedAppointment.reason || "No consultation reason provided."}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            {/* If SCHEDULED, show cancel button in modal */}
            {selectedAppointment.status === "SCHEDULED" && (
              <Button
                variant="outline"
                size="md"
                icon={<XIcon size={16} />}
                onClick={() => {
                  const apt = selectedAppointment;
                  setSelectedAppointment(null);
                  handleOpenCancelDialog(apt);
                }}
                id="modal-cancel-appointment-btn"
              >
                Cancel Appointment
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={() => setSelectedAppointment(null)}
              id="modal-close-btn"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Cancel Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(appointmentToCancel)}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        description={
          appointmentToCancel
            ? `Are you sure you want to cancel your consultation with ${formatDoctorName(
                appointmentToCancel.doctorName
              )} on ${formatDate(appointmentToCancel.appointmentDate)} at ${formatTime(
                appointmentToCancel.appointmentTime
              )}? This action cannot be undone.`
            : "Are you sure you want to cancel this appointment? This action cannot be undone."
        }
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        confirmVariant="danger"
        isLoading={cancelling}
      />

      {/* ── Admin Complete Confirmation Dialog (ADMIN ONLY) ── */}
      {isAdmin && (
        <ConfirmDialog
          isOpen={Boolean(appointmentToComplete)}
          onClose={() => setAppointmentToComplete(null)}
          onConfirm={handleConfirmComplete}
          title="Complete Appointment"
          description={
            appointmentToComplete
              ? `Mark appointment #${appointmentToComplete.id} with ${formatDoctorName(
                  appointmentToComplete.doctorName
                )} as completed?`
              : "Mark this appointment as completed?"
          }
          confirmText="Yes, Mark Complete"
          cancelText="Cancel"
          confirmVariant="primary"
          isLoading={completing}
        />
      )}
    </div>
  );
}

export default Appointments;