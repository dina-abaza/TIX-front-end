import axios from "axios";
import { getCookie } from "cookies-next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin.tix-eg.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    Accept: "application/json",
    "Accept-Language": "ar",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getCookie("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token
      if (typeof window !== "undefined") {
        /*
        document.cookie = "auth_token=; Max-Age=0; path=/";
        document.cookie = "user_data=; Max-Age=0; path=/";
        // Don't redirect if already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        */
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { API_BASE_URL };
