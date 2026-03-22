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
      width: '64px',
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      gap: '8px',
      borderRight: '1px solid #2a1a0a',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Logo */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1208',
        border: '1px solid #2a1a0a',
      }}>
        <img src={logo} alt="Manshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Links */}
      {links.map(link => {
        const active = location.pathname === link.path
        return (
          <Link
            key={link.path}
            to={link.path}
            title={link.label}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              background: active ? '#FF6B0022' : 'transparent',
              border: active ? '1px solid #FF6B0066' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            {link.icon}
          </Link>
        )
      })}
    </aside>
  )
}