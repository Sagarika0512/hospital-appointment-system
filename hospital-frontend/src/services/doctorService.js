import axiosInstance from "../api/axiosConfig";

export const getDoctors = async () => {
    const response = await axiosInstance.get("/api/doctors");

    return response.data;
};