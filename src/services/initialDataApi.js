import api from "./apiClient";

export const initialDataApi = {
  // Fetch server date + companies + attendees
  getInitialData: async () => {
    try {
      const response = await api.post("/get_server_date.php");

      const serverDate = response.data?.result?.[0]?.ServerDate || null;
      const billingCompanies = response.data?.result2 || [];
      const attendees = response.data?.result3 || [];

      return {
        serverDate,
        billingCompanies,
        attendees,
      };
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  },

  // Fetch statuses
  getStatuses: async () => {
    try {
      const response = await api.post("/search_status.php", null, {
        params: {
          search_param: "",
          para: "single_quot",
        },
      });

      return response.data?.result || [];
    } catch (error) {
      console.error("Error fetching statuses:", error);
      throw error;
    }
  },
};
