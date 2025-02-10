import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://frontend-take-home-service.fetch.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  config.timeout = 10000
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out')
    }
    
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded')
    }
    
    return Promise.reject(error)
  }
)

export default apiClient