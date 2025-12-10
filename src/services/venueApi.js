import axios from "axios";

const BASE_URL = "/banquetapi";

export const venueApi = {
  getVenues: async () => {
    try {
      const hotelId = localStorage.getItem("hotel_id");
      if (!hotelId) {
        throw new Error("No hotel_id found");
      }

      const response = await axios.get(`${BASE_URL}/search_venue.php`, {
        params: { 
          hotel_id: hotelId, 
          search_para: "" 
        },
      });

      if (response.status === 200 && Array.isArray(response.data.result)) {
        return response.data.result;
      } else {
        throw new Error("Invalid venues data format");
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      throw error;
    }
  },
};