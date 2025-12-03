import axios from "axios";
import { getToken, removeToken } from "./auth";

// Runtime configuration interface
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      REACT_APP_API_URL?: string;
    };
  }
}

// Use runtime config (from container) or build-time env var or fallback
const baseURL = 
  window.__RUNTIME_CONFIG__?.REACT_APP_API_URL || 
  process.env.REACT_APP_API_URL || 
  "http://localhost:8000";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeToken();
      // Redirect to login will be handled by ProtectedRoute
    }
    return Promise.reject(error);
  }
);

export default api;
