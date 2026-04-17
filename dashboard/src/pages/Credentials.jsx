import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Fingerprint, Mail, MessageSquare, Send } from 'lucide-react'
import { getSenderCredentials, patchSenderCredentials } from '../services/api'

const cardStyle = {
  background: '#111827',
  border: '2px solid #2a1a0a',
  borderRadius: '12px',
  padding: '20px',
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#1a1208',
  border: '1px solid #FF6B0033',
  color: '#FFB066',
  fontSize: '12px',
  fontWeight: '600',
}

const inputBaseStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '8px',
  border: '2px solid #2a1a0a',
  background: '#1a1208',
  color: '#e5e7eb',
  padding: '10px 14px',
  fontSize: '13px',
  fontFamily: "'Space Mono', monospace",
  outline: 'none',
}

const labelStyle = {
  color: '#9ca3af',
  fontSize: '12px',
  marginBottom: '6px',
  display: 'block',
}

const sectionTitleStyle = {
  color: '#fff',
  fontSize: '15px',
  fontWeight: '700',
  marginBottom: '12px',
}

const hintStyle = {
  color: '#9ca3af',
  fontSize: '12px',
  marginTop: '8px',
  lineHeight: '1.5',
}

const gridTwoColumns = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
}

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function InteractiveInput({ style, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, onFocus, onBlur, ...props }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <input
      {...props}
      style={{
        ...inputBaseStyle,
        border: isFocused || isHovered ? '2px solid #FF6B00' : '2px solid #2a1a0a',
        boxShadow: isFocused
          ? '0 0 0 3px #FF6B0033, 0 8px 24px #FF6B001f'
          : isHovered
            ? '0 0 0 2px #FF6B0022, 0 5px 16px #FF6B0017'
            : '0 0 0 0 transparent',
        transform: isPressed ? 'translateY(0) scale(0.995)' : (isFocused || isHovered) ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'border-color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease',
        ...style,
      }}
      onMouseEnter={(event) => {
        setIsHovered(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setIsHovered(false)
        setIsPressed(false)
        onMouseLeave?.(event)
      }}
      onMouseDown={(event) => {
        setIsPressed(true)
        onMouseDown?.(event)
      }}
      onMouseUp={(event) => {
        setIsPressed(false)
        onMouseUp?.(event)
      }}
      onFocus={(event) => {
        setIsFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setIsFocused(false)
        setIsPressed(false)
        onBlur?.(event)
      }}
    />
  )
}

function AnimatedButton({ disabled, style, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, children, ...props }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const interactiveHover = isHovered && !disabled
  const interactivePress = isPressed && !disabled

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        border: '1px solid #FF6B00',
        background: disabled ? '#3a2a18' : '#FF6B00',
        color: disabled ? '#cfcfcf' : '#111827',
        borderRadius: '8px',
        padding: '10px 14px',
        fontWeight: '700',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: interactivePress ? 'scale(0.97)' : interactiveHover ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: interactiveHover ? '0 10px 24px #FF6B0033' : '0 0 0 0 transparent',
        transition: 'transform 120ms ease, box-shadow 180ms ease, filter 160ms ease',
        filter: interactiveHover ? 'brightness(1.05)' : 'none',
        ...style,
      }}
      onMouseEnter={(event) => {
        setIsHovered(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setIsHovered(false)
        setIsPressed(false)
        onMouseLeave?.(event)
      }}
      onMouseDown={(event) => {
        setIsPressed(true)
        onMouseDown?.(event)
      }}
      onMouseUp={(event) => {
        setIsPressed(false)
        onMouseUp?.(event)
      }}
    >
      {children}
    </button>
  )
}

