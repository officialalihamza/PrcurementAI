import axios from 'axios'
import { getToken } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
}

// Company
export const companyApi = {
  get: () => api.get('/company'),
  upsert: (data) => api.post('/company', data),
  update: (data) => api.put('/company', data),
}

// Contracts
export const contractsApi = {
  search: (params) => api.get('/contracts/search', { params }),
  getSaved: () => api.get('/contracts/saved'),
  save: (contract, notes = '') => api.post('/contracts/saved', {
    ocid:     contract.ocid,
    title:    contract.title,
    buyer:    contract.buyer,
    region:   contract.region,
    value:    contract.value,
    deadline: contract.deadline,
    notes,
  }),
  deleteSaved: (id) => api.delete(`/contracts/saved/${id}`),
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getEda: () => api.get('/dashboard/eda', { timeout: 90000 }),
  exportPdf: () => api.get('/dashboard/eda/export', { responseType: 'blob', timeout: 90000 }),
}

// Analytics
export const analyticsApi = {
  getStats:  (params) => api.get('/analytics/stats', { params, timeout: 15000 }),
  getStatus: ()       => api.get('/analytics/status'),
  refresh:   (years)  => api.post('/analytics/refresh', null, { params: years ? { years } : {}, timeout: 10000 }),
}

// Alerts
export const alertsApi = {
  list: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
  getHistory: (id) => api.get(`/alerts/${id}/history`),
}

export default api
