import axios from 'axios'
import { config } from '../config'

const api = axios.create({
  baseURL: `${config.API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((request) => {
  const headers = (request.headers as Record<string, string> | undefined) ?? {}
  headers['X-App-Request'] = 'LicenseIQ'
  request.headers = headers as any
  return request
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data || error.response.statusText)
    }
    return Promise.reject(error.message)
  },
)

export default api
