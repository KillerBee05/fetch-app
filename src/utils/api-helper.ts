import apiClient from '../services/api';

const api = {
  get: async <T>(route: string): Promise<T> => {
    const response = await apiClient.get(route)
    return response.data
  },
  
  post: async <T>(route: string, data = {}): Promise<T> => {
    const response = await apiClient.post(route, data)
    return response.data
  }
}

export default api