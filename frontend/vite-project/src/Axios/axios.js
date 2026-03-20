import axios from "axios";
import useAuthStore from "../context/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // ✅ FIXED
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;