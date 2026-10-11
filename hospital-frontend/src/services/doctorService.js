import axiosInstance from "../api/axiosConfig";

export const getDoctors = async (page = 0, size = 50) => {
    const safeSize = Math.min(Math.max(size, 1), 50);
    const response = await axiosInstance.get("/api/doctors", {
        params: { page, size: safeSize }
    });

    return response.data;
};

export const getDoctorById = async (id) => {
    const response = await axiosInstance.get(`/api/doctors/${id}`);
    return response.data;
};