import { AlertTriangle } from 'lucide-react'

export default function FieldTooltip({ show, message, anchorRef }) {
  if (!show || !anchorRef?.current) return null
  const rect = anchorRef.current.getBoundingClientRect()
  const style = {
    position: 'fixed',
    left: rect.left + rect.width / 2,
    top: rect.bottom + 8,
    transform: 'translateX(-50%)',
    background: '#fff',
    color: '#222',
    border: '2px solid #FF6B00',
    borderRadius: 8,
    padding: '8px 16px',
    fontFamily: "'Space Mono', monospace",
    fontSize: 14,
    fontWeight: 500,
    zIndex: 9999,
    boxShadow: '0 4px 16px #FF6B0033',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 180,
    maxWidth: 260,
    pointerEvents: 'none',
  }
  return (
    <div style={style}>
      <AlertTriangle size={18} color="#FF6B00" style={{ flexShrink: 0 }} />
      <span>{message}</span>
      <div style={{
        position: 'absolute',
        top: -10,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '10px solid #fff',
        filter: 'drop-shadow(0 -2px 0 #FF6B00)'
      }} />
    </div>
  )
}
