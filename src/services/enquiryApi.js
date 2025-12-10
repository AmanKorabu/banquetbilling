import axios from "axios";

const ENQUIRY_BASE = import.meta.env.PROD
  ? "https://your-enquiry-api-base-url.com/api"
  : "https://your-enquiry-api-base-url.com/api"; 
// (No Vite proxy for this external API)

const enquiryApiClient = axios.create({
  baseURL: ENQUIRY_BASE,
  timeout: 15000,
});

// Add token automatically if you use auth token
enquiryApiClient.interceptors.request.use((config) => {
  const authToken = localStorage.getItem("authToken");
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const enquiryApi = {
  createEnquiry: async (enquiryData) => {
    const response = await enquiryApiClient.post("/enquiries", enquiryData);
    return response.data;
  },

  getEnquiries: async () => {
    const response = await enquiryApiClient.get("/enquiries");
    return response.data;
  },

  updateEnquiry: async (enquiryId, enquiryData) => {
    const response = await enquiryApiClient.put(`/enquiries/${enquiryId}`, enquiryData);
    return response.data;
  },

  deleteEnquiry: async (enquiryId) => {
    const response = await enquiryApiClient.delete(`/enquiries/${enquiryId}`);
    return response.data;
  },
};
