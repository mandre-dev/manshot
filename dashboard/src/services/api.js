// api.js — Manshot
// Centraliza todas as chamadas para a API FastAPI

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Contatos ────────────────────────────────────────
export const getContacts = () => api.get('/contacts/')
export const createContact = (data) => api.post('/contacts/', data)
export const deleteContact = (id) => api.delete(`/contacts/${id}`)

// ── Campanhas ───────────────────────────────────────
export const getCampaigns = () => api.get('/campaigns/')
export const createCampaign = (data) => api.post('/campaigns/', data)
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`)

export default api
