import axios from "axios";

const BASE_URL = "/banquetapi";

// Create axios instance with common config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add request interceptor to include hotel_id
api.interceptors.request.use(
  (config) => {
    const hotelId = localStorage.getItem("hotel_id");
    if (hotelId) {
      config.params = {
        ...config.params,
        hotel_id: hotelId,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions
export const bookingApi = {
  // Venues
  getVenues: async (searchParam = "") => {
    const response = await api.get("/search_venue.php", {
      params: { search_para: searchParam },
    });
    return response.data;
  },

  // Server Date and initial data
  getServerDate: async () => {
    const response = await api.post("/get_server_date.php");
    return response.data;
  },

  // Statuses
  getStatuses: async (searchParam = "", para = "single_quot") => {
    const response = await api.post("/search_status.php", null, {
      params: {
        search_param: searchParam,
        para: para,
      },
    });
    return response.data;
  },

  // Billing Companies (from server date response)
  // This might need separate endpoint if available

  // Submit Booking
  submitBooking: async (bookingData) => {
    const response = await api.post("/save_quot_new.php", bookingData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  // Items search
  searchItems: async (searchParam = "") => {
    const response = await api.post("/search_pack.php", null, {
      params: {
        search_param: searchParam,
      },
    });
    return response.data;
  },

  // Parties
  searchParties: async (searchParam = "") => {
    const response = await api.post("/search_cust_exp.php", null, {
      params: {
        search_param: searchParam,
      },
    });
    return response.data;
  },

  // Guest Company
  searchCompanies: async (searchParam = "") => {
    const response = await api.post("/search_comp.php", null, {
      params: {
        search_param: searchParam,
      },
    });
    return response.data;
  },

  // Functions
  searchFunctions: async (searchParam = "") => {
    const response = await api.post("/search_function.php", null, {
      params: {
        search_param: searchParam,
      },
    });
    return response.data;
  },

  // Serving Names
  searchServingNames: async (searchParam = "") => {
    const response = await api.post("/search_serving.php", null, {
      params: {
        search_param: searchParam,
      },
    });
    return response.data;
  },
};

export default bookingApi;