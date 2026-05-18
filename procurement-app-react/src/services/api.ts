import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({ baseURL: BASE, timeout: 30000 })

apiClient.interceptors.request.use(async (config) => {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) window.location.href = '/login'
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  signup: (email: string, password: string) => apiClient.post('/auth/signup', { email, password }),
  login:  (email: string, password: string) => apiClient.post('/auth/login',  { email, password }),
  logout: () => apiClient.post('/auth/logout'),
}

// Dashboard
export const dashboardApi = {
  getStats: (force = false) => apiClient.get('/dashboard/stats', { params: force ? { force: true } : {} }),
  getEda:   () => apiClient.get('/dashboard/eda', { timeout: 90000 }),
}

// Contracts
export const contractsApi = {
  search:      (params: Record<string, unknown>) => apiClient.get('/contracts/search', { params }),
  getSaved:    () => apiClient.get('/contracts/saved'),
  save:        (contract: Record<string, unknown>, notes = '') => apiClient.post('/contracts/saved', { ...contract, notes }),
  deleteSaved: (id: string) => apiClient.delete(`/contracts/saved/${id}`),
}

// Analytics
export const analyticsApi = {
  getStats:     (params?: Record<string, unknown>) => apiClient.get('/analytics/stats', { params }),
  getStatus:    () => apiClient.get('/analytics/status'),
  smeByRegion:  () => apiClient.get('/analytics/sme-by-region'),
  smeTrend:     (period = 'monthly') => apiClient.get('/analytics/sme-trend', { params: { period } }),
  summary:      () => apiClient.get('/analytics/summary'),
}

// Statistical Analysis
export const statsApi = {
  hypothesisTests:         () => apiClient.get('/stats/hypothesis-tests'),
  sectorModels:            () => apiClient.get('/stats/sector-models'),
  regionalCompetitiveness: () => apiClient.get('/stats/regional-competitiveness'),
  anomalies:               () => apiClient.get('/stats/anomalies'),
  summary:                 () => apiClient.get('/stats/summary'),
}

// Barriers
export const barriersApi = {
  correlations:       () => apiClient.get('/barriers/correlations'),
  sectorProfiles:     () => apiClient.get('/barriers/sector-profiles'),
  authorityProfiles:  () => apiClient.get('/barriers/authority-profiles'),
  summary:            () => apiClient.get('/barriers/summary'),
  predictWinnability: (body: Record<string, unknown>) => apiClient.post('/barriers/predict-winnability', body),
  analyzeLanguage:    (text: string) => apiClient.post('/barriers/analyze-language', { text }),
}

// Alerts
export const alertsApi = {
  list:       () => apiClient.get('/alerts'),
  create:     (data: Record<string, unknown>) => apiClient.post('/alerts', data),
  update:     (id: string, data: Record<string, unknown>) => apiClient.put(`/alerts/${id}`, data),
  delete:     (id: string) => apiClient.delete(`/alerts/${id}`),
  getHistory: (id: string) => apiClient.get(`/alerts/${id}/history`),
}

// Company
export const companyApi = {
  get:    () => apiClient.get('/company'),
  upsert: (data: Record<string, unknown>) => apiClient.post('/company', data),
  update: (data: Record<string, unknown>) => apiClient.put('/company', data),
}

// Matching / Winnability
export const matchingApi = {
  score:          (company: Record<string, unknown>, contracts: unknown[]) =>
                    apiClient.post('/matching/score', { company, contracts }),
  findMatches:    (limit = 50) => apiClient.post('/matching/find-matches', null, { params: { limit } }),
  getMatches:     (params?: Record<string, unknown>) => apiClient.get('/matching/matches', { params }),
  getSummary:     () => apiClient.get('/matching/matches/summary'),
}

// Company Documents
export const documentsApi = {
  list:   () => apiClient.get('/company/documents'),
  upload: (file: File, doc_type: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('doc_type', doc_type)
    return apiClient.post('/company/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: string) => apiClient.delete(`/company/documents/${id}`),
}
