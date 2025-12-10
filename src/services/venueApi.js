import api from "./apiClient";

export const venueApi = {
  getVenues: async () => {
    const response = await api.get("/search_venue.php", {
      params: { search_para: "" },
    });

    return response.data?.result || [];
  },
};
