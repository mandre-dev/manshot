import { useEffect } from 'react'

export default function AlertToast({ message, onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onClose && onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1a1208',
      color: '#fff',
      border: '2px solid #FF6B00',
      borderRadius: 10,
      padding: '14px 32px',
      fontFamily: "'Space Mono', monospace",
      fontSize: 15,
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: '0 8px 32px #FF6B0033',
      letterSpacing: '0.02em',
      textAlign: 'center',
      minWidth: 260,
      maxWidth: '90vw',
      opacity: 0.97,
      animation: 'fadeIn 0.3s',
    }}>
      {message}
    </div>
  )
}
