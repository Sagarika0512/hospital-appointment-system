import axiosInstance from "../api/axiosConfig";

export const register = async (userData) => {

    const response = await axiosInstance.post("/api/auth/register", userData);

    return response.data;
};

export const login = async (loginData) => {

    const response = await axiosInstance.post("/api/auth/login", loginData);

    return response.data;
};






