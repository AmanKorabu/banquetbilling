import axios from "axios";

const BASE_URL = "/banquetapi";

export const initialDataApi = {
  getInitialData: async () => {
    try {
      const hotelId = localStorage.getItem("hotel_id");
      if (!hotelId) {
        throw new Error("No hotel_id found");
      }

      const response = await axios.post(`${BASE_URL}/get_server_date.php`, null, {
        params: { hotel_id: hotelId },
      });

      if (response.status === 200 && response.data) {
        const serverDate = response.data.result?.[0]?.ServerDate || null;
        const billingCompanies = response.data.result2 || [];
        const attendees = response.data.result3 || [];
        
        return {
          serverDate,
          billingCompanies,
          attendees,
        };
      } else {
        throw new Error("Failed to fetch initial data");
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  },

  getStatuses: async () => {
    try {
      const hotelId = localStorage.getItem("hotel_id");
      if (!hotelId) {
        throw new Error("No hotel_id found");
      }

      const response = await axios.post(`${BASE_URL}/search_status.php`, null, {
        params: {
          hotel_id: hotelId,
          search_param: "",
          para: "single_quot",
        },
      });

      if (response.status === 200 && response.data && Array.isArray(response.data.result)) {
        return response.data.result;
      }
      return [];
    } catch (error) {
      console.error("Error fetching statuses:", error);
      throw error;
    }
  },
};