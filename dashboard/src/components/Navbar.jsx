// Navbar.jsx — Manshot Orange Theme

import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserCircle2, LogOut } from 'lucide-react'
import logo from '../assets/logo-manshot.png'
import { getMe } from '../services/api'

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
  const [isAccountHovered, setIsAccountHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false)
  const [isLogoutBtnHovered, setIsLogoutBtnHovered] = useState(false)
  const [isLogoutBtnPressed, setIsLogoutBtnPressed] = useState(false)
  const [isCancelBtnHovered, setIsCancelBtnHovered] = useState(false)
  const [isCancelBtnPressed, setIsCancelBtnPressed] = useState(false)

  useEffect(() => {
    let mounted = true

    getMe()
      .then((res) => {
        if (!mounted) return
        const email = res?.data?.email
        setAccountEmail(email || 'Conta conectada')
      })
      .catch(() => {
        if (!mounted) return
        setAccountEmail('Conta conectada')
      })

    return () => {
      mounted = false
    }
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

  const confirmLogout = () => {
    localStorage.removeItem('token')
    setIsConfirmLogoutOpen(false)
    navigate('/login')
  }

  const cancelLogout = () => {
    setIsConfirmLogoutOpen(false)
  }

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
          borderRadius: '8px',
          padding: '10px 12px',
          background: isAccountHovered ? '#1a2233' : '#131a27',
          border: isAccountHovered ? '1px solid #FF6B003d' : '1px solid #2a1a0a',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transform: isAccountHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0) scale(1)',
          boxShadow: isAccountHovered ? '0 8px 22px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,107,0,0.06)' : 'none',
          transition: 'all 0.18s ease',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={() => setIsAccountHovered(true)}
        onMouseLeave={() => setIsAccountHovered(false)}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <UserCircle2 size={20} color="#FF6B00" />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#6b7280', fontSize: '10px', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Conta logada
          </div>
          <div
            title={accountEmail}
            style={{ color: '#e5e7eb', fontSize: '11px', fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {accountEmail}
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '12px',
            right: '12px',
            marginBottom: '8px',
            background: '#131a27',
            border: '1px solid #2a1a0a',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,107,0,0.1)',
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
              onClick={handleLogoutClick}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                color: '#FF6B00',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                ':hover': {
                  background: '#FF6B0015',
                }
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FF6B0015'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {isConfirmLogoutOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeInOverlay 0.2s ease',
        }}>
          <style>{`
            @keyframes fadeInOverlay {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes slideInModal {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
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
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
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
    </aside>
  )
}