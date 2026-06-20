import axiosInstance from "../api/axiosConfig";

//Getting all appointments
export const getAppointments = async () => {
    const response = await axiosInstance.get("/api/appointments");
    return response.data;
};

//Creating Appointment
export const createAppointment = async (appointmentData) => {
    const response = await axiosInstance.post("/api/appointments", appointmentData);
    return response.data;
};