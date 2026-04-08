// Navbar.jsx — Manshot Orange Theme

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, LogOut, FileText } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import logo from '../assets/logo-manshot.png'
import { deriveAccountDisplayName, getMe, getStoredAccounts, googleLogin, rememberAccount, saveToken } from '../services/api'

const links = [
  { path: '/', icon: '⚡', label: 'Dashboard' },
  { path: '/contacts', icon: '👥', label: 'Contatos' },
  { path: '/campaigns', icon: '📡', label: 'Campanhas' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [accountEmail, setAccountEmail] = useState('Carregando conta...')
  const [accountName, setAccountName] = useState('Conta conectada')
  const [recentAccounts, setRecentAccounts] = useState([])
  const [isAccountHovered, setIsAccountHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false)
  const [isLogoutBtnHovered, setIsLogoutBtnHovered] = useState(false)
  const [isLogoutBtnPressed, setIsLogoutBtnPressed] = useState(false)
  const [isCancelBtnHovered, setIsCancelBtnHovered] = useState(false)
  const [isCancelBtnPressed, setIsCancelBtnPressed] = useState(false)
  const [isAddAccountHovered, setIsAddAccountHovered] = useState(false)
  const [isAddAccountPressed, setIsAddAccountPressed] = useState(false)
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    getMe()
      .then((res) => {
        if (!mounted) return
        const email = res?.data?.email
        const displayName = deriveAccountDisplayName(email)
        setAccountEmail(email || 'Conta conectada')
        setAccountName(displayName)
        if (email) {
          setRecentAccounts(rememberAccount({ email, name: displayName }))
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

  const confirmLogout = () => {
    localStorage.removeItem('token')
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

  const handleEmailAccount = () => {
    setIsAddAccountModalOpen(false)
    navigate('/login')
  }

  const addAnotherAccount = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        const res = await googleLogin(tokenResponse.access_token)
        saveToken(res.data.access_token)
        const me = await getMe()
        const email = me?.data?.email || 'Conta conectada'
        const displayName = deriveAccountDisplayName(email)
        setAccountEmail(email)
        setAccountName(displayName)
        setRecentAccounts(rememberAccount({ email, name: displayName }))
        setIsMenuOpen(false)
        navigate('/', { replace: true })
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
            <span style={{ fontSize: '16px' }}>{link.icon}</span>
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
        }}>
          {accountName.split(' ').slice(0, 2).map(word => word?.[0]).join('').toUpperCase() || 'MA'}
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
              <Plus size={20} strokeWidth={1.8} />
              <span>Adicionar outra conta</span>
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
                  {(recentAccounts.length ? recentAccounts : [{ email: accountEmail, name: accountName }]).map((account, index) => {
                    const isCurrentAccount = account.email === accountEmail || index === 0
                    const avatarText = (account.name || account.email || 'M')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase()

                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => {
                          if (!isCurrentAccount) {
                            closeAddAccountModal()
                            addAnotherAccount()
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          border: 'none',
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
                          background: '#FF6B00',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}>
                          {avatarText || 'MA'}
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
                            {account.name || account.email}
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
                        ) : null}
                      </button>
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
                    color: '#ffffff',
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
                    transition: 'background 0.16s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1a2233'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Plus size={20} strokeWidth={1.8} />
                  <span>Adicionar outra conta</span>
                </button>

                <button
                  type="button"
                  onClick={handleEmailAccount}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#d1d5db',
                    border: 'none',
                    padding: '2px 10px 8px 44px',
                    fontSize: '13px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.16s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FFB37D'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#d1d5db'
                  }}
                >
                  Adicionar com e-mail
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
                    1. Privacidade: seus dados de contatos e campanhas sao tratados para operacao da conta e nao devem ser compartilhados sem autorizacao.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    2. Boas praticas: e proibido o uso para spam, fraude, conteudo abusivo ou qualquer acao que viole leis locais.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    3. Responsabilidade: cada usuario e responsavel pelas mensagens enviadas e pelo consentimento dos destinatarios.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: '10px' }}>
                    4. Seguranca da conta: mantenha credenciais em sigilo e reporte acessos suspeitos imediatamente.
                  </p>
                  <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.55', marginBottom: 0 }}>
                    5. Atualizacoes: estes termos podem ser ajustados para melhorias do servico e conformidade legal.
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