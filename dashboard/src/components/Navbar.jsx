// Navbar.jsx — Manshot Orange Theme

import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo-manshot.png'

const links = [
  { path: '/', icon: '⚡', label: 'Dashboard' },
  { path: '/contacts', icon: '👥', label: 'Contatos' },
  { path: '/campaigns', icon: '📡', label: 'Campanhas' },
]

export default function Navbar() {
  const location = useLocation()

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
    </aside>
  )
}