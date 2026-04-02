import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, saveToken } from '../services/api'

const inputStyle = {
  background: '#1a1208',
  border: '2px solid #2a1a0a',
  borderRadius: '8px',
  padding: '12px 14px',
  color: '#e5e7eb',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  fontFamily: "'Space Mono', monospace",
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await login(form.email, form.password)
      saveToken(res.data.access_token)
      navigate('/', { replace: true })
    } catch {
      setError('E-mail ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#111827',
        border: '2px solid #2a1a0a',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div style={{ color: '#FF6B00', fontSize: '12px', marginBottom: '8px', fontFamily: "'Space Mono', monospace" }}>
          Acesso seguro
        </div>
        <h1 style={{ color: '#fff', fontSize: '24px', margin: '0 0 20px 0', fontFamily: "'Fira Code', monospace" }}>
          Login Manshot
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="E-mail"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Senha"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
          />

          {error && (
            <div style={{ color: '#f87171', fontSize: '12px', fontFamily: "'Space Mono', monospace" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: '#FF6B00',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: "'Space Mono', monospace"
          }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
