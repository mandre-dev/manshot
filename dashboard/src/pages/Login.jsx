import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { checkCredentials, login, register, saveToken } from '../services/api'

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
  const [isSecondaryPressed, setIsSecondaryPressed] = useState(false)
  const [focusedField, setFocusedField] = useState('')
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
    const validationState = getFieldValidationState(field)
    const borderColor = validationState === 'valid'
      ? '#22c55e'
      : validationState === 'invalid'
        ? '#ef4444'
        : isFocused
          ? '#FF6B00'
          : '#2a1a0a'
    const focusGlow = validationState === 'valid'
      ? '0 0 0 3px #22c55e33, 0 8px 24px #22c55e1f'
      : validationState === 'invalid'
        ? '0 0 0 3px #ef444433, 0 8px 24px #ef44441a'
        : '0 0 0 3px #FF6B0033, 0 8px 24px #FF6B001f'

    return {
      ...inputStyle,
      ...extraStyle,
      border: `2px solid ${borderColor}`,
      boxShadow: isFocused || validationState !== 'neutral' ? focusGlow : 'none',
      transform: isFocused ? 'translateY(-1px)' : 'translateY(0)',
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
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
            transform: isPrimaryPressed ? 'scale(0.985)' : 'scale(1)',
            boxShadow: isPrimaryPressed ? 'inset 0 0 0 2px #ff9a3d66' : '0 6px 18px #FF6B0033',
            transition: 'transform 0.08s ease, box-shadow 0.12s ease'
          }}
            onMouseDown={() => setIsPrimaryPressed(true)}
            onMouseUp={() => setIsPrimaryPressed(false)}
            onMouseLeave={() => setIsPrimaryPressed(false)}>
            {loading ? (isRegisterMode ? 'Criando conta...' : 'Entrando...') : (isRegisterMode ? 'Criar conta' : 'Entrar')}
          </button>

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
              transform: isSecondaryPressed ? 'translateY(1px) scale(0.99)' : 'translateY(0) scale(1)',
              boxShadow: isSecondaryPressed
                ? 'inset 0 0 0 2px #FF6B0088'
                : '0 0 0 0 #00000000',
              transition: 'all 0.12s ease'
            }}
            onMouseDown={() => setIsSecondaryPressed(true)}
            onMouseUp={() => setIsSecondaryPressed(false)}
            onMouseLeave={() => setIsSecondaryPressed(false)}
          >
            {isRegisterMode ? 'Já tenho conta' : 'Criar nova conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
