import { CheckCircle } from 'lucide-react'

export default function SendingModal({ status }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: '#111827',
          border: '2px solid #2a1a0a',
          borderRadius: '16px',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          minWidth: '260px',
        }}
      >
        {status === 'loading' ? (
          <>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '4px solid #2a1a0a',
                borderTop: '4px solid #FF6B00',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ color: '#e5e7eb', fontSize: '14px', fontFamily: "'Space Mono', monospace", textAlign: 'center' }}>
              Disparando campanha...
            </div>
            <div style={{ color: '#6b7280', fontSize: '11px', fontFamily: "'Space Mono', monospace", textAlign: 'center' }}>
              Isso pode levar alguns segundos...
            </div>
          </>
        ) : (
          <>
            <CheckCircle size={56} color="#10b981" strokeWidth={1.5} />
            <div style={{ color: '#e5e7eb', fontSize: '14px', fontFamily: "'Space Mono', monospace", textAlign: 'center' }}>
              Campanha disparada!
            </div>
            <div style={{ color: '#6b7280', fontSize: '11px', fontFamily: "'Space Mono', monospace", textAlign: 'center' }}>
              Mensagens enviadas com sucesso!
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}