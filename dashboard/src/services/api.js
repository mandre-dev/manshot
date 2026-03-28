// api.js — Manshot
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

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
export const sendCampaign = (id, contactIds = null) => {
  const payload = contactIds ? { ids: contactIds } : null
  return api.post(`/campaigns/${id}/send`, payload)
}

// ── Upload ──────────────────────────────────────────
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post('http://127.0.0.1:8000/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default api