import axios from "axios";

// Pick backend URL based on environment
const api = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000", 
  withCredentials: false,
});

export default api;