export default function Credentials() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [isAdminUsingEnv, setIsAdminUsingEnv] = useState(false)
  const [isEditingCredentials, setIsEditingCredentials] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [isEmailToggleHovered, setIsEmailToggleHovered] = useState(false)
  const [telegramActivationLink, setTelegramActivationLink] = useState('')
  const [telegramLinkStatus, setTelegramLinkStatus] = useState('')
  const formSectionRef = useRef(null)
  const [savedSummary, setSavedSummary] = useState({
    email_user: '',
    email_user_masked: '',
    email_password_set: false,
    email_from_name: '',
    sms_vonage_key_masked: '',
    sms_vonage_secret_set: false,
    sms_default_from: '',
    telegram_bot_token_set: false,
  })

  const [form, setForm] = useState({
    email_smtp_host: '',
    email_smtp_port: '',
    email_user: '',
    email_password: '',
    email_from_name: '',
    sms_vonage_key: '',
    sms_vonage_secret: '',
    sms_default_from: '',
    telegram_bot_token: '',
  })

  const hasAnySenderConfig = useMemo(() => {
    return Object.values(form).some((value) => String(value || '').trim())
  }, [form])

  useEffect(() => {
    let mounted = true

    getSenderCredentials()
      .then(({ data }) => {
        if (!mounted) return
        setIsAdminUsingEnv(Boolean(data?.admin_uses_env))
        setSavedSummary({
          email_user: data?.email_user || '',
          email_user_masked: data?.email_user_masked || '',
          email_password_set: Boolean(data?.email_password_set),
          email_from_name: data?.email_from_name || '',
          sms_vonage_key_masked: data?.sms_vonage_key_masked || '',
          sms_vonage_secret_set: Boolean(data?.sms_vonage_secret_set),
          sms_default_from: data?.sms_default_from || '',
          telegram_bot_token_set: Boolean(data?.telegram_bot_token_set),
        })
        setForm((prev) => ({
          ...prev,
          email_smtp_host: data?.email_smtp_host || '',
          email_smtp_port: data?.email_smtp_port ? String(data.email_smtp_port) : '',
          email_user: data?.email_user || '',
          email_password: '',
          email_from_name: data?.email_from_name || '',
          sms_vonage_key: '',
          sms_vonage_secret: '',
          sms_default_from: data?.sms_default_from || '',
          telegram_bot_token: '',
        }))
      })
      .catch(() => {
        if (!mounted) return
        setStatus('Nao foi possivel carregar as credenciais do usuario.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const onChange = (field) => (event) => {
    const value = event.target.value
    if (field === 'telegram_bot_token') {
      setTelegramActivationLink('')
      setTelegramLinkStatus('')
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const buildTelegramActivationLink = async () => {
    const token = form.telegram_bot_token.trim()
    if (!token) {
      setTelegramLinkStatus('Informe o token do bot para gerar o link de ativacao.')
      return
    }

    setTelegramLinkStatus('Gerando link de ativacao...')
    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 8000)

      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        method: 'GET',
        signal: controller.signal,
      })
      window.clearTimeout(timeoutId)

      const data = await res.json()
      const username = data?.result?.username
      if (!data?.ok || !username) {
        setTelegramActivationLink('')
        setTelegramLinkStatus('Nao foi possivel validar o bot com esse token.')
        return
      }

      const link = `https://t.me/${username}?start=manshot`
      setTelegramActivationLink(link)
      setTelegramLinkStatus('Link de ativacao pronto.')
    } catch {
      setTelegramActivationLink('')
      setTelegramLinkStatus('Falha ao gerar link. Verifique o token e tente novamente.')
    }
  }

  const copyTelegramActivationLink = async () => {
    if (!telegramActivationLink) {
      setTelegramLinkStatus('Gere o link antes de copiar.')
      return
    }

    try {
      await navigator.clipboard.writeText(telegramActivationLink)
      setTelegramLinkStatus('Link copiado para a area de transferencia.')
    } catch {
      setTelegramLinkStatus('Nao foi possivel copiar o link automaticamente.')
    }
  }

  const onSave = async () => {
    setSaving(true)
    setStatus('')

    const emailUser = form.email_user.trim()
    const emailPassword = form.email_password.trim()
    const normalizedEmailPassword = emailPassword.replace(/\s+/g, '')

    if ((emailUser && !emailPassword) || (!emailUser && emailPassword)) {
      setSaving(false)
      setStatus('Para disparo por email, informe email e senha juntos.')
      return
    }

    if (normalizedEmailPassword && normalizedEmailPassword.length < 16) {
      setSaving(false)
      setStatus('Senha do email invalida para Gmail SMTP. Use App Password (16 caracteres), nao o codigo do Authenticator.')
      return
    }

    const payload = {
      email_smtp_host: form.email_smtp_host.trim() || null,
      email_smtp_port: form.email_smtp_port ? Number(form.email_smtp_port) : null,
      email_user: emailUser || null,
      email_password: normalizedEmailPassword,
      email_from_name: form.email_from_name.trim() || null,
      sms_vonage_key: form.sms_vonage_key.trim() || null,
      sms_vonage_secret: form.sms_vonage_secret,
      sms_default_from: form.sms_default_from.trim() || null,
      telegram_bot_token: form.telegram_bot_token.trim() || null,
    }

    try {
      const res = await patchSenderCredentials(payload)
      const next = res?.data || {}
      setSavedSummary({
        email_user: next?.email_user || '',
        email_user_masked: next?.email_user_masked || '',
        email_password_set: Boolean(next?.email_password_set),
        email_from_name: next?.email_from_name || '',
        sms_vonage_key_masked: next?.sms_vonage_key_masked || '',
        sms_vonage_secret_set: Boolean(next?.sms_vonage_secret_set),
        sms_default_from: next?.sms_default_from || '',
        telegram_bot_token_set: Boolean(next?.telegram_bot_token_set),
      })
      setForm((prev) => ({
        ...prev,
        email_user: next?.email_user || prev.email_user,
        email_from_name: next?.email_from_name || prev.email_from_name,
        email_smtp_host: next?.email_smtp_host || prev.email_smtp_host,
        email_smtp_port: next?.email_smtp_port ? String(next.email_smtp_port) : prev.email_smtp_port,
        sms_default_from: next?.sms_default_from || prev.sms_default_from,
        email_password: '',
        sms_vonage_secret: '',
        telegram_bot_token: '',
      }))
      setIsEditingCredentials(false)
      setStatus('Credenciais de remetente salvas com sucesso.')
    } catch (error) {
      const detail = error?.response?.data?.detail
      setStatus(typeof detail === 'string' ? detail : 'Falha ao salvar credenciais.')
    } finally {
      setSaving(false)
    }
  }

  function startEditingCredentials() {
    setIsEditingCredentials(true)
    setStatus('')
    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function cancelEditingCredentials() {
    setIsEditingCredentials(false)
    setStatus('')
  }

  if (loading) {
    return (
      <div style={{ color: '#9ca3af', fontSize: '14px' }}>
        Carregando credenciais...
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
          Configuracao por usuario
        </div>
        <div style={{ color: '#fff', fontSize: '22px', fontFamily: "'Fira Code', monospace", fontWeight: '700' }}>
          CREDENCIAIS DE REMETENTE
        </div>
      </div>

      {!isAdminUsingEnv && (
        <div style={{ ...cardStyle, marginBottom: '12px' }}>
          <div style={badgeStyle}>
            <Fingerprint size={16} />
            Salvo neste usuario
          </div>
          <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
            <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
              Email: <span style={{ color: '#FFB066' }}>{savedSummary.email_user || 'nao configurado'}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
              Nome exibido: <span style={{ color: '#FFB066' }}>{savedSummary.email_from_name || savedSummary.email_user || 'nao configurado'}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
              Senha do email: <span style={{ color: savedSummary.email_password_set ? '#34d399' : '#fca5a5' }}>{savedSummary.email_password_set ? 'salva' : 'nao salva'}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
              SMS remetente: <span style={{ color: '#FFB066' }}>{savedSummary.sms_default_from || 'nao configurado'}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
              SMS Vonage key/secret: <span style={{ color: savedSummary.sms_vonage_key_masked || savedSummary.sms_vonage_secret_set ? '#34d399' : '#fca5a5' }}>{savedSummary.sms_vonage_key_masked || savedSummary.sms_vonage_secret_set ? 'salvo' : 'nao salvo'}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
              Telegram bot token: <span style={{ color: savedSummary.telegram_bot_token_set ? '#34d399' : '#fca5a5' }}>{savedSummary.telegram_bot_token_set ? 'salvo' : 'nao salvo'}</span>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <AnimatedButton type="button" onClick={startEditingCredentials} style={{ color: '#fff' }}>
              Editar credenciais
            </AnimatedButton>
          </div>
        </div>
      )}

      {isAdminUsingEnv ? (
        <div style={{ ...cardStyle, marginBottom: '12px' }}>
          <div style={badgeStyle}>
            <Fingerprint size={16} />
            Conta administrativa
          </div>
          <div style={{ color: '#e5e7eb', marginTop: '12px', fontSize: '14px', lineHeight: '1.5' }}>
            Esta conta usa as credenciais do servidor (.env). Para credenciais por usuario,
            entre com uma conta de usuario comum.
          </div>
        </div>
      ) : isEditingCredentials ? (
        <>
          <div ref={formSectionRef} style={{ ...cardStyle, marginBottom: '12px', boxShadow: '0 0 0 1px #FF6B0033' }}>
            <div style={{ marginBottom: '12px' }}>
            <div style={{ ...badgeStyle, marginBottom: '12px' }}>
              <Mail size={16} />
              Email SMTP
            </div>
            </div>
            <div style={gridTwoColumns}>
              <Field label="Email remetente">
                <InteractiveInput value={form.email_user} onChange={onChange('email_user')} placeholder="joao@empresa.com" />
              </Field>
              <Field label="Senha do email (app password)">
                <div style={{ position: 'relative' }}>
                  <InteractiveInput
                    value={form.email_password}
                    onChange={onChange('email_password')}
                    placeholder="Digite para atualizar"
                    type={showEmailPassword ? 'text' : 'password'}
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword((prev) => !prev)}
                    aria-label={showEmailPassword ? 'Ocultar senha do email' : 'Ver senha do email'}
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
                      transform: isEmailToggleHovered
                        ? 'translateY(calc(-50% - 1px)) scale(1.04)'
                        : 'translateY(-50%) scale(1)',
                      boxShadow: isEmailToggleHovered ? '0 6px 16px rgba(255,107,0,0.14)' : 'none',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(event) => {
                      setIsEmailToggleHovered(true)
                      event.currentTarget.style.background = '#2a1a0a'
                      event.currentTarget.style.borderColor = '#FF6B0044'
                    }}
                    onMouseLeave={(event) => {
                      setIsEmailToggleHovered(false)
                      event.currentTarget.style.background = '#1a1208'
                      event.currentTarget.style.borderColor = '#2a1a0a'
                    }}
                  >
                    {showEmailPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              <Field label="Nome exibido no remetente">
                <InteractiveInput value={form.email_from_name} onChange={onChange('email_from_name')} placeholder="Opcional: se vazio, usa seu email" />
              </Field>
              <Field label="Servidor SMTP (opcional)">
                <InteractiveInput value={form.email_smtp_host} onChange={onChange('email_smtp_host')} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="Porta SMTP (opcional)">
                <InteractiveInput value={form.email_smtp_port} onChange={onChange('email_smtp_port')} placeholder="465" type="number" min="1" />
              </Field>
            </div>
            <div style={hintStyle}>
              Para enviar email com seu proprio remetente, preencha seu email e sua senha.
              Servidor e porta sao opcionais e, se vazios, usam o padrao do sistema.
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '12px' }}>
            <div style={{ ...badgeStyle, marginBottom: '12px' }}>
              <MessageSquare size={16} />
              SMS (Vonage)
            </div>
            <div style={gridTwoColumns}>
              <Field label="Vonage API Key">
                <InteractiveInput value={form.sms_vonage_key} onChange={onChange('sms_vonage_key')} placeholder="Digite para atualizar" />
              </Field>
              <Field label="Vonage API Secret">
                <InteractiveInput value={form.sms_vonage_secret} onChange={onChange('sms_vonage_secret')} placeholder="Digite para atualizar" type="password" />
              </Field>
              <Field label="Remetente padrao SMS">
                <InteractiveInput value={form.sms_default_from} onChange={onChange('sms_default_from')} placeholder="JOAOEMPRESA ou 5511999999999" />
              </Field>
            </div>
            <div style={hintStyle}>
              O Manshot envia este remetente para o Vonage, mas em conta demo/trial o
              provedor pode sobrescrever o identificador mostrado no topo do SMS
              (ex.: codigo curto como 30342 e texto FREE SMS DEMO).
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '12px' }}>
            <div style={{ ...badgeStyle, marginBottom: '12px' }}>
              <Send size={16} />
              Telegram
            </div>
            <div style={sectionTitleStyle}>Bot token do usuario</div>
            <Field label="Token do bot Telegram">
              <InteractiveInput value={form.telegram_bot_token} onChange={onChange('telegram_bot_token')} placeholder="Digite para atualizar" type="password" />
            </Field>
            <div style={hintStyle}>
              O contato precisa abrir seu bot no Telegram e clicar em /start antes de
              receber mensagens.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              <AnimatedButton type="button" onClick={buildTelegramActivationLink} style={{ background: '#1a1208', color: '#FFB066' }}>
                Gerar link de ativacao
              </AnimatedButton>
              <AnimatedButton type="button" onClick={copyTelegramActivationLink} disabled={!telegramActivationLink} style={{ background: '#1a1208', color: '#FFB066' }}>
                Copiar link
              </AnimatedButton>
              {telegramActivationLink ? (
                <a href={telegramActivationLink} target="_blank" rel="noreferrer" style={{ color: '#FFB066', fontSize: '12px', textDecoration: 'underline' }}>
                  Abrir link
                </a>
              ) : null}
            </div>
            {telegramLinkStatus ? (
              <div style={{ color: telegramLinkStatus.toLowerCase().includes('pronto') || telegramLinkStatus.toLowerCase().includes('copiado') ? '#34d399' : '#fca5a5', fontSize: '12px', marginTop: '8px' }}>
                {telegramLinkStatus}
              </div>
            ) : null}
          </div>

          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              {hasAnySenderConfig
                ? 'Se preenchido, esses dados definem o remetente dos seus disparos.'
                : 'Preencha pelo menos um canal para usar remetente proprio por usuario.'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <AnimatedButton
                type="button"
                onClick={onSave}
                disabled={saving}
                style={{ color: '#fff' }}
              >
                {saving ? 'Salvando...' : 'Salvar credenciais'}
              </AnimatedButton>
              <AnimatedButton
                type="button"
                onClick={cancelEditingCredentials}
                disabled={saving}
                style={{ background: '#1a1208', color: '#FFB066' }}
              >
                Cancelar edição
              </AnimatedButton>
            </div>
          </div>
        </>
      ) : (
        <div style={{ ...cardStyle, marginBottom: '12px' }}>
          <div style={{ color: '#e5e7eb', fontSize: '14px', lineHeight: '1.6' }}>
            As credenciais ficam salvas neste usuario. Clique em <span style={{ color: '#FFB066' }}>Editar credenciais</span> para alterar o remetente do Email, SMS e Telegram.
          </div>
        </div>
      )}

      {status ? (
        <div style={{ color: status.toLowerCase().includes('sucesso') ? '#34d399' : '#fca5a5', fontSize: '13px', marginTop: '10px' }}>
          {status}
        </div>
      ) : null}
    </div>
  )
}
