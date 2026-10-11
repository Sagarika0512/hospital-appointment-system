import { useState, useEffect, useMemo } from "react";
import {
  getAppointments,
  cancelAppointment,
  completeAppointment,
} from "../services/appointmentService";
import { notify } from "../components/feedback/toast";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
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
import { SkeletonTable } from "../components/feedback/Skeleton";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import {
  SearchIcon,
  EyeIcon,
  XIcon,
  CheckIcon,
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

export function AdminAppointments() {
  // Data & Pagination state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pageNo, setPageNo] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Details Modal state
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Status Action Dialogs state
  const [appointmentToComplete, setAppointmentToComplete] = useState(null);
  const [completing, setCompleting] = useState(false);

  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Load appointments from backend
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
      setError("Unable to retrieve appointment ledger. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointmentsData(0);
  }, []);

  // Compute status counts on the loaded page
  const pageStatusCounts = useMemo(() => {
    const counts = { ALL: appointments.length, SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 };
    appointments.forEach((a) => {
      const s = (a.status || "").toUpperCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [appointments]);

  // Client-side search and status filter on the loaded page
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        if ((appointment.status || "").toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      // 2. Search Term Filter (ID, Doctor Name, Patient Name)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const idMatch = String(appointment.id || "").toLowerCase().includes(query);
        const doctorMatch = String(appointment.doctorName || "").toLowerCase().includes(query);
        const patientMatch = String(appointment.patientName || "").toLowerCase().includes(query);
        const reasonMatch = String(appointment.reason || "").toLowerCase().includes(query);
        return idMatch || doctorMatch || patientMatch || reasonMatch;
      }

      return true;
    });
  }, [appointments, statusFilter, searchTerm]);

  const isFilterOrSearchActive = Boolean(searchTerm.trim() || statusFilter !== "ALL");

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  const handlePageChange = (newPage) => {
    loadAppointmentsData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Complete Appointment Action
  const handleConfirmComplete = async () => {
    if (!appointmentToComplete) return;
    setCompleting(true);
    try {
      const updated = await completeAppointment(appointmentToComplete.id);
      notify.appointmentCompleted();

      // Update local appointments list immediately
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentToComplete.id
            ? { ...a, status: updated?.status || "COMPLETED" }
            : a
        )
      );

      // If details modal is open for this appointment, update its status
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

  // Cancel Appointment Action
  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setCancelling(true);
    try {
      const updated = await cancelAppointment(appointmentToCancel.id);
      notify.appointmentCancelled();

      // Update local appointments list immediately
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentToCancel.id
            ? { ...a, status: updated?.status || "CANCELLED" }
            : a
        )
      );

      // If details modal is open for this appointment, update its status
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
        "Failed to cancel appointment.";
      notify.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="cp-appointments-container">
      {/* ── Page Header ── */}
      <PageHeader
        title="Appointments"
        description="Comprehensive clinical schedule and appointment administration ledger."
      />

      {/* ── Toolbar: Search & Status Filter Controls ── */}
      <section className="cp-appointments-toolbar" aria-label="Appointment search and filter toolbar">
        <div className="cp-appointments-controls-row">
          {/* Status Tabs */}
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
                  id={`admin-filter-tab-${tab.id.toLowerCase()}`}
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

          {/* Search Input */}
          <div className="cp-appointments-search-wrapper">
            <Input
              id="admin-appointment-search"
              placeholder="Search doctor, patient, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconPrefix={<SearchIcon size={16} />}
              aria-label="Search appointments on current page"
            />
          </div>
        </div>

        {/* Scope and Active Filter Feedback */}
        {!loading && !error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div className="cp-appointments-meta-note">
              Showing <strong>{filteredAppointments.length}</strong> matching of <strong>{appointments.length}</strong> record(s) on page {pageNo + 1} of {totalPages}
            </div>

            {isFilterOrSearchActive && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleClearFilters}
                icon={<XIcon size={12} />}
                id="admin-clear-filters-btn"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ── Main Content View (Loading / Error / Empty / Table) ── */}
      {loading ? (
        <Card className="cp-appointments-table-card">
          <SkeletonTable rows={5} columns={7} />
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
            title="No Appointments on Record"
            description="There are currently no appointments registered in the hospital management system."
          />
        </Card>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarIcon size={36} />}
            title="No Matching Appointments Found"
            description="No appointments on this page match your search or filter criteria. Try adjusting your query or resetting filters."
            action={
              <Button
                variant="outline"
                size="md"
                onClick={handleClearFilters}
                id="reset-empty-search-btn"
              >
                Reset Search & Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* ── Desktop Tabular View (>= 768px) ── */}
          <div className="cp-appointments-desktop-view">
            <div className="cp-appointments-table-card">
              <Table aria-label="Appointments administration ledger">
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "90px" }}>Ref ID</TableHead>
                    <TableHead>Physician</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead style={{ width: "130px" }}>Status</TableHead>
                    <TableHead style={{ textAlign: "right", minWidth: "210px" }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const isScheduled = (appointment.status || "").toUpperCase() === "SCHEDULED";
                    return (
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
                        <TableCell>
                          <span style={{ color: "var(--cp-text-secondary)" }}>
                            {appointment.patientName || "—"}
                          </span>
                        </TableCell>
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
                              id={`admin-view-details-${appointment.id}`}
                            >
                              Details
                            </Button>

                            {/* Supported Status Actions: Complete & Cancel for SCHEDULED */}
                            {isScheduled && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={<CheckIcon size={14} />}
                                  onClick={() => setAppointmentToComplete(appointment)}
                                  aria-label={`Mark appointment #${appointment.id} as complete`}
                                  id={`admin-complete-btn-${appointment.id}`}
                                >
                                  Complete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<XIcon size={14} />}
                                  onClick={() => setAppointmentToCancel(appointment)}
                                  aria-label={`Cancel appointment #${appointment.id}`}
                                  id={`admin-cancel-btn-${appointment.id}`}
                                >
                                  Cancel
                                </Button>
                              </>
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
                const isScheduled = (appointment.status || "").toUpperCase() === "SCHEDULED";
                return (
                  <div key={appointment.id} className="cp-appointment-card" id={`admin-apt-card-${appointment.id}`}>
                    <div className="cp-appointment-card-header">
                      <div>
                        <span style={{ fontSize: "var(--cp-font-size-xs)", color: "var(--cp-text-muted)" }}>
                          Ref #{appointment.id}
                        </span>
                        <h3 className="cp-appointment-card-doctor">
                          {formatDoctorName(appointment.doctorName)}
                        </h3>
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
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<CheckIcon size={16} />}
                            onClick={() => setAppointmentToComplete(appointment)}
                            fullWidth
                          >
                            Complete
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XIcon size={16} />}
                            onClick={() => setAppointmentToCancel(appointment)}
                            fullWidth
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Server-Driven Pagination ── */}
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
                {selectedAppointment.patientName || "—"}
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

          <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
            {/* Status Actions inside details view if SCHEDULED */}
            {(selectedAppointment.status || "").toUpperCase() === "SCHEDULED" && (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<CheckIcon size={16} />}
                  onClick={() => {
                    const apt = selectedAppointment;
                    setSelectedAppointment(null);
                    setAppointmentToComplete(apt);
                  }}
                  id="modal-admin-complete-btn"
                >
                  Mark Complete
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={<XIcon size={16} />}
                  onClick={() => {
                    const apt = selectedAppointment;
                    setSelectedAppointment(null);
                    setAppointmentToCancel(apt);
                  }}
                  id="modal-admin-cancel-btn"
                >
                  Cancel Appointment
                </Button>
              </>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={() => setSelectedAppointment(null)}
              id="modal-admin-close-btn"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Complete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(appointmentToComplete)}
        onClose={() => setAppointmentToComplete(null)}
        onConfirm={handleConfirmComplete}
        title="Complete Appointment"
        description={
          appointmentToComplete
            ? `Mark appointment #${appointmentToComplete.id} for patient ${
                appointmentToComplete.patientName || "—"
              } with ${formatDoctorName(
                appointmentToComplete.doctorName
              )} on ${formatDate(appointmentToComplete.appointmentDate)} as completed?`
            : "Mark this appointment as completed?"
        }
        confirmText="Yes, Mark Complete"
        cancelText="Cancel"
        confirmVariant="primary"
        isLoading={completing}
      />

      {/* ── Cancel Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(appointmentToCancel)}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        description={
          appointmentToCancel
            ? `Are you sure you want to cancel appointment #${appointmentToCancel.id} for patient ${
                appointmentToCancel.patientName || "—"
              } with ${formatDoctorName(
                appointmentToCancel.doctorName
              )} on ${formatDate(appointmentToCancel.appointmentDate)}? This action cannot be undone.`
            : "Are you sure you want to cancel this appointment? This action cannot be undone."
        }
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        confirmVariant="danger"
        isLoading={cancelling}
      />
    </div>
  );
}

export default AdminAppointments;
