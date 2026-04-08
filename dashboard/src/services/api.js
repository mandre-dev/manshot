// api.js — Manshot
import axios from 'axios'

const TOKEN_KEY = 'manshot_token'
const ACCOUNT_HISTORY_KEY = 'manshot_accounts'

export function inferAccountProviderByEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    return 'local'
  }

  return normalizedEmail.endsWith('@manshot.local') ? 'local' : 'google'
}

function normalizeStoredAccount(account) {
  const email = (account?.email || '').trim().toLowerCase()
  if (!email) {
    return null
  }

  const name = (account?.name || deriveAccountDisplayName(email)).trim() || 'Conta conectada'
  const provider = account?.provider === 'google' || account?.provider === 'local'
    ? account.provider
    : inferAccountProviderByEmail(email)
  return { email, name, provider }
}

function readStoredAccounts() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawAccounts = localStorage.getItem(ACCOUNT_HISTORY_KEY)
    const parsedAccounts = rawAccounts ? JSON.parse(rawAccounts) : []
    if (!Array.isArray(parsedAccounts)) {
      return []
    }

    return parsedAccounts
      .map(normalizeStoredAccount)
      .filter(Boolean)
  } catch {
    return []
  }
}

export function deriveAccountDisplayName(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    return 'Conta conectada'
  }

  const localPart = normalizedEmail.split('@')[0] || normalizedEmail
  const cleanedLocalPart = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/([a-zA-Z])([0-9]+)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanedLocalPart) {
    return 'Conta conectada'
  }

  return cleanedLocalPart
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getStoredAccounts() {
  return readStoredAccounts()
}

export function rememberAccount(account) {
  if (typeof window === 'undefined') {
    return []
  }

  const email = (account?.email || '').trim().toLowerCase()
  if (!email) {
    return readStoredAccounts()
  }

  const name = (account?.name || deriveAccountDisplayName(email)).trim() || 'Conta conectada'
  const provider = account?.provider === 'google' || account?.provider === 'local'
    ? account.provider
    : inferAccountProviderByEmail(email)
  const nextAccounts = [
    { email, name, provider },
    ...readStoredAccounts().filter((item) => item.email !== email),
  ].slice(0, 5)

  localStorage.setItem(ACCOUNT_HISTORY_KEY, JSON.stringify(nextAccounts))
  return nextAccounts
}

export function clearStoredAccounts() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(ACCOUNT_HISTORY_KEY)
}

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken()
    }
    return Promise.reject(error)
  },
)

export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// ── Auth ────────────────────────────────────────────
export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (email, password) => api.post('/auth/register', { email, password })
export const checkCredentials = (email, password) => api.post('/auth/check-credentials', { email, password })
export const getMe = () => api.get('/auth/me')
export const googleLogin = (accessToken) => api.post('/auth/google', { access_token: accessToken })

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
export const uploadAttachment = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Compatibilidade para imports antigos.
export const uploadImage = uploadAttachment

export default api