const PROFILE_PREFS_KEY = 'manshot_profile_prefs'

function readProfilePrefs() {
  if (typeof window === 'undefined') return {}

  try {
    const raw = localStorage.getItem(PROFILE_PREFS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function getProfileForEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) return { displayName: '', avatarDataUrl: '' }

  const profile = readProfilePrefs()[normalizedEmail]
  return {
    displayName: (profile?.displayName || '').trim(),
    avatarDataUrl: (profile?.avatarDataUrl || '').trim(),
  }
}

export function saveProfileForEmail(email, payload) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail || typeof window === 'undefined') return

  const current = readProfilePrefs()
  current[normalizedEmail] = {
    displayName: (payload?.displayName || '').trim(),
    avatarDataUrl: (payload?.avatarDataUrl || '').trim(),
  }
  localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(current))
}

export function removeProfileForEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail || typeof window === 'undefined') return

  const current = readProfilePrefs()
  if (!current[normalizedEmail]) return

  delete current[normalizedEmail]
  localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(current))
}

export function computeAvatarInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word?.[0])
    .join('')
    .toUpperCase() || 'MA'
}