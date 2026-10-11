import axiosInstance from "../api/axiosConfig";

/**
 * CarePulse HMS — Patient Service
 * ADMIN only endpoints for patient registry and pagination metadata
 */

export const getPatients = async (page = 0, size = 50) => {
    const safeSize = Math.min(Math.max(size, 1), 50);
    const response = await axiosInstance.get("/api/patients", {
        params: { page, size: safeSize }
    });
    return response.data;
};

export const getPatientById = async (id) => {
    const response = await axiosInstance.get(`/api/patients/${id}`);
    return response.data;
};
