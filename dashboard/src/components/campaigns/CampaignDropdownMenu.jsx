import { useEffect, useRef, useState } from 'react'

export default function CampaignDropdownMenu({ campaign, onEdit, onDelete, onReset, onTogglePin }) {
  const [open, setOpen] = useState(false)
  const [isMenuHovered, setIsMenuHovered] = useState(false)
  const [isMenuPressed, setIsMenuPressed] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: isMenuHovered ? '#1a1208' : 'transparent',
          border: `2px solid ${isMenuHovered ? '#FF6B0055' : '#2a1a0a'}`,
          borderRadius: '6px',
          color: isMenuHovered ? '#FF6B00' : '#9ca3af',
          cursor: 'pointer',
          padding: '4px 10px',
          fontSize: '16px',
          lineHeight: '1',
          fontFamily: "'Space Mono', monospace",
          transform: isMenuPressed
            ? 'translateY(1px) scale(0.98)'
            : isMenuHovered
              ? 'translateY(-1px) scale(1.02)'
              : 'translateY(0) scale(1)',
          boxShadow: isMenuPressed
            ? 'inset 0 0 0 1px #FF6B0077'
            : isMenuHovered
              ? '0 4px 12px #FF6B0022'
              : '0 0 0 0 #00000000',
          transition: 'all 0.12s ease',
        }}
        onMouseEnter={() => setIsMenuHovered(true)}
        onMouseDown={() => setIsMenuPressed(true)}
        onMouseUp={() => setIsMenuPressed(false)}
        onMouseLeave={() => {
          setIsMenuHovered(false)
          setIsMenuPressed(false)
        }}
      >
        ...
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: '110%',
            background: '#111827',
            border: '2px solid #2a1a0a',
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 99999,
            minWidth: '130px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={() => {
              onTogglePin(campaign)
              setOpen(false)
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: campaign.pinned ? '#fbbf24' : '#e5e7eb',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Space Mono', monospace",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#3b2a08'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent'
            }}
          >
            {campaign.pinned ? '📌 Desafixar' : '📍 Fixar'}
          </button>

          {campaign.status === 'running' && (
            <button
              onClick={() => {
                onReset(campaign.id)
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: '#f59e0b',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Space Mono', monospace",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = '#3b2a08'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent'
              }}
            >
              ↻ Destravar
            </button>
          )}

          <button
            onClick={() => {
              onEdit(campaign)
              setOpen(false)
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: '#e5e7eb',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Space Mono', monospace",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#633b0a'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent'
            }}
          >
            ✏️ Editar
          </button>

          <button
            onClick={() => {
              onDelete(campaign.id)
              setOpen(false)
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Space Mono', monospace",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#4c1d24'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent'
            }}
          >
            🗑️ Excluir
          </button>
        </div>
      )}
    </div>
  )
}