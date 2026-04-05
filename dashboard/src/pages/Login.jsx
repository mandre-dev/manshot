import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { checkCredentials, googleLogin, login, register, saveToken } from '../services/api'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c4.2 0 7.5 1.3 10.2 3.8l7.6-7.6C37.2 1.8 31 0 24 0 14.8 0 6.8 5.3 2.7 13l8.8 6.8C13.5 13.4 18.2 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.6c0-1.5-.1-2.6-.4-3.8H24v7.2h13c-.3 2-.8 3.6-2.1 4.9l8 6.2c4.7-4.4 7.6-10.9 7.6-18.5z" />
      <path fill="#FBBC05" d="M11.5 28.8a14.5 14.5 0 0 1 0-9.6l-8.8-6.8A24 24 0 0 0 0 24c0 3.8.9 7.4 2.7 11.1l8.8-6.3z" />
      <path fill="#34A853" d="M24 48c6.9 0 12.8-2.3 17.1-6.2l-8-6.2c-2.2 1.5-5.2 2.6-9.1 2.6-5.8 0-10.5-3.9-12.3-9.3l-8.8 6.7C6.8 42.7 14.8 48 24 48z" />
    </svg>
  )
}

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPrimaryPressed, setIsPrimaryPressed] = useState(false)
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false)
  const [isSecondaryPressed, setIsSecondaryPressed] = useState(false)
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false)
  const [isGoogleHovered, setIsGoogleHovered] = useState(false)
  const [isGooglePressed, setIsGooglePressed] = useState(false)
  const [isPasswordToggleHovered, setIsPasswordToggleHovered] = useState(false)
  const [isConfirmToggleHovered, setIsConfirmToggleHovered] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const [hoveredField, setHoveredField] = useState('')
  const [hasInvalidCredentials, setHasInvalidCredentials] = useState(false)
  const [credentialStatus, setCredentialStatus] = useState('idle')

  function isEmailValid(email) {
    const normalized = (email || '').trim()
    return normalized.includes('@') && !normalized.startsWith('@') && !normalized.endsWith('@')
  }

  function getFieldValidationState(field) {
    if (field === 'email') {
      if (!form.email) return 'neutral'
      return isEmailValid(form.email) ? 'valid' : 'invalid'
    }

    if (field === 'password') {
      if (!form.password) return 'neutral'

      if (isRegisterMode) {
        return 'neutral'
      }

      if (credentialStatus === 'valid') {
        return 'valid'
      }

      if (credentialStatus === 'invalid') {
        return 'invalid'
      }

      return hasInvalidCredentials ? 'invalid' : 'neutral'
    }

    if (field === 'confirmPassword') {
      return 'neutral'
    }

    return 'neutral'
  }

  function getInputFocusStyle(field, extraStyle = {}) {
    const isFocused = focusedField === field
    const isHovered = hoveredField === field
    const validationState = getFieldValidationState(field)
    const borderColor = validationState === 'valid'
      ? '#22c55e'
      : validationState === 'invalid'
        ? '#ef4444'
        : isFocused || isHovered
          ? '#FF6B00'
          : '#2a1a0a'
    const focusGlow = validationState === 'valid'
      ? '0 0 0 3px #22c55e33, 0 8px 24px #22c55e1f'
      : validationState === 'invalid'
        ? '0 0 0 3px #ef444433, 0 8px 24px #ef44441a'
        : isFocused
          ? '0 0 0 3px #FF6B0033, 0 8px 24px #FF6B001f'
          : isHovered
            ? '0 0 0 2px #FF6B0022, 0 6px 18px #FF6B0017'
            : 'none'

    return {
      ...inputStyle,
      ...extraStyle,
      border: `2px solid ${borderColor}`,
      boxShadow: validationState !== 'neutral' ? focusGlow : isFocused || isHovered ? focusGlow : 'none',
      transform: isFocused || isHovered ? 'translateY(-1px)' : 'translateY(0)',
      transition: 'border-color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease'
    }
  }

  useEffect(() => {
    if (isRegisterMode) {
      setCredentialStatus('idle')
      return
    }

    const email = form.email.trim()
    const password = form.password
    if (!isEmailValid(email) || !password) {
      setCredentialStatus('idle')
      return
    }

    setCredentialStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await checkCredentials(email, password)
        setCredentialStatus(res.data.valid ? 'valid' : 'invalid')
      } catch {
        setCredentialStatus('idle')
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [form.email, form.password, isRegisterMode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setHasInvalidCredentials(false)

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

      if (!isRegisterMode) {
        setHasInvalidCredentials(true)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleModeToggle() {
    setIsRegisterMode(prev => !prev)
    setError('')
    setConfirmPassword('')
    setHasInvalidCredentials(false)
    setCredentialStatus('idle')
  }

  const startGoogleLogin = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setError('')
      setLoading(true)
      try {
        const res = await googleLogin(tokenResponse.access_token)
        saveToken(res.data.access_token)
        navigate('/', { replace: true })
      } catch (err) {
        const apiMessage = err?.response?.data?.detail
        setError(typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : 'Não foi possível entrar com Google')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Falha ao autenticar com Google')
      setLoading(false)
    },
  })

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
            onChange={e => {
              setForm({ ...form, email: e.target.value })
              setHasInvalidCredentials(false)
            }}
              onMouseEnter={() => setHoveredField('email')}
              onMouseLeave={() => setHoveredField('')}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField('')}
            style={getInputFocusStyle('email')}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              required
              value={form.password}
              onChange={e => {
                setForm({ ...form, password: e.target.value })
                setHasInvalidCredentials(false)
              }}
              onMouseEnter={() => setHoveredField('password')}
              onMouseLeave={() => setHoveredField('')}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              style={getInputFocusStyle('password', { paddingRight: '46px' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                background: '#1a1208',
                border: '1px solid #2a1a0a',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
                color: '#FF6B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isPasswordToggleHovered ? 'translateY(calc(-50% - 1px)) scale(1.04)' : 'translateY(-50%) scale(1)',
                boxShadow: isPasswordToggleHovered ? '0 6px 16px rgba(255,107,0,0.14)' : 'none',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => {
                setIsPasswordToggleHovered(true)
                e.currentTarget.style.background = '#2a1a0a'
                e.currentTarget.style.borderColor = '#FF6B0044'
              }}
              onMouseLeave={e => {
                setIsPasswordToggleHovered(false)
                e.currentTarget.style.background = '#1a1208'
                e.currentTarget.style.borderColor = '#2a1a0a'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isRegisterMode && (
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onMouseEnter={() => setHoveredField('confirmPassword')}
                onMouseLeave={() => setHoveredField('')}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                style={getInputFocusStyle('confirmPassword', { paddingRight: '46px' })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Ver confirmação de senha'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  background: '#1a1208',
                  border: '1px solid #2a1a0a',
                  borderRadius: '6px',
                  padding: '4px',
                  cursor: 'pointer',
                  color: '#FF6B00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isConfirmToggleHovered ? 'translateY(calc(-50% - 1px)) scale(1.04)' : 'translateY(-50%) scale(1)',
                  boxShadow: isConfirmToggleHovered ? '0 6px 16px rgba(255,107,0,0.14)' : 'none',
                  transition: 'all 0.12s ease'
                }}
                  onMouseEnter={e => {
                    setIsConfirmToggleHovered(true)
                    e.currentTarget.style.background = '#2a1a0a'
                    e.currentTarget.style.borderColor = '#FF6B0044'
                  }}
                  onMouseLeave={e => {
                    setIsConfirmToggleHovered(false)
                    e.currentTarget.style.background = '#1a1208'
                    e.currentTarget.style.borderColor = '#2a1a0a'
                  }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
            fontFamily: "'Space Mono', monospace",
            transform: isPrimaryPressed ? 'translateY(1px) scale(0.985)' : isPrimaryHovered ? 'translateY(-1px) scale(1.015)' : 'translateY(0) scale(1)',
            boxShadow: isPrimaryPressed ? 'inset 0 0 0 2px #ff9a3d66' : isPrimaryHovered ? '0 10px 22px #FF6B0044' : '0 6px 18px #FF6B0033',
            transition: 'transform 0.08s ease, box-shadow 0.12s ease'
          }}
            onMouseEnter={() => setIsPrimaryHovered(true)}
            onMouseDown={() => setIsPrimaryPressed(true)}
            onMouseUp={() => setIsPrimaryPressed(false)}
            onMouseLeave={() => {
              setIsPrimaryPressed(false)
              setIsPrimaryHovered(false)
            }}>
            {loading ? (isRegisterMode ? 'Criando conta...' : 'Entrando...') : (isRegisterMode ? 'Criar conta' : 'Entrar')}
          </button>

          {!isRegisterMode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#2a1a0a' }} />
                <span style={{ color: '#6b7280', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}>ou</span>
                <div style={{ flex: 1, height: '1px', background: '#2a1a0a' }} />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => startGoogleLogin()}
                style={{
                  background: isGooglePressed ? '#f7f7f7' : '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: "'Space Mono', monospace",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transform: isGooglePressed ? 'translateY(1px) scale(0.99)' : isGoogleHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0) scale(1)',
                  boxShadow: isGoogleHovered ? '0 10px 24px rgba(0,0,0,0.16)' : '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={() => setIsGoogleHovered(true)}
                onMouseDown={() => setIsGooglePressed(true)}
                onMouseUp={() => setIsGooglePressed(false)}
                onMouseLeave={() => {
                  setIsGoogleHovered(false)
                  setIsGooglePressed(false)
                }}
              >
                <GoogleMark />
                <span>Entrar com Google</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleModeToggle}
            style={{
              background: isSecondaryPressed ? '#1f160f' : 'transparent',
              color: isSecondaryPressed ? '#ffd8bd' : '#9ca3af',
              border: '2px solid #FF6B00',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'Space Mono', monospace",
                transform: isSecondaryPressed ? 'translateY(1px) scale(0.99)' : isSecondaryHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0) scale(1)',
                boxShadow: isSecondaryPressed
                ? 'inset 0 0 0 2px #FF6B0088'
                  : isSecondaryHovered
                    ? '0 8px 20px rgba(255,107,0,0.16)'
                : '0 0 0 0 #00000000',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={() => setIsSecondaryHovered(true)}
            onMouseDown={() => setIsSecondaryPressed(true)}
            onMouseUp={() => setIsSecondaryPressed(false)}
            onMouseLeave={() => {
              setIsSecondaryPressed(false)
              setIsSecondaryHovered(false)
            }}
          >
            {isRegisterMode ? 'Já tenho conta' : 'Criar nova conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
