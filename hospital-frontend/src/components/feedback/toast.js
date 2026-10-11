import { toast } from "react-toastify";

/**
 * CarePulse HMS — Standardized Toast Notification Utilities
 * Reuses existing react-toastify setup and standardizes messages for supported HMS operations.
 */
export const notify = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast.warning(message, {
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast.info(message, {
      ...options,
    });
  },

  // ── Standardized Operational Presets ──
  registrationSuccess: () => {
    return toast.success("Registration successful! You can now log in.");
  },

  appointmentBooked: () => {
    return toast.success("Appointment booked successfully.");
  },

  appointmentCancelled: () => {
    return toast.success("Appointment cancelled successfully.");
  },

  appointmentCompleted: () => {
    return toast.success("Appointment marked as completed.");
  },

  /**
   * Sanitizes backend errors into a clean, human-readable notification
   * without leaking stack traces or internal server error logs.
   */
  apiError: (error, fallback = "An error occurred while processing your request.") => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === "string" ? error.response.data : null) ||
      error?.message ||
      fallback;

    return toast.error(message);
  },
};

export default notify;
