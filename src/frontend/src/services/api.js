import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Health ────────────────────────────────────────────────────────────────────
export async function healthCheck() {
  const { data } = await apiClient.get('/api/health')
  return data
}

// ── Ports ─────────────────────────────────────────────────────────────────────
export const portsApi = {
  list: () => apiClient.get('/api/ports').then(r => r.data),
  get: (id) => apiClient.get(`/api/ports/${id}`).then(r => r.data),
  create: (body) => apiClient.post('/api/ports', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/api/ports/${id}`, body).then(r => r.data),
  delete: (id) => apiClient.delete(`/api/ports/${id}`),
}

// ── Berths ────────────────────────────────────────────────────────────────────
export const berthsApi = {
  list: (params) => apiClient.get('/api/berths', { params }).then(r => r.data),
  get: (id) => apiClient.get(`/api/berths/${id}`).then(r => r.data),
  create: (body) => apiClient.post('/api/berths', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/api/berths/${id}`, body).then(r => r.data),
  delete: (id) => apiClient.delete(`/api/berths/${id}`),
}

// ── Cranes ────────────────────────────────────────────────────────────────────
export const cranesApi = {
  list: (params) => apiClient.get('/api/cranes', { params }).then(r => r.data),
  get: (id) => apiClient.get(`/api/cranes/${id}`).then(r => r.data),
  create: (body) => apiClient.post('/api/cranes', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/api/cranes/${id}`, body).then(r => r.data),
  delete: (id) => apiClient.delete(`/api/cranes/${id}`),
}

// ── Vessels ───────────────────────────────────────────────────────────────────
export const vesselsApi = {
  list:   (params) => apiClient.get('/api/vessels', { params }).then(r => r.data),
  get:    (id)     => apiClient.get(`/api/vessels/${id}`).then(r => r.data),
  create: (body)   => apiClient.post('/api/vessels', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/api/vessels/${id}`, body).then(r => r.data),
  delete: (id)     => apiClient.delete(`/api/vessels/${id}`),
}

// ── Predictions ───────────────────────────────────────────────────────────────
export const predictionsApi = {
  delay:     (body) => apiClient.post('/api/predictions/delay', body).then(r => r.data),
  modelInfo: ()     => apiClient.get('/api/predictions/model-info').then(r => r.data),
}

// ── Operations ────────────────────────────────────────────────────────────────
export const operationsApi = {
  routes: () => apiClient.get('/api/operations/routes').then(r => r.data),
  berths: () => apiClient.get('/api/operations/berths').then(r => r.data),
  cranes: () => apiClient.get('/api/operations/cranes').then(r => r.data),
  plan:   () => apiClient.get('/api/operations/plan').then(r => r.data),
}

export default apiClient
