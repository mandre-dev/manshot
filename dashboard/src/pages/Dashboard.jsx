// Dashboard.jsx — Manshot Cyber Tech

import { useEffect, useState } from 'react'
import { getCampaigns, getContacts } from '../services/api'

const Card = ({ label, value, color = '#4361EE' }) => (
  <div style={{
    background: '#111827',
    border: '1px solid #1e2d4a',
    borderRadius: '10px',
    padding: '16px',
  }}>
    <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ color, fontSize: '28px', fontWeight: '700' }}>{value}</div>
  </div>
)

const StatusPill = ({ status }) => {
  const colors = {
    done:    { bg: '#064e3b', color: '#10b981' },
    running: { bg: '#1e3a5f', color: '#60a5fa' },
    failed:  { bg: '#4c1d24', color: '#f87171' },
    pending: { bg: '#1f2937', color: '#9ca3af' },
  }
  const s = colors[status] || colors.pending
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '10px', padding: '2px 8px',
      borderRadius: '20px', fontWeight: '500'
    }}>{status}</span>
  )
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [c, co] = await Promise.all([getCampaigns(), getContacts()])
        setCampaigns(c.data)
        setContacts(co.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalDispatched = campaigns.reduce((acc, c) => acc + c.total, 0)
  const totalSuccess = campaigns.reduce((acc, c) => acc + c.success, 0)

  if (loading) return (
    <div style={{ color: '#4361EE', padding: '40px', textAlign: 'center' }}>
      Carregando...
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
          Bem-vindo de volta, Mandré
        </div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>
          Painel de controle
        </h1>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <Card label="Campanhas" value={campaigns.length} />
        <Card label="Contatos" value={contacts.length} />
        <Card label="Disparos" value={totalDispatched} />
        <Card label="Sucesso" value={totalSuccess} color="#10b981" />
      </div>

      {/* Tabela */}
      <div style={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2d4a' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Campanhas recentes</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid #1e2d4a' }}>
          {['Campanha', 'Canais', 'Status', 'Total', 'Sucesso'].map(h => (
            <div key={h} style={{ flex: 1, color: '#4b5563', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {campaigns.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #1e2d4a',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a2234'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#4361EE' }} />
              <span style={{ color: '#e5e7eb', fontSize: '13px' }}>{c.name}</span>
            </div>
            <div style={{ flex: 1, fontSize: '14px' }}>
              {c.use_email && '📧 '}
              {c.use_sms && '📱 '}
              {c.use_telegram && '✈️'}
            </div>
            <div style={{ flex: 1 }}><StatusPill status={c.status} /></div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px' }}>{c.total}</div>
            <div style={{ flex: 1, color: '#10b981', fontSize: '13px' }}>{c.success}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
