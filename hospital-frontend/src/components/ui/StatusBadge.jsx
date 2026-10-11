import { ClockIcon, CheckIcon, XIcon } from "./Icons";

/**
 * CarePulse HMS — Appointment Status Badge
 *
 * Supported Statuses (Strictly HMS Backend Compatible):
 * - SCHEDULED (Warm Amber + Clock icon)
 * - COMPLETED (Clinical Green + Check icon)
 * - CANCELLED (Soft Red + X icon)
 *
 * Employs both text and visual icon treatments (accessible, does not rely on color alone).
 */
export function StatusBadge({ status, className = "", ...props }) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "SCHEDULED":
      return (
        <span
          className={`cp-badge cp-badge-scheduled ${className}`.trim()}
          role="status"
          aria-label="Appointment status: Scheduled"
          {...props}
        >
          <ClockIcon size={13} aria-hidden="true" />
          <span>Scheduled</span>
        </span>
      );

    case "COMPLETED":
      return (
        <span
          className={`cp-badge cp-badge-completed ${className}`.trim()}
          role="status"
          aria-label="Appointment status: Completed"
          {...props}
        >
          <CheckIcon size={13} aria-hidden="true" />
          <span>Completed</span>
        </span>
      );

    case "CANCELLED":
      return (
        <span
          className={`cp-badge cp-badge-cancelled ${className}`.trim()}
          role="status"
          aria-label="Appointment status: Cancelled"
          {...props}
        >
          <XIcon size={13} aria-hidden="true" />
          <span>Cancelled</span>
        </span>
      );

    default:
      return (
        <span
          className={`cp-badge cp-badge-primary ${className}`.trim()}
          role="status"
          {...props}
        >
          <span className="cp-badge-dot" aria-hidden="true" />
          <span>{status || "Unknown"}</span>
        </span>
      );
  }
}

export default StatusBadge;
