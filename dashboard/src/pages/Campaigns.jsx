// Campaigns.jsx — Manshot Cyber Tech

import { useEffect, useState } from 'react'
import { getCampaigns, createCampaign, sendCampaign } from '../services/api'

const inputStyle = {
  background: '#1a2234',
  border: '1px solid #1e2d4a',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#e5e7eb',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
}

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

const CheckBox = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
    <div
      onClick={onChange}
      style={{
        width: '18px', height: '18px', borderRadius: '4px',
        background: checked ? '#4361EE' : 'transparent',
        border: `1px solid ${checked ? '#4361EE' : '#1e2d4a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', color: '#fff', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {checked ? '✓' : ''}
    </div>
    <span style={{ color: '#9ca3af', fontSize: '13px' }}>{label}</span>
  </label>
)

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)
  const [form, setForm] = useState({
    name: '', message: '',
    use_email: false, use_sms: false, use_telegram: false,
  })

  async function load() {
    try {
      const res = await getCampaigns()
      setCampaigns(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await createCampaign(form)
      setForm({ name: '', message: '', use_email: false, use_sms: false, use_telegram: false })
      load()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSend(id) {
    if (!confirm('Disparar campanha agora?')) return
    setSending(id)
    try {
      await sendCampaign(id)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Gerenciamento</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>Campanhas</h1>
      </div>

      {/* Formulário */}
      <div style={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ color: '#4361EE', fontSize: '12px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          + Nova campanha
        </div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <input style={inputStyle} placeholder="Nome da campanha *"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <textarea style={{ ...inputStyle, height: '80px', resize: 'none' }}
              placeholder="Mensagem — use {name} para personalizar"
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
          </div>

          {/* Canais */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '14px' }}>
            <CheckBox label="📧 Email" checked={form.use_email}
              onChange={() => setForm({ ...form, use_email: !form.use_email })} />
            <CheckBox label="📱 SMS" checked={form.use_sms}
              onChange={() => setForm({ ...form, use_sms: !form.use_sms })} />
            <CheckBox label="✈️ Telegram" checked={form.use_telegram}
              onChange={() => setForm({ ...form, use_telegram: !form.use_telegram })} />
          </div>

          <button type="submit" style={{
            background: '#4361EE', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer', width: '100%',
          }}>
            Criar campanha
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div style={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2d4a' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Campanhas</span>
          <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>({campaigns.length} total)</span>
        </div>

        <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid #1e2d4a' }}>
          {['Campanha', 'Canais', 'Status', 'Total', 'Sucesso', 'Ação'].map(h => (
            <div key={h} style={{ flex: 1, color: '#4b5563', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#4361EE' }}>Carregando...</div>
        ) : campaigns.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #1e2d4a',
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
            <div style={{ flex: 1 }}>
              <button
                onClick={() => handleSend(c.id)}
                disabled={sending === c.id || c.status === 'running'}
                style={{
                  background: sending === c.id ? '#1e2d4a' : '#4361EE22',
                  color: '#4361EE',
                  border: '1px solid #4361EE44',
                  borderRadius: '6px', padding: '4px 12px',
                  fontSize: '11px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                  opacity: c.status === 'running' ? 0.5 : 1,
                }}
              >
                {sending === c.id ? 'Disparando...' : '▶ Disparar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
