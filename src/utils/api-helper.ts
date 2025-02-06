import apiClient from '../services/api';

const api = {
  get: async (route: string) => {
      const response = await apiClient.get(route, { withCredentials: true })
      return response.data
  },
  post: async (route: string, data = {}) => {
      const response = await apiClient.post(route, data, { withCredentials: true })
      return response.data
  },
}

export default api