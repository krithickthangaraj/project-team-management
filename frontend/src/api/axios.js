import axios from "axios";

const API_BASE =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// attach token from storage to every request (if present)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// centralized 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
      } catch {}
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
