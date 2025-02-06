import apiClient from '../services/api';

const api = {
  get: async (route: string, config = {}) => {
    try {
      const response = await apiClient.get(route, { 
        ...config,
        withCredentials: true 
      })
      return response.data
    } catch (error) {
      console.error(`GET request to ${route} failed:`, error);
      throw error
    }
  },
  post: async (route: string, config = {}) => {
    try {
      const response = await apiClient.post(route, {
        ...config,
        withCredentials: true
      })
      return response.data
    } catch (error) {
      console.error(`POST request to ${route} failed:`, error);
      throw error;
    }
  },
}

export default api