import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Request Interceptor: Automatically attach the JWT token to every request if available
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Centrally handle 401 (expired/invalid auth) on protected requests
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isAuthEndpoint = error.config?.url?.includes("/api/auth/");
            // For protected API endpoints, clear invalid credentials and redirect to login
            if (!isAuthEndpoint) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
                    window.location.href = "/";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;