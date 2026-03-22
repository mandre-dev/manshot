// Contacts.jsx — Manshot Cyber Tech

import { useEffect, useState } from 'react'
import { getContacts, createContact, deleteContact } from '../services/api'

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

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', telegram_id: '' })

  async function load() {
    try {
      const res = await getContacts()
      setContacts(res.data)
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
      await createContact(form)
      setForm({ name: '', email: '', phone: '', telegram_id: '' })
      load()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover contato?')) return
    await deleteContact(id)
    load()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Gerenciamento</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>Contatos</h1>
      </div>

      {/* Formulário */}
      <div style={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ color: '#4361EE', fontSize: '12px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          + Novo contato
        </div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <input style={inputStyle} placeholder="Nome *" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input style={inputStyle} placeholder="Email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <input style={inputStyle} placeholder="Telefone (ex: 5521999999999)" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input style={inputStyle} placeholder="Telegram ID" value={form.telegram_id}
              onChange={e => setForm({ ...form, telegram_id: e.target.value })} />
          </div>
          <button type="submit" style={{
            background: '#4361EE', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer', width: '100%',
          }}>
            Adicionar contato
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div style={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2d4a' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
            Lista de contatos
          </span>
          <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>
            ({contacts.length} total)
          </span>
        </div>

        <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid #1e2d4a' }}>
          {['Nome', 'Email', 'Telefone', 'Telegram ID', 'Ação'].map(h => (
            <div key={h} style={{ flex: 1, color: '#4b5563', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#4361EE' }}>Carregando...</div>
        ) : contacts.map(c => (
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
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px' }}>{c.email || '—'}</div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px' }}>{c.phone || '—'}</div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px' }}>{c.telegram_id || '—'}</div>
            <div style={{ flex: 1 }}>
              <button onClick={() => handleDelete(c.id)} style={{
                background: 'transparent', border: '1px solid #4c1d24',
                color: '#f87171', borderRadius: '6px', padding: '4px 10px',
                fontSize: '11px', cursor: 'pointer',
              }}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
