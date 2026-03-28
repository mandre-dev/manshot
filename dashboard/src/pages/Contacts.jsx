// Contacts.jsx — Manshot Orange Theme + Edit/Delete Menu

import { useEffect, useState, useRef } from 'react'
import { getContacts, createContact, updateContact, deleteContact } from '../services/api'
import * as XLSX from 'xlsx'

const inputStyle = {
  background: '#1a1208',
  border: '2px solid #2a1a0a',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#e5e7eb',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  fontFamily: "'Space Mono', monospace",
}

function DropdownMenu({ contact, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        background: 'transparent', border: '2px solid #2a1a0a',
        borderRadius: '6px', color: '#9ca3af', cursor: 'pointer',
        padding: '4px 10px', fontSize: '16px', lineHeight: '1',
        fontFamily: "'Space Mono', monospace",
      }}>···</button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, bottom: '110%',
          background: '#111827', border: '2px solid #2a1a0a',
          borderRadius: '8px', overflow: 'hidden', zIndex: 100,
          minWidth: '130px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <button onClick={() => { onEdit(contact); setOpen(false) }} style={{
            display: 'block', width: '100%', padding: '10px 16px',
            background: 'transparent', border: 'none', color: '#e5e7eb',
            fontSize: '12px', cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Space Mono', monospace",
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1208'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >✏️ Editar</button>
          <button onClick={() => { onDelete(contact.id); setOpen(false) }} style={{
            display: 'block', width: '100%', padding: '10px 16px',
            background: 'transparent', border: 'none', color: '#f87171',
            fontSize: '12px', cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Space Mono', monospace",
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#4c1d24'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >🗑️ Excluir</button>
        </div>
      )}
    </div>
  )
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
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

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await updateContact(editingId, form)
        setEditingId(null)
      } else {
        await createContact(form)
      }
      setForm({ name: '', email: '', phone: '', telegram_id: '' })
      load()
    } catch (err) {
      console.error(err)
    }
  }

  function handleEdit(contact) {
    setEditingId(contact.id)
    setForm({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      telegram_id: contact.telegram_id || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Remover contato?')) return
    await deleteContact(id)
    load()
  }

  async function handleImportExcel(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      let imported = 0
      for (const row of rows) {
        try {
          await createContact({
            name: row.name || row.nome || row.Name || '',
            email: row.email || row.Email || '',
            phone: row.phone || row.telefone || row.Phone || '',
            telegram_id: row.telegram_id || row.telegram || '',
          })
          imported++
        } catch (err) {
          console.error('Erro ao importar contato:', err)
        }
      }

      alert(`${imported} contatos importados com sucesso!`)
      load()
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontFamily: "'Space Mono', monospace" }}>Gerenciamento</div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', fontFamily: "'Fira Code', monospace" }}>Contatos</h1>
      </div>

      {/* Formulário */}
      <div style={{ background: '#111827', border: `1px solid ${editingId ? '#FF6B00' : '#2a1a0a'}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ color: '#FF6B00', fontSize: '12px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Mono', monospace" }}>
          {editingId ? '✏️ Editando contato' : '+ Novo contato'}
        </div>
        <form onSubmit={handleSubmit}>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{
              background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer', flex: 1,
              fontFamily: "'Space Mono', monospace",
            }}>
              {editingId ? 'Salvar alterações' : 'Adicionar contato'}
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null)
                setForm({ name: '', email: '', phone: '', telegram_id: '' })
              }} style={{
                background: 'transparent', color: '#9ca3af',
                border: '2px solid #2a1a0a', borderRadius: '8px',
                padding: '10px 20px', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
              }}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div style={{ background: '#111827', border: '2px solid #2a1a0a', borderRadius: '10px', overflow: 'visible' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', fontFamily: "'Space Mono', monospace" }}>
              Lista de contatos
            </span>
            <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px', fontFamily: "'Space Mono', monospace" }}>
              ({contacts.length} total)
            </span>
          </div>
          <div>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel}
              style={{ display: 'none' }} id="excel-upload" />
            <label htmlFor="excel-upload" style={{
              background: '#FF6B0022', color: '#FF6B00',
              border: '1px solid #FF6B0044', borderRadius: '6px',
              padding: '6px 14px', fontSize: '11px', cursor: 'pointer',
              fontFamily: "'Space Mono', monospace",
            }}>
              📥 Importar Excel
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '2px solid #2a1a0a' }}>
          {['Nome', 'Email', 'Telefone', 'Telegram ID', ''].map(h => (
            <div key={h} style={{ flex: 1, color: '#4b5563', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#FF6B00', fontFamily: "'Space Mono', monospace" }}>Carregando...</div>
        ) : contacts.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 16px', borderBottom: '2px solid #2a1a0a',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1208'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#FF6B00' }} />
              <span style={{ color: '#e5e7eb', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{c.name}</span>
            </div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{c.email || '—'}</div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{c.phone || '—'}</div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{c.telegram_id || '—'}</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <DropdownMenu contact={c} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}