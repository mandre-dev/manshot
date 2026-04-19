import { Mail, MessageSquare, Send } from 'lucide-react'

const ICONS = {
  email: <Mail size={14} color="#FF6B00" />,
  sms: <MessageSquare size={14} color="#FF6B00" />,
  telegram: <Send size={14} color="#FF6B00" />,
}

export default function ChannelCheckbox({ label, checked, onChange, icon }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <div
        onClick={onChange}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: checked ? '#FF6B00' : 'transparent',
          border: `2px solid ${checked ? '#FF6B00' : '#FF6B0066'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {checked ? '✓' : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {ICONS[icon]}
        <span style={{ color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{label}</span>
      </div>
    </label>
  )
}