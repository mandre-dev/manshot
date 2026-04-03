import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { login, register, saveToken } from '../services/api'

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isRegisterMode && form.password !== confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    setLoading(true)

    try {
      const res = isRegisterMode
        ? await register(form.email, form.password)
        : await login(form.email, form.password)
      saveToken(res.data.access_token)
      navigate('/', { replace: true })
    } catch (err) {
      const apiMessage = err?.response?.data?.detail
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        setError(apiMessage)
      } else {
        setError(isRegisterMode ? 'Não foi possível criar sua conta' : 'E-mail ou senha inválidos')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleModeToggle() {
    setIsRegisterMode(prev => !prev)
    setError('')
    setConfirmPassword('')
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
          {isRegisterMode ? 'Criar Conta Manshot' : 'Login Manshot'}
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

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ ...inputStyle, paddingRight: '46px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#1a1208',
                border: '1px solid #2a1a0a',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
                color: '#FF6B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#2a1a0a'
                e.currentTarget.style.borderColor = '#FF6B0044'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#1a1208'
                e.currentTarget.style.borderColor = '#2a1a0a'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isRegisterMode && (
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmar senha"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          )}

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
            {loading ? (isRegisterMode ? 'Criando conta...' : 'Entrando...') : (isRegisterMode ? 'Criar conta' : 'Entrar')}
          </button>

          <button
            type="button"
            onClick={handleModeToggle}
            style={{
              background: 'transparent',
              color: '#9ca3af',
              border: '1px solid #2a1a0a',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'Space Mono', monospace"
            }}
          >
            {isRegisterMode ? 'Já tenho conta' : 'Criar nova conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
