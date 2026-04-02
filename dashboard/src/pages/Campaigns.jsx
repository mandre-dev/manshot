// Campaigns.jsx — Manshot Orange Theme + Image Upload + Menu

import { useEffect, useState, useRef } from 'react'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign, uploadImage, getContacts } from '../services/api'
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react'
import RichEditor from '../components/RichEditor'


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

const StatusPill = ({ status }) => {
  const colors = {
    done: { bg: '#064e3b', color: '#10b981' },
    running: { bg: '#2a1a0a', color: '#FF8C00' },
    failed: { bg: '#4c1d24', color: '#f87171' },
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

const icons = {
  email: <Mail size={14} color="#FF6B00" />,
  sms: <MessageSquare size={14} color="#FF6B00" />,
  telegram: <Send size={14} color="#FF6B00" />,
}

const CheckBox = ({ label, checked, onChange, icon }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
    <div onClick={onChange} style={{
      width: '24px', height: '24px', borderRadius: '6px',
      background: checked ? '#FF6B00' : 'transparent',
      border: `2px solid ${checked ? '#FF6B00' : '#FF6B0066'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
    }}>
      {checked ? '✓' : ''}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {icons[icon]}
      <span style={{ color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{label}</span>
    </div>
  </label>
)

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`
  }

  return `${minutes}m ${remainingSeconds}s`
}

function DropdownMenu({ campaign, onEdit, onDelete }) {
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
          <button onClick={() => { onEdit(campaign); setOpen(false) }} style={{
            display: 'block', width: '100%', padding: '10px 16px',
            background: 'transparent', border: 'none', color: '#e5e7eb',
            fontSize: '12px', cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Space Mono', monospace",
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1208'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >✏️ Editar</button>
          <button onClick={() => { onDelete(campaign.id); setOpen(false) }} style={{
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

// Modal de loading / sucesso
function SendingModal({ status }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        background: '#111827', border: '2px solid #2a1a0a',
        borderRadius: '16px', padding: '48px 40px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '20px', minWidth: '260px'
      }}>
        {status === 'loading' ? (
          <>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              border: '4px solid #2a1a0a',
              borderTop: '4px solid #FF6B00',
              animation: 'spin 0.8s linear infinite',
            }} />
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

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)
  const [sendingModalStatus, setSendingModalStatus] = useState(null) // null | 'loading' | 'success'
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '',
    use_email: false, use_sms: false, use_telegram: false,
  })
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [showSelectContacts, setShowSelectContacts] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState(new Set())
  const [campaignToSend, setCampaignToSend] = useState(null)
  const [sendInterval, setSendInterval] = useState(0)

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

  async function loadContacts() {
    try {
      setLoadingContacts(true)
      const res = await getContacts()
      setContacts(res.data)
      setSelectedContacts(new Set(res.data.map(c => c.id)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingContacts(false)
    }
  }

  useEffect(() => {
    load()
    loadContacts()
  }, [])

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file)
      setForm({ ...form, image_url: res.data.url })
      setImagePreview(URL.createObjectURL(file))
    } catch (err) {
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await updateCampaign(editingId, form)
        setEditingId(null)
      } else {
        await createCampaign(form)
      }
      setForm({ name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '', use_email: false, use_sms: false, use_telegram: false })
      setImagePreview(null)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  function handleEdit(campaign) {
    setEditingId(campaign.id)
    setForm({
      name: campaign.name,
      message: campaign.message,
      image_url: campaign.image_url,
      email_subject: campaign.email_subject || '',
      sms_from: campaign.sms_from || '',
      telegram_signature: campaign.telegram_signature || '',
      use_email: campaign.use_email,
      use_sms: campaign.use_sms,
      use_telegram: campaign.use_telegram,
    })
    setImagePreview(campaign.image_url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Excluir campanha?')) return
    await deleteCampaign(id)
    load()
  }

  async function handleSend(id) {
    if (!confirm('Disparar campanha agora?')) return
    setCampaignToSend(id)
    setShowSelectContacts(true)
  }

  async function confirmSendWithContacts() {
    if (!campaignToSend) return
    if (selectedContacts.size === 0) {
      alert('Selecione pelo menos um contato para disparar a campanha')
      return
    }

    setShowSelectContacts(false)
    setSending(campaignToSend)
    setSendingModalStatus('loading')

    try {
      const contactIdArray = Array.from(selectedContacts)
      await sendCampaign(campaignToSend, contactIdArray, sendInterval)
      load()
      setSendingModalStatus('success')
      setTimeout(() => {
        setSendingModalStatus(null)
        setCampaignToSend(null)
      }, 2500)
    } catch (err) {
      console.error(err)
      setSendingModalStatus(null)
    } finally {
      setSending(null)
    }
  }

  function toggleContact(contactId) {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  function toggleAllContacts() {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)))
    }
  }

  const intervalSeconds = Math.max(0, Number(sendInterval) || 0)
  const selectedCount = selectedContacts.size
  const totalStaggerSeconds = selectedCount > 1 ? (selectedCount - 1) * intervalSeconds : 0

  return (
    <div>
      {/* Modal de loading/sucesso */}
      {sendingModalStatus && <SendingModal status={sendingModalStatus} />}

      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontFamily: "'Space Mono', monospace" }}>Gerenciamento</div>
        <div style={{ color: '#fff', fontSize: '22px', fontFamily: "'Fira Code', monospace", fontWeight: '700', letterSpacing: '1.0px' }}>CAMPANHAS</div>
      </div>

      {/* Formulário */}
      <div style={{ background: '#111827', border: `2px solid ${editingId ? '#FF6B00' : '#2a1a0a'}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ color: '#FF6B00', fontSize: '12px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Mono', monospace" }}>
          {editingId ? '✏️ Editando campanha' : '+ Nova campanha'}
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <input style={inputStyle} placeholder="Nome da campanha *"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

            <RichEditor
              value={form.message}
              onChange={(html) => setForm({ ...form, message: html })}
              placeholder="Mensagem da campanha *"
            />

            {form.use_email && (
              <input
                style={inputStyle}
                placeholder="Assunto do e-mail (opcional)"
                value={form.email_subject}
                onChange={e => setForm({ ...form, email_subject: e.target.value })}
              />
            )}

            {form.use_sms && (
              <input
                style={inputStyle}
                placeholder="Remetente do SMS (opcional)"
                value={form.sms_from}
                onChange={e => setForm({ ...form, sms_from: e.target.value })}
              />
            )}

            {form.use_telegram && (
              <input
                style={inputStyle}
                placeholder="Assinatura do Telegram (opcional)"
                value={form.telegram_signature}
                onChange={e => setForm({ ...form, telegram_signature: e.target.value })}
              />
            )}

            {/* Upload */}
            <div style={{ border: '1px dashed #2a1a0a', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '6px', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <span style={{ color: '#10b981', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}>✓ Imagem carregada</span>
                    <button type="button" onClick={() => { setImagePreview(null); setForm({ ...form, image_url: null }) }}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer', fontFamily: "'Space Mono', monospace" }}>
                      remover
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', fontFamily: "'Space Mono', monospace" }}>
                    {uploading ? '⏳ Enviando...' : '📎 Adicionar imagem (opcional)'}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    style={{ display: 'none' }} id="image-upload" disabled={uploading} />
                  <label htmlFor="image-upload" style={{
                    background: '#FF6B0022', color: '#FF6B00',
                    border: '1px solid #FF6B0044', borderRadius: '6px',
                    padding: '6px 16px', fontSize: '12px', cursor: 'pointer',
                    fontFamily: "'Space Mono', monospace"
                  }}>Escolher arquivo</label>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '14px' }}>
            <CheckBox label="Email" icon="email" checked={form.use_email}
              onChange={() => setForm({ ...form, use_email: !form.use_email })} />
            <CheckBox label="SMS" icon="sms" checked={form.use_sms}
              onChange={() => setForm({ ...form, use_sms: !form.use_sms })} />
            <CheckBox label="Telegram" icon="telegram" checked={form.use_telegram}
              onChange={() => setForm({ ...form, use_telegram: !form.use_telegram })} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{
              background: '#FF6B00', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer', flex: 1,
              fontFamily: "'Space Mono', monospace"
            }}>
              {editingId ? 'Salvar alterações' : 'Criar campanha'}
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null)
                setForm({ name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '', use_email: false, use_sms: false, use_telegram: false })
                setImagePreview(null)
              }} style={{
                background: 'transparent', color: '#9ca3af',
                border: '2px solid #2a1a0a', borderRadius: '8px',
                padding: '10px 20px', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace"
              }}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div style={{ background: '#111827', border: '2px solid #2a1a0a', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '2px solid #2a1a0a' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', fontFamily: "'Space Mono', monospace" }}>Campanhas</span>
          <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px', fontFamily: "'Space Mono', monospace" }}>({campaigns.length} total)</span>
        </div>

        <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '2px solid #2a1a0a' }}>
          {['Campanha', 'Imagem', 'Canais', 'Status', 'Total', 'Sucesso', 'Disparar', ''].map(h => (
            <div key={h} style={{ flex: 1, color: '#4b5563', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#FF6B00', fontFamily: "'Space Mono', monospace" }}>Carregando...</div>
        ) : campaigns.map(c => (
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
            <div style={{ flex: 1 }}>
              {c.image_url ? (
                <img src={c.image_url} alt="img" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#4b5563', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}>—</span>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {c.use_email && <Mail size={16} color="#FF6B00" />}
              {c.use_sms && <MessageSquare size={16} color="#FF6B00" />}
              {c.use_telegram && <Send size={16} color="#FF6B00" />}
            </div>
            <div style={{ flex: 1 }}><StatusPill status={c.status} /></div>
            <div style={{ flex: 1, color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{c.total}</div>
            <div style={{ flex: 1, color: '#10b981', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>{c.success}</div>
            <div style={{ flex: 1 }}>
              <button onClick={() => handleSend(c.id)}
                disabled={sending === c.id || c.status === 'running'}
                style={{
                  background: sending === c.id ? '#2a1a0a' : '#FF6B0022',
                  color: '#FF6B00', border: '1px solid #FF6B0044',
                  borderRadius: '6px', padding: '4px 12px',
                  fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s', opacity: c.status === 'running' ? 0.5 : 1,
                  fontFamily: "'Space Mono', monospace"
                }}>
                {sending === c.id ? '...' : '▶ Disparar'}
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <DropdownMenu campaign={c} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal de seleção de contatos */}
      {showSelectContacts && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#111827', border: '2px solid #2a1a0a',
            borderRadius: '10px', padding: '24px', maxWidth: '500px',
            maxHeight: '70vh', overflowY: 'auto', width: '90%'
          }}>
            <div style={{ color: '#FF6B00', fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>
              Selecionar contatos para disparar
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #2a1a0a' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onChange={toggleAllContacts}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ color: '#e5e7eb', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>
                  Selecionar todos ({contacts.length})
                </span>
              </label>
            </div>

            {loadingContacts ? (
              <div style={{ textAlign: 'center', color: '#FF6B00', padding: '16px', fontFamily: "'Space Mono', monospace" }}>
                Carregando contatos...
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '16px', fontFamily: "'Space Mono', monospace" }}>
                Nenhum contato cadastrado
              </div>
            ) : (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.map(contact => (
                  <label key={contact.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', padding: '8px', borderRadius: '6px',
                    background: selectedContacts.has(contact.id) ? '#2a1a0a' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2a1a0a'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedContacts.has(contact.id) ? '#2a1a0a' : 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e5e7eb', fontSize: '13px', fontFamily: "'Space Mono', monospace" }}>
                        {contact.name}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}>
                        {contact.email || contact.phone || contact.telegram_id || '—'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '11px', marginBottom: '6px', fontFamily: "'Space Mono', monospace" }}>
                Intervalo antes de cada envio (segundos)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={sendInterval}
                onChange={e => setSendInterval(e.target.value)}
                style={inputStyle}
              />
            </div>

            {selectedCount > 1 && (
              <div style={{
                background: '#1a1208',
                border: '1px solid #2a1a0a',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '8px'
              }}>
                <div style={{ color: '#e5e7eb', fontSize: '12px', fontFamily: "'Space Mono', monospace" }}>
                  Intervalo entre destinatários: {formatDuration(intervalSeconds)}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', fontFamily: "'Space Mono', monospace" }}>
                  {selectedCount} contatos selecionados. Último envio em aproximadamente {formatDuration(totalStaggerSeconds)}.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={confirmSendWithContacts} style={{
                background: '#FF6B00', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 16px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', flex: 1,
                fontFamily: "'Space Mono', monospace"
              }}>
                ▶ Disparar ({selectedContacts.size})
              </button>
              <button onClick={() => {
                setShowSelectContacts(false)
                setSendInterval(0)
              }} style={{
                background: 'transparent', color: '#9ca3af',
                border: '2px solid #2a1a0a', borderRadius: '8px',
                padding: '10px 16px', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace"
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}