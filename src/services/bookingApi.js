import api from "./apiClient";

export const bookingApi = {
  getVenues: async (searchParam = "") => {
    const response = await api.get("/search_venue.php", {
      params: { search_para: searchParam },
    });
    return response.data;
  },

  getServerDate: async () => {
    const response = await api.post("/get_server_date.php");
    return response.data;
  },

  getStatuses: async (searchParam = "", para = "single_quot") => {
    const response = await api.post("/search_status.php", null, {
      params: { search_param: searchParam, para },
    });
    return response.data;
  },

  submitBooking: async (bookingData) => {
    const response = await api.post("/save_quot_new.php", bookingData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  searchItems: async (searchParam = "") => {
    const response = await api.post("/search_pack.php", null, {
      params: { search_param: searchParam },
    });
    return response.data;
  },

  searchParties: async (searchParam = "") => {
    const response = await api.post("/search_cust_exp.php", null, {
      params: { search_param: searchParam },
    });
    return response.data;
  },

  searchCompanies: async (searchParam = "") => {
    const response = await api.post("/search_comp.php", null, {
      params: { search_param: searchParam },
    });
    return response.data;
  },

  searchFunctions: async (searchParam = "") => {
    const response = await api.post("/search_function.php", null, {
      params: { search_param: searchParam },
    });
    return response.data;
  },

  searchServingNames: async (searchParam = "") => {
    const response = await api.post("/search_serving.php", null, {
      params: { search_param: searchParam },
    });
    return response.data;
  },
};
