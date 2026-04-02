// api.js — Manshot
import axios from 'axios'

const TOKEN_KEY = 'manshot_token'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// ── Auth ────────────────────────────────────────────
export const login = (email, password) => api.post('/auth/login', { email, password })
export const getMe = () => api.get('/auth/me')

// ── Contatos ────────────────────────────────────────
export const getContacts = () => api.get('/contacts/')
export const createContact = (data) => api.post('/contacts/', data)
export const updateContact = (id, data) => api.put(`/contacts/${id}`, data)
export const deleteContact = (id) => api.delete(`/contacts/${id}`)

// ── Campanhas ───────────────────────────────────────
export const getCampaigns = () => api.get('/campaigns/')
export const createCampaign = (data) => api.post('/campaigns/', data)
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}`, data)
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`)
export const sendCampaign = (id, contactIds = null, intervalSeconds = 0) => {
  const payload = {
    ids: contactIds,
    interval_seconds: Number(intervalSeconds) || 0,
  }
  return api.post(`/campaigns/${id}/send`, payload)
}

// ── Upload ──────────────────────────────────────────
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default api