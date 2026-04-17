// Navbar.jsx — Manshot Orange Theme

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, User, Users, LogOut, FileText, Fingerprint, Camera } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import logo from '../assets/logo-manshot.png'
import { activateStoredAccountSession, clearToken, deriveAccountDisplayName, getMe, getStoredAccounts, googleLogin, inferAccountProviderByEmail, rememberAccount, removeStoredAccount, saveToken, setAuthProvider } from '../services/api'

const links = [
  { path: '/', icon: '⚡', label: 'Dashboard' },
  { path: '/contacts', icon: '👥', label: 'Contatos' },
  { path: '/campaigns', icon: '📡', label: 'Campanhas' },
  { path: '/credentials', icon: Fingerprint, label: 'Credenciais', iconKind: 'component' },
]

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

function getProfileForEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) return { displayName: '', avatarDataUrl: '' }

  const profile = readProfilePrefs()[normalizedEmail]
  return {
    displayName: (profile?.displayName || '').trim(),
    avatarDataUrl: (profile?.avatarDataUrl || '').trim(),
  }
}

function saveProfileForEmail(email, payload) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail || typeof window === 'undefined') return

  const current = readProfilePrefs()
  current[normalizedEmail] = {
    displayName: (payload?.displayName || '').trim(),
    avatarDataUrl: (payload?.avatarDataUrl || '').trim(),
  }
  localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(current))
}

function computeAvatarInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word?.[0])
    .join('')
    .toUpperCase() || 'MA'
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const profilePhotoInputRef = useRef(null)
  const [accountEmail, setAccountEmail] = useState('Carregando conta...')
  const [accountName, setAccountName] = useState('Conta conectada')
  const [accountAvatarDataUrl, setAccountAvatarDataUrl] = useState('')
  const [recentAccounts, setRecentAccounts] = useState([])
  const [isAccountHovered, setIsAccountHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileNameDraft, setProfileNameDraft] = useState('')
  const [profileAvatarDraft, setProfileAvatarDraft] = useState('')
  const [profileStatus, setProfileStatus] = useState('')
  const [isProfileNameHovered, setIsProfileNameHovered] = useState(false)
  const [isProfileNameFocused, setIsProfileNameFocused] = useState(false)
  const [isProfilePhotoHovered, setIsProfilePhotoHovered] = useState(false)
  const [isProfileCancelHovered, setIsProfileCancelHovered] = useState(false)
  const [isProfileCancelPressed, setIsProfileCancelPressed] = useState(false)
  const [isProfileSaveHovered, setIsProfileSaveHovered] = useState(false)
  const [isProfileSavePressed, setIsProfileSavePressed] = useState(false)
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false)
  const [isLogoutBtnHovered, setIsLogoutBtnHovered] = useState(false)
  const [isLogoutBtnPressed, setIsLogoutBtnPressed] = useState(false)
  const [isCancelBtnHovered, setIsCancelBtnHovered] = useState(false)
  const [isCancelBtnPressed, setIsCancelBtnPressed] = useState(false)
  const [isAddAccountHovered, setIsAddAccountHovered] = useState(false)
  const [isAddAccountPressed, setIsAddAccountPressed] = useState(false)
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const [emailToRemove, setEmailToRemove] = useState('')
  const [isRemoveBtnHovered, setIsRemoveBtnHovered] = useState(false)
  const [isRemoveBtnPressed, setIsRemoveBtnPressed] = useState(false)
  const [isRemoveCancelBtnHovered, setIsRemoveCancelBtnHovered] = useState(false)
  const [isRemoveCancelBtnPressed, setIsRemoveCancelBtnPressed] = useState(false)
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false)
  const [switchingAccountName, setSwitchingAccountName] = useState('')

  useEffect(() => {
    let mounted = true

    getMe()
      .then((res) => {
        if (!mounted) return
        const email = res?.data?.email
        const derivedName = deriveAccountDisplayName(email)
        const profile = getProfileForEmail(email)
        const displayName = profile.displayName || derivedName
        const knownAccount = getStoredAccounts().find((account) => account.email === email)
        const provider = knownAccount?.provider || inferAccountProviderByEmail(email)
        setAccountEmail(email || 'Conta conectada')
        setAccountName(displayName)
        setAccountAvatarDataUrl(profile.avatarDataUrl || '')
        if (email) {
          setRecentAccounts(rememberAccount({ email, name: displayName, provider }))
        }
      })
      .catch(() => {
        if (!mounted) return
        setAccountEmail('Conta conectada')
        setAccountName('Conta conectada')
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setRecentAccounts(getStoredAccounts())
  }, [])

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleLogoutClick = () => {
    setIsConfirmLogoutOpen(true)
    setIsMenuOpen(false)
  }

  const handleTermsClick = () => {
    setIsTermsOpen(true)
    setIsMenuOpen(false)
  }

  const handleProfileClick = () => {
    setProfileNameDraft(accountName)
    setProfileAvatarDraft(accountAvatarDataUrl)
    setProfileStatus('')
    setIsProfileOpen(true)
    setIsMenuOpen(false)
  }

  const closeProfile = () => {
    setIsProfileOpen(false)
    setProfileStatus('')
  }

  const onSelectProfilePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileStatus('Selecione um arquivo de imagem para a foto de perfil.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      setProfileAvatarDraft(value)
      setProfileStatus('')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const saveProfile = () => {
    const nextName = (profileNameDraft || '').trim()
    if (!nextName) {
      setProfileStatus('Informe um nome de exibicao para salvar o perfil.')
      return
    }

    const normalizedEmail = (accountEmail || '').trim().toLowerCase()
    saveProfileForEmail(normalizedEmail, {
      displayName: nextName,
      avatarDataUrl: profileAvatarDraft,
    })

    setAccountName(nextName)
    setAccountAvatarDataUrl(profileAvatarDraft)
    setRecentAccounts((prev) => prev.map((item) => (
      item.email === normalizedEmail
        ? { ...item, name: nextName }
        : item
    )))
    rememberAccount({ email: normalizedEmail, name: nextName })
    closeProfile()
  }

  const confirmLogout = () => {
    clearToken()
    setIsConfirmLogoutOpen(false)
    navigate('/login')
  }

  const cancelLogout = () => {
    setIsConfirmLogoutOpen(false)
  }

  const closeTerms = () => {
    setIsTermsOpen(false)
  }

  const openAddAccountModal = () => {
    setIsAddAccountModalOpen(true)
    setIsMenuOpen(false)
  }

  const closeAddAccountModal = () => {
    setIsAddAccountModalOpen(false)
  }

  const startAccountSwitchTransition = (targetAccountName = '') => {
    const safeName = (targetAccountName || '').trim()
    setSwitchingAccountName(safeName)
    setIsSwitchingAccount(true)

    window.setTimeout(() => {
      window.location.reload()
    }, 900)
  }

  const handleEmailAccount = () => {
    setIsAddAccountModalOpen(false)
    navigate('/login')
  }

  const handleSelectStoredAccount = async (account, isCurrentAccount) => {
    if (isCurrentAccount) {
      return
    }

    closeAddAccountModal()

    const switchedWithStoredSession = activateStoredAccountSession(account?.email)
    if (switchedWithStoredSession) {
      try {
        const me = await getMe()
        const activeEmail = me?.data?.email || account?.email || 'Conta conectada'
        const profile = getProfileForEmail(activeEmail)
        const displayName = profile.displayName || deriveAccountDisplayName(activeEmail)
        const provider = account?.provider || inferAccountProviderByEmail(activeEmail)
        setAccountEmail(activeEmail)
        setAccountName(displayName)
        setAccountAvatarDataUrl(profile.avatarDataUrl || '')
        setRecentAccounts(rememberAccount({ email: activeEmail, name: displayName, provider }))
        setIsMenuOpen(false)
        startAccountSwitchTransition(displayName)
        return
      } catch {
        // Se a sessão salva expirou, cai no fluxo padrão de autenticação.
      }
    }

    const currentAccountProvider = inferAccountProviderByEmail(accountEmail)
    if (currentAccountProvider === 'local') {
      addAnotherAccount()
      return
    }

    if (account?.provider === 'google') {
      addAnotherAccount()
      return
    }

    navigate('/login', {
      state: {
        prefillEmail: account?.email || '',
        forceLocal: true,
      },
    })
  }

  const handleRemoveStoredAccount = (email) => {
    setEmailToRemove(email)
    setIsConfirmRemoveOpen(true)
  }

  const confirmRemoveAccount = () => {
    const nextAccounts = removeStoredAccount(emailToRemove)
    setRecentAccounts(nextAccounts)
    setIsConfirmRemoveOpen(false)
    setEmailToRemove('')
  }

  const cancelRemoveAccount = () => {
    setIsConfirmRemoveOpen(false)
    setEmailToRemove('')
  }

  const addAnotherAccount = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        const res = await googleLogin(tokenResponse.access_token)
        saveToken(res.data.access_token)
        setAuthProvider('google')
        const me = await getMe()
        const email = me?.data?.email || 'Conta conectada'
        const profile = getProfileForEmail(email)
        const displayName = profile.displayName || deriveAccountDisplayName(email)
        setAccountEmail(email)
        setAccountName(displayName)
        setAccountAvatarDataUrl(profile.avatarDataUrl || '')
        setRecentAccounts(rememberAccount({ email, name: displayName, provider: 'google', token: res.data.access_token }))
        setIsMenuOpen(false)
        startAccountSwitchTransition(displayName)
      } catch {
        // Mantém a conta atual caso o fluxo de troca falhe.
      }
    },
  })

  return (
    <aside style={{
      width: '180px',
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 12px',
      gap: '4px',
      borderRight: '1px solid #2a1a0a',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Logo */}
      <div style={{
        width: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1208',
        border: '1px solid #2a1a0a',
        padding: '8px',
      }}>
        <img src={logo} alt="Manshot" style={{ width: '100%', objectFit: 'contain' }} />
      </div>

      {/* Links */}
      {links.map(link => {
        const active = location.pathname === link.path
        return (
          <Link
            key={link.path}
            to={link.path}
            style={{
              width: '100%',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: active ? '600' : '400',
              color: active ? '#FF6B00' : '#6b7280',
              background: active ? '#FF6B0015' : 'transparent',
              border: active ? '1px solid #FF6B0033' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.color = '#e5e7eb'
                e.currentTarget.style.background = '#1a1208'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.color = '#6b7280'
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {link.iconKind === 'component' ? (
              <link.icon size={16} strokeWidth={2.2} />
            ) : (
              <span style={{ fontSize: '16px' }}>{link.icon}</span>
            )}
            <span>{link.label}</span>
          </Link>
        )
      })}

      <div
        ref={menuRef}
        style={{
          marginTop: 'auto',
          width: '100%',
          borderRadius: '12px',
          padding: '10px 12px',
          background: isAccountHovered ? '#1a2233' : '#131a27',
          border: isAccountHovered ? '1px solid #FF6B0038' : '1px solid #2a1a0a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transform: isAccountHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0) scale(1)',
          boxShadow: isAccountHovered ? '0 10px 26px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,107,0,0.08)' : 'none',
          transition: 'all 0.18s ease',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={() => setIsAccountHovered(true)}
        onMouseLeave={() => setIsAccountHovered(false)}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#FF6B00',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '700',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {accountAvatarDataUrl ? (
            <img src={accountAvatarDataUrl} alt="Foto do perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            computeAvatarInitials(accountName)
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            title={accountEmail}
            style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: '500', fontFamily: "'Inter', 'Segoe UI', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {accountName}
          </div>
          <div style={{ color: '#FFB37D', fontSize: '11px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            Free
          </div>
        </div>

        <div style={{ marginLeft: 'auto', color: '#FFB37D', fontSize: '20px', lineHeight: 1 }}>
          ›
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            left: 'calc(100% + 12px)',
            bottom: '0',
            width: '332px',
            background: '#131a27',
            border: '1px solid #2a1a0a',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 18px 48px rgba(0,0,0,0.52)',
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease',
          }}>
            <style>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <button
              onClick={handleProfileClick}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #2a1a0a',
                color: '#f3f4f6',
                fontSize: '15px',
                fontWeight: '400',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1a2233'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <User size={20} strokeWidth={1.8} />
              <span>Perfil</span>
            </button>
            <button
              onClick={openAddAccountModal}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #2a1a0a',
                color: '#f3f4f6',
                fontSize: '15px',
                fontWeight: '400',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1a2233'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Users size={20} strokeWidth={1.8} />
              <span>Contas logadas</span>
            </button>
            <button
              onClick={handleTermsClick}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                color: '#f3f4f6',
                fontSize: '15px',
                fontWeight: '400',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
                ':hover': {
                  background: '#FF6B0015',
                }
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1a2233'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <FileText size={20} strokeWidth={1.8} />
              <span>Termos e politicas</span>
            </button>
            <button
              onClick={handleLogoutClick}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                color: '#f3f4f6',
                fontSize: '15px',
                fontWeight: '400',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
                ':hover': {
                  background: '#FF6B0015',
                }
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1a2233'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={20} strokeWidth={1.8} />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Profile Modal */}
          {isProfileOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4,8,16,0.96)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2147483647,
              animation: 'fadeInOverlay 0.2s ease',
            }}>
              <style>{`
                @keyframes fadeInOverlay {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideInModal {
                  from {
                    opacity: 0;
                    transform: scale(0.95) translateY(6px);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }
              `}</style>
              <div style={{
                background: '#1d1f24',
                border: '1px solid #2a1a0a',
                borderRadius: '18px',
                padding: '24px',
                width: 'min(92vw, 560px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
                animation: 'slideInModal 0.2s ease',
              }}>
                <div style={{ color: '#e5e7eb', fontSize: '18px', marginBottom: '20px', fontFamily: "'Fira Code', monospace", fontWeight: '700', letterSpacing: '0.04em' }}>Editar Perfil</div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '148px',
                      height: '148px',
                      borderRadius: '50%',
                      background: profileAvatarDraft ? '#ffffff' : '#FF6B00',
                      color: profileAvatarDraft ? '#fff' : '#ffffff',
                      border: profileAvatarDraft ? 'none' : '1px solid #ffb37d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '44px',
                      boxShadow: isProfilePhotoHovered ? '0 0 0 3px rgba(255,107,0,0.22), 0 12px 30px rgba(255,107,0,0.14)' : 'none',
                      transform: isProfilePhotoHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0) scale(1)',
                      transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                      overflow: 'hidden',
                    }}>
                      {profileAvatarDraft ? (
                        <img src={profileAvatarDraft} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        computeAvatarInitials(profileNameDraft || accountName)
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        bottom: '6px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid #4b5563',
                        background: isProfilePhotoHovered ? '#FF6B00' : '#1f232d',
                        color: isProfilePhotoHovered ? '#fff' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isProfilePhotoHovered ? '0 8px 20px rgba(255,107,0,0.22)' : 'none',
                        transform: isProfilePhotoHovered ? 'translateY(-1px) scale(1.05)' : 'translateY(0) scale(1)',
                        transition: 'all 0.16s ease',
                      }}
                      onMouseEnter={() => setIsProfilePhotoHovered(true)}
                      onMouseLeave={() => setIsProfilePhotoHovered(false)}
                    >
                      <Camera size={18} />
                    </button>
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onSelectProfilePhoto}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{
                    border: isProfileNameFocused || isProfileNameHovered ? '1px solid #FF6B00' : '1px solid #3f3f46',
                    boxShadow: isProfileNameFocused ? '0 0 0 3px rgba(255,107,0,0.22), 0 10px 24px rgba(255,107,0,0.10)' : isProfileNameHovered ? '0 6px 18px rgba(255,107,0,0.10)' : 'none',
                    transform: isProfileNameFocused || isProfileNameHovered ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'all 0.16s ease',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: '13px', marginBottom: '6px', fontFamily: "'Fira Code', monospace", fontWeight: '700', letterSpacing: '0.03em' }}>Nome de exibição:</label>
                    <input
                      value={profileNameDraft}
                      onChange={(event) => setProfileNameDraft(event.target.value)}
                      placeholder="Digite seu nome"
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: '#f3f4f6',
                        fontSize: '31px',
                        outline: 'none',
                        padding: 0,
                        fontFamily: "'Fira Code', monospace",
                        transition: 'color 0.16s ease, letter-spacing 0.16s ease',
                        letterSpacing: isProfileNameFocused || isProfileNameHovered ? '0.01em' : '0',
                      }}
                      onMouseEnter={() => setIsProfileNameHovered(true)}
                      onMouseLeave={() => setIsProfileNameHovered(false)}
                      onFocus={() => setIsProfileNameFocused(true)}
                      onBlur={() => setIsProfileNameFocused(false)}
                    />
                  </div>

                  <div style={{
                    border: '1px solid #3f3f46',
                    boxShadow: isProfileNameHovered ? '0 6px 18px rgba(255,107,0,0.06)' : 'none',
                    transform: isProfileNameHovered ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'all 0.16s ease',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: '13px', marginBottom: '6px', fontFamily: "'Fira Code', monospace", fontWeight: '700', letterSpacing: '0.03em' }}>Nome de usuário:</label>
                    <div style={{ color: '#f3f4f6', fontSize: '30px', fontFamily: "'Fira Code', monospace" }}>
                      {String(accountEmail || '').split('@')[0] || 'usuario'}
                    </div>
                  </div>
                </div>

                {profileStatus ? (
                  <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '10px' }}>
                    {profileStatus}
                  </div>
                ) : null}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={closeProfile}
                    style={{
                      background: isProfileCancelHovered ? '#1a1208' : '#2a2f3a',
                      color: isProfileCancelHovered ? '#fff' : '#f3f4f6',
                      border: isProfileCancelHovered ? '1px solid #FF6B00' : '1px solid #4b5563',
                      borderRadius: '999px',
                      padding: '10px 20px',
                      fontSize: '16px',
                      fontFamily: "'Fira Code', monospace",
                      transform: isProfileCancelPressed ? 'translateY(1px) scale(0.98)' : isProfileCancelHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isProfileCancelHovered ? '0 8px 22px rgba(255,107,0,0.14)' : 'none',
                      transition: 'all 0.16s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setIsProfileCancelHovered(true)}
                    onMouseLeave={() => {
                      setIsProfileCancelHovered(false)
                      setIsProfileCancelPressed(false)
                    }}
                    onMouseDown={() => setIsProfileCancelPressed(true)}
                    onMouseUp={() => setIsProfileCancelPressed(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    style={{
                      background: isProfileSaveHovered ? '#FF6B00' : '#f3f4f6',
                      color: isProfileSaveHovered ? '#fff' : '#0f172a',
                      border: isProfileSaveHovered ? '1px solid #FF6B00' : '1px solid #f3f4f6',
                      borderRadius: '999px',
                      padding: '10px 20px',
                      fontSize: '16px',
                      fontWeight: '600',
                      fontFamily: "'Fira Code', monospace",
                      transform: isProfileSavePressed ? 'translateY(1px) scale(0.98)' : isProfileSaveHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isProfileSaveHovered ? '0 10px 24px rgba(255,107,0,0.26)' : 'none',
                      transition: 'all 0.16s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setIsProfileSaveHovered(true)}
                    onMouseLeave={() => {
                      setIsProfileSaveHovered(false)
                      setIsProfileSavePressed(false)
                    }}
                    onMouseDown={() => setIsProfileSavePressed(true)}
                    onMouseUp={() => setIsProfileSavePressed(false)}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Account Modal */}
          {isAddAccountModalOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'transparent',
              backdropFilter: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              padding: '24px 24px 24px 192px',
              zIndex: 2147483647,
              animation: 'fadeInOverlay 0.2s ease',
              pointerEvents: 'auto',
            }}>
              <div style={{
                background: '#131a27',
                border: '1px solid #2a1a0a',
                borderRadius: '22px',
                padding: '14px 14px 12px',
                width: 'min(92vw, 390px)',
                boxShadow: '0 28px 90px rgba(0,0,0,0.65)',
                animation: 'slideInModal 0.2s ease',
                position: 'relative',
                fontFamily: "'Space Mono', monospace",
                marginBottom: '0',
              }}>
                <button
                  type="button"
                  onClick={closeAddAccountModal}
                  aria-label="Fechar"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '28px',
                    height: '28px',
                    border: 'none',
                    background: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '22px',
                    lineHeight: 1,
                    borderRadius: '8px',
                    transition: 'all 0.16s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FF6B00'
                    e.currentTarget.style.background = '#FF6B0015'
                    e.currentTarget.style.transform = 'scale(1.08) rotate(3deg)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#9ca3af'
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                  }}
                >
                  ×
                </button>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingRight: '36px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    color: '#f3f4f6',
                    fontSize: '18px',
                    fontWeight: '500',
                    lineHeight: 1.2,
                  }}>
                    Selecionar conta
                  </div>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.4,
                  }}>
                    Escolha a conta que você quer usar no Manshot.
                  </div>
                </div>

                <div style={{
                  background: '#101622',
                  border: '1px solid #2a1a0a',
                  borderRadius: '18px',
                  overflow: 'hidden',
                }}>
                  {(recentAccounts.length ? recentAccounts : [{ email: accountEmail, name: accountName, provider: 'local' }]).map((account, index) => {
                    const isCurrentAccount = account.email === accountEmail || index === 0
                    const profile = getProfileForEmail(account.email)
                    const avatarDataUrl = profile.avatarDataUrl
                    const accountDisplayName = profile.displayName || account.name || account.email
                    const avatarText = computeAvatarInitials(accountDisplayName || account.email)

                    return (
                      <div
                        key={account.email}
                        onClick={() => handleSelectStoredAccount(account, isCurrentAccount)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isCurrentAccount ? '#1a2233' : 'transparent',
                          color: '#fff',
                          cursor: isCurrentAccount ? 'default' : 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.16s ease, transform 0.16s ease',
                        }}
                        onMouseEnter={e => {
                          if (!isCurrentAccount) {
                            e.currentTarget.style.background = '#161f30'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isCurrentAccount) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                            background: profileAvatarDraft ? '#FF6B00' : '#FF6B00',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '700',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {avatarDataUrl ? (
                            <img src={avatarDataUrl} alt="Foto da conta" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            avatarText || 'MA'
                          )}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            color: '#f3f4f6',
                            fontSize: '15px',
                            lineHeight: 1.2,
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {accountDisplayName}
                          </div>
                          <div style={{
                            color: '#d1d5db',
                            fontSize: '13px',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {account.email}
                          </div>
                        </div>

                        {isCurrentAccount ? (
                          <span style={{
                            color: '#FFB37D',
                            fontSize: '20px',
                            lineHeight: 1,
                            marginLeft: '6px',
                          }}>
                            ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleRemoveStoredAccount(account.email)
                            }}
                            aria-label={`Remover ${account.name || account.email}`}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#9ca3af',
                              cursor: 'pointer',
                              fontSize: '18px',
                              lineHeight: 1,
                              padding: '4px 6px',
                              borderRadius: '6px',
                              transition: 'all 0.16s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = '#FF6B00'
                              e.currentTarget.style.background = '#FF6B0012'
                              e.currentTarget.style.transform = 'scale(1.06)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = '#9ca3af'
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{
                  height: '1px',
                  background: '#2a1a0a',
                  margin: '10px 0 4px',
                }} />

                <button
                  type="button"
                  onClick={() => {
                    closeAddAccountModal()
                    addAnotherAccount()
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#d1d5db',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 10px',
                    fontSize: '15px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'left',
                    transition: 'all 0.16s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1a2233'
                    e.currentTarget.style.color = '#FFB37D'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#d1d5db'
                  }}
                >
                  <Plus size={20} strokeWidth={1.8} />
                  <span>Adicionar conta Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleEmailAccount}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#d1d5db',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 10px',
                    fontSize: '15px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'left',
                    transition: 'all 0.16s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1a2233'
                    e.currentTarget.style.color = '#FFB37D'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#d1d5db'
                  }}
                >
                  <Plus size={20} strokeWidth={1.8} />
                  <span>Adicionar com e-mail</span>
                </button>
              </div>
            </div>
          )}

          {/* Logout Confirmation Modal */}
          {isConfirmLogoutOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4,8,16,0.96)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2147483647,
              animation: 'fadeInOverlay 0.2s ease',
            }}>
              <style>{`
                @keyframes fadeInOverlay {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideInModal {
                  from {
                    opacity: 0;
                    transform: scale(0.95) translateY(6px);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }
              `}</style>
              <div style={{
                background: '#131a27',
                border: '1px solid #2a1a0a',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '420px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
                animation: 'slideInModal 0.2s ease',
              }}>
                <h2 style={{
                  color: '#e5e7eb',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  lineHeight: '1.4',
                }}>
                  Tem certeza de que deseja sair?
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '14px',
                  marginBottom: '28px',
                  lineHeight: '1.5',
                }}>
                  Sair do Manshot com {accountEmail}?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: 'column',
                }}>
                  <button
                    onClick={confirmLogout}
                    style={{
                      padding: '12px 16px',
                      background: '#FF6B00',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      transform: isLogoutBtnPressed ? 'translateY(1px) scale(0.98)' : isLogoutBtnHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isLogoutBtnHovered ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                    }}
                    onMouseEnter={() => setIsLogoutBtnHovered(true)}
                    onMouseLeave={() => {
                      setIsLogoutBtnHovered(false)
                      setIsLogoutBtnPressed(false)
                    }}
                    onMouseDown={() => setIsLogoutBtnPressed(true)}
                    onMouseUp={() => setIsLogoutBtnPressed(false)}
                  >
                    Sair
                  </button>
                  <button
                    onClick={cancelLogout}
                    style={{
                      padding: '12px 16px',
                      background: isCancelBtnHovered ? '#1a1208' : 'transparent',
                      color: isCancelBtnPressed ? '#FF6B00' : isCancelBtnHovered ? '#e5e7eb' : '#9ca3af',
                      border: '1px solid #2a1a0a',
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      transform: isCancelBtnPressed ? 'translateY(1px) scale(0.98)' : isCancelBtnHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isCancelBtnHovered ? '0 8px 24px rgba(255,107,0,0.15)' : 'none',
                    }}
                    onMouseEnter={() => setIsCancelBtnHovered(true)}
                    onMouseLeave={() => {
                      setIsCancelBtnHovered(false)
                      setIsCancelBtnPressed(false)
                    }}
                    onMouseDown={() => setIsCancelBtnPressed(true)}
                    onMouseUp={() => setIsCancelBtnPressed(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remove Account Confirmation Modal */}
          {isConfirmRemoveOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4,8,16,0.96)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2147483647,
              animation: 'fadeInOverlay 0.2s ease',
            }}>
              <div style={{
                background: '#131a27',
                border: '1px solid #2a1a0a',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '420px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
                animation: 'slideInModal 0.2s ease',
              }}>
                <h2 style={{
                  color: '#e5e7eb',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  lineHeight: '1.4',
                }}>
                  Remover conta?
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '14px',
                  marginBottom: '28px',
                  lineHeight: '1.5',
                }}>
                  Tem certeza que deseja remover {emailToRemove}?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: 'column',
                }}>
                  <button
                    onClick={confirmRemoveAccount}
                    style={{
                      padding: '12px 16px',
                      background: '#FF6B00',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      transform: isRemoveBtnPressed ? 'translateY(1px) scale(0.98)' : isRemoveBtnHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isRemoveBtnHovered ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                    }}
                    onMouseEnter={() => setIsRemoveBtnHovered(true)}
                    onMouseLeave={() => {
                      setIsRemoveBtnHovered(false)
                      setIsRemoveBtnPressed(false)
                    }}
                    onMouseDown={() => setIsRemoveBtnPressed(true)}
                    onMouseUp={() => setIsRemoveBtnPressed(false)}
                  >
                    Remover
                  </button>
                  <button
                    onClick={cancelRemoveAccount}
                    style={{
                      padding: '12px 16px',
                      background: isRemoveCancelBtnHovered ? '#1a1208' : 'transparent',
                      color: isRemoveCancelBtnPressed ? '#FF6B00' : isRemoveCancelBtnHovered ? '#e5e7eb' : '#9ca3af',
                      border: '1px solid #2a1a0a',
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      transform: isRemoveCancelBtnPressed ? 'translateY(1px) scale(0.98)' : isRemoveCancelBtnHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isRemoveCancelBtnHovered ? '0 8px 24px rgba(255,107,0,0.15)' : 'none',
                    }}
                    onMouseEnter={() => setIsRemoveCancelBtnHovered(true)}
                    onMouseLeave={() => {
                      setIsRemoveCancelBtnHovered(false)
                      setIsRemoveCancelBtnPressed(false)
                    }}
                    onMouseDown={() => setIsRemoveCancelBtnPressed(true)}
                    onMouseUp={() => setIsRemoveCancelBtnPressed(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Switching Overlay */}
          {isSwitchingAccount && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4,8,16,0.96)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2147483647,
              animation: 'fadeInOverlay 0.2s ease',
            }}>
              <style>{`
                @keyframes manshotSpin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{
                background: '#131a27',
                border: '1px solid #2a1a0a',
                borderRadius: '18px',
                padding: '26px 28px',
                width: 'min(92vw, 420px)',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '3px solid #2a1a0a',
                  borderTopColor: '#FF6B00',
                  margin: '0 auto 14px',
                  animation: 'manshotSpin 0.9s linear infinite',
                }} />
                <div style={{
                  color: '#f3f4f6',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}>
                  Alternando conta
                </div>
                <div style={{
                  color: '#9ca3af',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}>
                  {switchingAccountName
                    ? `Atualizando dados de ${switchingAccountName}...`
                    : 'Atualizando dados da nova conta...'}
                </div>
              </div>
            </div>
          )}

          {/* Terms and Policies Modal */}
          {isTermsOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4,8,16,0.98)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2147483647,
              animation: 'fadeInOverlay 0.2s ease',
            }}>
              <div style={{
                position: 'relative',
                zIndex: 2147483647,
                background: '#131a27',
                border: '1px solid #2a1a0a',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '560px',
                width: '92%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                animation: 'slideInModal 0.2s ease',
              }}>
                <h2 style={{
                  color: '#e5e7eb',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  lineHeight: '1.3',
                }}>
                  Termos e Politicas do Manshot
                </h2>

                <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                  Ao utilizar o Manshot, voce concorda com as diretrizes abaixo para uso responsavel da plataforma.
                </p>

                <div style={{
                  border: '1px solid #2a1a0a',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  background: '#101622',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  marginBottom: '14px',
                }}>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    <strong style={{ color: '#FF6B00' }}>1. Privacidade:</strong> seus dados de contatos e campanhas sao tratados para operacao da conta e nao devem ser compartilhados sem autorizacao.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    <strong style={{ color: '#FF6B00' }}>2. Boas praticas:</strong> e proibido o uso para spam, fraude, conteudo abusivo ou qualquer acao que viole leis locais.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    <strong style={{ color: '#FF6B00' }}>3. Responsabilidade:</strong> cada usuario e responsavel pelas mensagens enviadas e pelo consentimento dos destinatarios.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    <strong style={{ color: '#FF6B00' }}>4. Seguranca da conta:</strong> mantenha credenciais em sigilo e reporte acessos suspeitos imediatamente.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: 0 }}>
                    <strong style={{ color: '#FF6B00' }}>5. Atualizações:</strong> estes termos podem ser ajustados para melhorias do servico e conformidade legal.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeTerms}
                    style={{
                      padding: '10px 16px',
                      background: '#FF6B00',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '22px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FF5500'
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#FF6B00'
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body,
      )}
    </aside>
  )
}