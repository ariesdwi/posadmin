import axios from "axios";
import { getCookie, deleteCookie } from "cookies-next";

// Default to localhost if not specified, can be overridden by env variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.168.81.25:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = getCookie("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to unwrap nested data structure
api.interceptors.response.use(
  (response) => {
    // Backend returns { success, statusCode, message, data: {...}, timestamp }
    // We unwrap it so that response.data contains the actual data
    if (response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response &&(error.response.status === 401 || error.response.status === 403)) {
      // If 401/403, and we are not on login page, redirect to login & clear token
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
         deleteCookie("token");
         deleteCookie("user");
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
