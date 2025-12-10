import axios from "axios";

// Automatically switch API base URL for Production vs Dev
const API_BASE = import.meta.env.PROD
  ? "https://membership.xpresshotelpos.com/banquetapi"
  : "/banquetapi";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

// Automatically attach hotel_id to all requests (if exists)
api.interceptors.request.use((config) => {
  const hotelId = localStorage.getItem("hotel_id");
  if (hotelId) {
    config.params = {
      ...config.params,
      hotel_id: hotelId,
    };
  }
  return config;
});

export default api;
