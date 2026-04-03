import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { clearToken, getMe, getToken } from '../services/api'

export default function ProtectedRoute({ children }) {
  const token = getToken()
  const [status, setStatus] = useState(token ? 'checking' : 'missing')

  useEffect(() => {
    if (!token) return

    let mounted = true

    getMe()
      .then(() => {
        if (mounted) setStatus('valid')
      })
      .catch(() => {
        clearToken()
        if (mounted) setStatus('invalid')
      })

    return () => {
      mounted = false
    }
  }, [token])

  if (status === 'missing' || status === 'invalid') {
    return <Navigate to="/login" replace />
  }

  if (status === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono', monospace" }}>
        Validando sessão...
      </div>
    )
  }

  return children
}
