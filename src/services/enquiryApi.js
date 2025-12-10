import axios from "axios";

const API_BASE_URL = "https://your-enquiry-api-base-url.com/api"; // Your enquiry API base URL

const enquiryApi = {
  createEnquiry: async (enquiryData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/enquiries`, enquiryData, {
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if needed
          "Authorization": `Bearer ${localStorage.getItem('authToken')}`
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating enquiry:", error);
      throw error;
    }
  },

  getEnquiries: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enquiries`);
      return response.data;
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      throw error;
    }
  },

  updateEnquiry: async (enquiryId, enquiryData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/enquiries/${enquiryId}`, enquiryData);
      return response.data;
    } catch (error) {
      console.error("Error updating enquiry:", error);
      throw error;
    }
  },

  deleteEnquiry: async (enquiryId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/enquiries/${enquiryId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      throw error;
    }
  }
};

export { enquiryApi };