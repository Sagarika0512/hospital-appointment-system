import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { createAppointment } from "../services/appointmentService";
import { getDoctors, getDoctorById } from "../services/doctorService";
import { notify } from "../components/feedback/toast";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/feedback/Spinner";
import { SkeletonCard } from "../components/feedback/Skeleton";
import { ErrorState } from "../components/feedback/ErrorState";
import {
  CalendarIcon,
  ClockIcon,
  StethoscopeIcon,
  MailIcon,
  PhoneIcon,
  CheckIcon,
  ChevronLeftIcon,
  CalendarPlusIcon,
} from "../components/ui/Icons";

/**
 * Ensures "Dr." prefix is formatted cleanly for display.
 */
function formatDoctorName(name) {
  if (!name) return "Doctor";
  const trimmed = name.trim();
  return trimmed.toLowerCase().startsWith("dr.") ? trimmed : `Dr. ${trimmed}`;
}

/**
 * Derives a clean 2-letter initials string from a doctor's name.
 */
function getDoctorInitials(name) {
  if (!name) return "DR";
  const clean = name.replace(/^dr\.?\s+/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Gets local ISO date string (YYYY-MM-DD) avoiding UTC boundary issues.
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats time string (HH:mm:ss or HH:mm) into human-readable 12-hour format.
 */
function formatTimeString(timeStr) {
  if (!timeStr) return "";
  const [hoursStr, minutesStr] = timeStr.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || "00";
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Route parameters & state
  const queryDoctorId = searchParams.get("doctorId");
  const stateDoctorId = location.state?.doctorId;
  const initialDoctorId = queryDoctorId || (stateDoctorId ? String(stateDoctorId) : "");

  // Doctor state
  const [doctorList, setDoctorList] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(null);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [isChangingDoctor, setIsChangingDoctor] = useState(false);

  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Success confirmation state
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // 1. Load doctor directory for the selection dropdown
  const loadDirectory = async () => {
    setDoctorsLoading(true);
    setDoctorsError(null);
    try {
      const data = await getDoctors(0, 50);
      const list = Array.isArray(data) ? data : data?.content || [];
      setDoctorList(list);
      return list;
    } catch (err) {
      console.error("Failed to load doctor directory:", err);
      setDoctorsError("Unable to retrieve doctor directory. Please refresh to try again.");
      return [];
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  // 2. Fetch or resolve selected doctor when doctorId changes
  useEffect(() => {
    if (!initialDoctorId) {
      setSelectedDoctor(null);
      setIsChangingDoctor(true);
      return;
    }

    let isMounted = true;
    const fetchSelectedDoc = async () => {
      setDoctorLoading(true);
      setServerError(null);

      // Check if state already has basic doctor info to provide instant feedback
      if (location.state?.doctorName && String(location.state?.doctorId) === initialDoctorId) {
        setSelectedDoctor({
          id: Number(location.state.doctorId),
          name: location.state.doctorName,
          specialization: location.state.specialization || "",
        });
      }

      try {
        const doc = await getDoctorById(initialDoctorId);
        if (isMounted) {
          setSelectedDoctor(doc);
          setIsChangingDoctor(false);
        }
      } catch (err) {
        console.error("Failed to fetch doctor by ID:", err);
        if (isMounted) {
          // If fetching by ID fails, fallback to finding in doctorList if available
          const found = doctorList.find((d) => String(d.id) === String(initialDoctorId));
          if (found) {
            setSelectedDoctor(found);
            setIsChangingDoctor(false);
          } else {
            notify.error("Could not load the specified doctor. Please select a doctor from the list.");
            setSelectedDoctor(null);
            setIsChangingDoctor(true);
          }
        }
      } finally {
        if (isMounted) {
          setDoctorLoading(false);
        }
      }
    };

    fetchSelectedDoc();

    return () => {
      isMounted = false;
    };
  }, [initialDoctorId, doctorList, location.state]);

  // Handle switching doctor from the dropdown
  const handleSelectDoctorFromDropdown = (e) => {
    const docId = e.target.value;
    if (!docId) {
      setSelectedDoctor(null);
      return;
    }

    const found = doctorList.find((d) => String(d.id) === String(docId));
    if (found) {
      setSelectedDoctor(found);
      setIsChangingDoctor(false);
      setSearchParams({ doctorId: found.id }, { replace: true });
      if (errors.doctor) {
        setErrors((prev) => ({ ...prev, doctor: undefined }));
      }
    }
  };

  // Switch to changing doctor mode
  const handleChangeDoctorClick = () => {
    setIsChangingDoctor(true);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!selectedDoctor?.id) {
      newErrors.doctor = "Please select a doctor for this appointment";
    }

    if (!date) {
      newErrors.date = "Appointment date is required";
    } else if (date < todayStr) {
      newErrors.date = "Appointment date cannot be in the past";
    }

    if (!time) {
      newErrors.time = "Appointment time is required";
    } else if (date === todayStr) {
      // Check if selected time is in past for today
      const now = new Date();
      const [hours, minutes] = time.split(":").map(Number);
      const selectedTimeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      if (selectedTimeDate <= now) {
        newErrors.time = "Appointment time cannot be in the past";
      }
    }

    if (!reason.trim()) {
      newErrors.reason = "Reason for appointment is required";
    } else if (reason.trim().length < 3) {
      newErrors.reason = "Please provide at least 3 characters explaining your reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Format time as HH:mm:ss for backend LocalTime parsing
      const formattedTime = time.length === 5 ? `${time}:00` : time;

      const appointmentData = {
        doctorId: Number(selectedDoctor.id),
        appointmentDate: date,
        appointmentTime: formattedTime,
        reason: reason.trim(),
      };

      const response = await createAppointment(appointmentData);

      notify.appointmentBooked();
      setConfirmedAppointment(response);
    } catch (err) {
      console.error("Booking failed:", err);
      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null);

      if (status === 409) {
        const conflictMsg = backendMessage || "Doctor is already booked for this time slot. Please choose another date or time.";
        setServerError(conflictMsg);
        notify.error(conflictMsg);
      } else if (status === 400) {
        const badReqMsg = backendMessage || "Invalid appointment details. Please check the date and time.";
        setServerError(badReqMsg);
        notify.error(badReqMsg);
      } else if (status === 403) {
        const forbiddenMsg = backendMessage || "Your account does not have an active patient profile linked.";
        setServerError(forbiddenMsg);
        notify.error(forbiddenMsg);
      } else {
        const generalMsg = backendMessage || "Failed to schedule appointment. Please try again.";
        setServerError(generalMsg);
        notify.apiError(err, generalMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form to book another appointment
  const handleBookAnother = () => {
    setConfirmedAppointment(null);
    setDate("");
    setTime("");
    setReason("");
    setErrors({});
    setServerError(null);
  };

  // ── SUCCESS CONFIRMATION VIEW ──
  if (confirmedAppointment) {
    const formattedDoctor = formatDoctorName(confirmedAppointment.doctorName || selectedDoctor?.name);
    const displayTime = formatTimeString(confirmedAppointment.appointmentTime || time);

    return (
      <div className="cp-book-appointment-container">
        <PageHeader
          title="Appointment Confirmation"
          description="Your consultation has been successfully scheduled with our medical team."
        />

        <div className="cp-book-confirm-card" role="region" aria-label="Appointment Confirmation Details">
          <div className="cp-book-confirm-icon-wrap" aria-hidden="true">
            <CheckIcon size={36} />
          </div>

          <div className="cp-book-confirm-header">
            <h2 className="cp-book-confirm-title">Appointment Confirmed!</h2>
            <p className="cp-book-confirm-desc">
              Your appointment has been registered and is now scheduled. A confirmation record is available in your appointments ledger.
            </p>
          </div>

          <div className="cp-book-confirm-details">
            <div className="cp-book-detail-item">
              <span className="cp-book-detail-label">Appointment ID</span>
              <span className="cp-book-detail-value">#{confirmedAppointment.id}</span>
            </div>

            <div className="cp-book-detail-item">
              <span className="cp-book-detail-label">Status</span>
              <span className="cp-book-detail-value">
                <StatusBadge status={confirmedAppointment.status || "SCHEDULED"} />
              </span>
            </div>

            <div className="cp-book-detail-item">
              <span className="cp-book-detail-label">Physician</span>
              <span className="cp-book-detail-value">{formattedDoctor}</span>
            </div>

            <div className="cp-book-detail-item">
              <span className="cp-book-detail-label">Patient</span>
              <span className="cp-book-detail-value">
                {confirmedAppointment.patientName || "You"}
              </span>
            </div>

            <div className="cp-book-detail-item">
              <span className="cp-book-detail-label">Consultation Date</span>
              <span className="cp-book-detail-value">
                {confirmedAppointment.appointmentDate}
              </span>
            </div>

            <div className="cp-book-detail-item">
              <span className="cp-book-detail-label">Scheduled Time</span>
              <span className="cp-book-detail-value">{displayTime}</span>
            </div>

            <div className="cp-book-detail-item" style={{ gridColumn: "1 / -1" }}>
              <span className="cp-book-detail-label">Reason for Consultation</span>
              <span className="cp-book-detail-value">
                {confirmedAppointment.reason}
              </span>
            </div>
          </div>

          <div className="cp-book-confirm-actions">
            <Button
              variant="primary"
              size="lg"
              icon={<CalendarIcon size={18} />}
              onClick={() => navigate("/appointments")}
              id="view-my-appointments-btn"
            >
              View in My Appointments
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={<CalendarPlusIcon size={18} />}
              onClick={handleBookAnother}
              id="book-another-appointment-btn"
            >
              Book Another Appointment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN BOOKING FORM VIEW ──
  return (
    <div className="cp-book-appointment-container">
      {/* ── Page Header ── */}
      <PageHeader
        title="Book Appointment"
        description="Schedule a consultation with our medical professionals. Please select your doctor, date, and preferred time."
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ChevronLeftIcon size={16} />}
            onClick={() => navigate("/doctors")}
          >
            Back to Doctors
          </Button>
        }
      />

      {/* ── Server Error Alert Banner ── */}
      {serverError && (
        <div className="cp-book-alert-banner" role="alert">
          <AlertCircleIcon size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Booking Notice: </strong>
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {/* ── Section 1: Doctor Selection & Summary ── */}
      {doctorLoading ? (
        <Card>
          <CardBody>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem" }}>
              <Spinner size="sm" color="primary" />
              <span>Loading physician information...</span>
            </div>
          </CardBody>
        </Card>
      ) : selectedDoctor && !isChangingDoctor ? (
        /* Selected Doctor Summary Card */
        <div className="cp-book-doctor-card">
          <div className="cp-book-doctor-main">
            <div className="cp-book-doctor-avatar" aria-hidden="true">
              {getDoctorInitials(selectedDoctor.name)}
            </div>
            <div className="cp-book-doctor-info">
              <h2 className="cp-book-doctor-name">
                {formatDoctorName(selectedDoctor.name)}
              </h2>
              <div className="cp-book-doctor-meta">
                {selectedDoctor.specialization && (
                  <span className="cp-book-doctor-specialty">
                    <StethoscopeIcon size={13} aria-hidden="true" />
                    <span>{selectedDoctor.specialization}</span>
                  </span>
                )}
                {selectedDoctor.email && (
                  <span className="cp-book-doctor-contact">
                    <MailIcon size={13} aria-hidden="true" />
                    <span>{selectedDoctor.email}</span>
                  </span>
                )}
                {selectedDoctor.phone && (
                  <span className="cp-book-doctor-contact">
                    <PhoneIcon size={13} aria-hidden="true" />
                    <span>{selectedDoctor.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshIcon size={14} />}
            onClick={handleChangeDoctorClick}
            id="change-doctor-btn"
            aria-label="Change selected physician"
          >
            Change Doctor
          </Button>
        </div>
      ) : (
        /* Doctor Dropdown Selector (Direct Visit or Changing Doctor) */
        <Card className="cp-book-form-card" style={{ padding: "1.25rem 1.5rem" }}>
          <FormField
            id="doctor-select"
            label="Select Physician"
            required
            error={errors.doctor}
            helperText="Choose the medical specialist you wish to consult with."
          >
            {doctorsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
                <Spinner size="xs" color="primary" />
                <span className="cp-text-muted" style={{ fontSize: "var(--cp-font-size-sm)" }}>
                  Loading available doctors...
                </span>
              </div>
            ) : doctorsError ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="cp-form-error">{doctorsError}</span>
                <Button variant="outline" size="xs" onClick={loadDirectory}>
                  Retry
                </Button>
              </div>
            ) : (
              <Select
                id="doctor-select"
                value={selectedDoctor?.id || ""}
                onChange={handleSelectDoctorFromDropdown}
                error={errors.doctor}
              >
                <option value="">-- Choose a doctor from directory --</option>
                {doctorList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {formatDoctorName(doc.name)} — {doc.specialization || "General Practice"}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </Card>
      )}

      {/* ── Section 2: Booking Form Card ── */}
      <div className="cp-book-form-card">
        <form onSubmit={handleSubmit} className="cp-book-form" noValidate>
          {/* Date & Time Grid */}
          <div className="cp-book-grid-2">
            {/* Appointment Date */}
            <FormField
              id="appointment-date"
              label="Consultation Date"
              required
              error={errors.date}
              helperText="Select a consultation date today or in the future."
            >
              <Input
                id="appointment-date"
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                error={errors.date}
                iconPrefix={<CalendarIcon size={16} />}
                disabled={submitting}
                required
              />
            </FormField>

            {/* Appointment Time */}
            <FormField
              id="appointment-time"
              label="Consultation Time"
              required
              error={errors.time}
              helperText="Select your preferred appointment time."
            >
              <Input
                id="appointment-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                }}
                error={errors.time}
                iconPrefix={<ClockIcon size={16} />}
                disabled={submitting}
                required
              />
            </FormField>
          </div>

          {/* Reason for Visit */}
          <FormField
            id="appointment-reason"
            label="Reason for Visit / Symptoms"
            required
            error={errors.reason}
            helperText="Briefly describe your health concern, symptoms, or purpose for scheduling this consultation."
          >
            <textarea
              id="appointment-reason"
              className={`cp-book-textarea ${errors.reason ? "cp-input-error" : ""}`.trim()}
              rows={3}
              placeholder="e.g. Annual preventive checkup, persistent chest pain, routine follow-up"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              disabled={submitting}
              aria-invalid={errors.reason ? "true" : "false"}
              aria-describedby={errors.reason ? "appointment-reason-error" : undefined}
              required
            />
          </FormField>

          {/* Form Actions */}
          <div className="cp-book-actions">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(-1)}
              disabled={submitting}
              id="cancel-booking-btn"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              loadingText="Scheduling Appointment..."
              icon={<CalendarPlusIcon size={16} />}
              id="submit-booking-btn"
            >
              Confirm & Book Appointment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookAppointment;