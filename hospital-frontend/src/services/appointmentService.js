import axiosInstance from "../api/axiosConfig";

// Getting all appointments
// ADMIN receives all appointments; PATIENT receives only their own.
// Backend supports: page, size, sortBy, sortDir
export const getAppointments = async (page = 0, size = 50, sortBy, sortDir) => {
    const safeSize = Math.min(Math.max(size, 1), 50);
    const params = { page, size: safeSize };
    if (sortBy) params.sortBy = sortBy;
    if (sortDir) params.sortDir = sortDir;
    const response = await axiosInstance.get("/api/appointments", { params });
    return response.data;
};

// Creating Appointment
// PATIENT: do not send patientId (backend resolves from auth).
// ADMIN: must include patientId in appointmentData.
export const createAppointment = async (appointmentData) => {
    const response = await axiosInstance.post("/api/appointments", appointmentData);
    return response.data;
};

// Cancel a SCHEDULED appointment.
// PATIENT can cancel their own; ADMIN can cancel any.
export const cancelAppointment = async (id) => {
    const response = await axiosInstance.patch(`/api/appointments/${id}/cancel`);
    return response.data;
};

// Mark a SCHEDULED appointment as COMPLETE.
// ADMIN only.
export const completeAppointment = async (id) => {
    const response = await axiosInstance.patch(`/api/appointments/${id}/complete`);
    return response.data;
};