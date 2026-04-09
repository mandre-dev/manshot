// Campaigns.jsx — Manshot Orange Theme + Image Upload + Menu

import { useEffect, useState, useRef } from 'react'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign, uploadAttachment, getContacts } from '../services/api'
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

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']

function isImageUrl(url) {
  if (!url) return false
  const lower = url.split('?')[0].toLowerCase()
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext))
}

function getFileNameFromUrl(url) {
  if (!url) return 'arquivo'
  const clean = url.split('?')[0]
  const parts = clean.split('/')
  return parts[parts.length - 1] || 'arquivo'
}

function DropdownMenu({ campaign, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [isMenuHovered, setIsMenuHovered] = useState(false)
  const [isMenuPressed, setIsMenuPressed] = useState(false)
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
        ···
      </button>

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
            onMouseEnter={e => e.currentTarget.style.background = '#633b0a'}
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
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentIsImage, setAttachmentIsImage] = useState(false)
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
  const [focusedField, setFocusedField] = useState('')
  const [hoveredField, setHoveredField] = useState('')
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false)
  const [isPrimaryPressed, setIsPrimaryPressed] = useState(false)
  const [isUploadHovered, setIsUploadHovered] = useState(false)
  const [isUploadPressed, setIsUploadPressed] = useState(false)
  const [isEditCancelHovered, setIsEditCancelHovered] = useState(false)
  const [isEditCancelPressed, setIsEditCancelPressed] = useState(false)
  const [isModalSendHovered, setIsModalSendHovered] = useState(false)
  const [isModalSendPressed, setIsModalSendPressed] = useState(false)
  const [isModalCancelHovered, setIsModalCancelHovered] = useState(false)
  const [isModalCancelPressed, setIsModalCancelPressed] = useState(false)
  const [isIntervalHovered, setIsIntervalHovered] = useState(false)
  const [isIntervalFocused, setIsIntervalFocused] = useState(false)

  function getAnimatedInputStyle(field) {
    const isFocused = focusedField === field
    const isHovered = hoveredField === field
    const isActive = isFocused || isHovered

    return {
      ...inputStyle,
      border: isActive ? '2px solid #FF6B00' : '2px solid #2a1a0a',
      boxShadow: isFocused
        ? '0 0 0 3px #FF6B0033, 0 8px 24px #FF6B001f'
        : isHovered
          ? '0 0 0 2px #FF6B0022, 0 5px 16px #FF6B0017'
          : 'none',
      transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
      transition: 'border-color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease',
    }
  }

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

  useEffect(() => {
    const hasRunningCampaign = campaigns.some(c => c.status === 'running')
    if (!hasRunningCampaign) return

    const intervalId = setInterval(async () => {
      try {
        const res = await getCampaigns()
        setCampaigns(res.data)
      } catch (err) {
        console.error(err)
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [campaigns])

  async function handleAttachmentUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadAttachment(file)
      const isImage = (file.type || '').startsWith('image/') || res.data.kind === 'image'
      setForm({ ...form, image_url: res.data.url })
      setAttachmentName(res.data.filename || file.name)
      setAttachmentIsImage(isImage)
      setImagePreview(isImage ? URL.createObjectURL(file) : null)
    } catch (err) {
      alert('Erro ao fazer upload do arquivo')
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
      setAttachmentName('')
      setAttachmentIsImage(false)
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
    const previewAsImage = isImageUrl(campaign.image_url)
    setAttachmentIsImage(previewAsImage)
    setAttachmentName(getFileNameFromUrl(campaign.image_url))
    setImagePreview(previewAsImage ? campaign.image_url : null)
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
  const selectedCampaignName = campaigns.find((c) => c.id === campaignToSend)?.name || ''

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
            <input style={getAnimatedInputStyle('name')} placeholder="Nome da campanha *"
              value={form.name}
              onMouseEnter={() => setHoveredField('name')}
              onMouseLeave={() => setHoveredField('')}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField('')}
              onChange={e => setForm({ ...form, name: e.target.value })} required />

            <RichEditor
              value={form.message}
              onChange={(html) => setForm({ ...form, message: html })}
              placeholder="Mensagem da campanha *"
            />

            {form.use_email && (
              <input
                style={getAnimatedInputStyle('email_subject')}
                placeholder="Assunto do e-mail (opcional)"
                value={form.email_subject}
                onMouseEnter={() => setHoveredField('email_subject')}
                onMouseLeave={() => setHoveredField('')}
                onFocus={() => setFocusedField('email_subject')}
                onBlur={() => setFocusedField('')}
                onChange={e => setForm({ ...form, email_subject: e.target.value })}
              />
            )}

            {form.use_sms && (
              <input
                style={getAnimatedInputStyle('sms_from')}
                placeholder="Remetente do SMS (opcional)"
                value={form.sms_from}
                onMouseEnter={() => setHoveredField('sms_from')}
                onMouseLeave={() => setHoveredField('')}
                onFocus={() => setFocusedField('sms_from')}
                onBlur={() => setFocusedField('')}
                onChange={e => setForm({ ...form, sms_from: e.target.value })}
              />
            )}

            {form.use_telegram && (
              <input
                style={getAnimatedInputStyle('telegram_signature')}
                placeholder="Assinatura do Telegram (opcional)"
                value={form.telegram_signature}
                onMouseEnter={() => setHoveredField('telegram_signature')}
                onMouseLeave={() => setHoveredField('')}
                onFocus={() => setFocusedField('telegram_signature')}
                onBlur={() => setFocusedField('')}
                onChange={e => setForm({ ...form, telegram_signature: e.target.value })}
              />
            )}

            {/* Upload */}
            <div style={{ border: '1px dashed #2a1a0a', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              {form.image_url ? (
                <div>
                  {attachmentIsImage ? (
                    <img src={imagePreview || form.image_url} alt="Preview" style={{ maxHeight: '120px', borderRadius: '6px', marginBottom: '8px' }} />
                  ) : (
                    <div style={{ color: '#e5e7eb', marginBottom: '8px', fontSize: '12px', fontFamily: "'Space Mono', monospace" }}>
                      📄 {attachmentName || 'Arquivo anexado'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <span style={{ color: '#10b981', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}>✓ Arquivo carregado</span>
                    <button type="button" onClick={() => {
                      setImagePreview(null)
                      setAttachmentName('')
                      setAttachmentIsImage(false)
                      setForm({ ...form, image_url: null })
                    }}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer', fontFamily: "'Space Mono', monospace" }}>
                      remover
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', fontFamily: "'Space Mono', monospace" }}>
                    {uploading ? '⏳ Enviando...' : '📎 Adicionar anexo (opcional)'}
                  </div>
                  <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar" onChange={handleAttachmentUpload}
                    style={{ display: 'none' }} id="attachment-upload" disabled={uploading} />
                  <label htmlFor="attachment-upload" style={{
                    background: isUploadHovered ? '#FF6B0033' : '#FF6B0022',
                    color: '#FF6B00',
                    border: `1px solid ${isUploadHovered ? '#FF6B00' : '#FF6B0044'}`,
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Space Mono', monospace",
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isUploadPressed
                      ? 'translateY(1px) scale(0.98)'
                      : isUploadHovered
                        ? 'translateY(-1px) scale(1.02)'
                        : 'translateY(0) scale(1)',
                    boxShadow: isUploadPressed
                      ? 'inset 0 0 0 1px rgba(255,107,0,0.5)'
                      : isUploadHovered
                        ? '0 6px 18px rgba(255,107,0,0.16)'
                        : 'none',
                    transition: 'background 0.14s ease, border-color 0.14s ease, transform 0.12s ease, box-shadow 0.14s ease',
                    opacity: uploading ? 0.7 : 1,
                  }}
                    onMouseEnter={() => !uploading && setIsUploadHovered(true)}
                    onMouseLeave={() => {
                      setIsUploadHovered(false)
                      setIsUploadPressed(false)
                    }}
                    onMouseDown={() => !uploading && setIsUploadPressed(true)}
                    onMouseUp={() => setIsUploadPressed(false)}
                  >Escolher arquivo</label>
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
              fontFamily: "'Space Mono', monospace",
              transform: isPrimaryPressed
                ? 'translateY(1px) scale(0.99)'
                : isPrimaryHovered
                  ? 'translateY(-1px) scale(1.01)'
                  : 'translateY(0) scale(1)',
              boxShadow: isPrimaryPressed
                ? 'inset 0 0 0 2px #ff9a3d66'
                : isPrimaryHovered
                  ? '0 8px 22px #FF6B0042'
                  : '0 6px 18px #FF6B0033',
              transition: 'transform 0.1s ease, box-shadow 0.14s ease',
            }}
              onMouseEnter={() => setIsPrimaryHovered(true)}
              onMouseDown={() => setIsPrimaryPressed(true)}
              onMouseUp={() => setIsPrimaryPressed(false)}
              onMouseLeave={() => {
                setIsPrimaryHovered(false)
                setIsPrimaryPressed(false)
              }}
            >
              {editingId ? 'Salvar alterações' : 'Criar campanha'}
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null)
                setForm({ name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '', use_email: false, use_sms: false, use_telegram: false })
                setImagePreview(null)
                setAttachmentName('')
                setAttachmentIsImage(false)
              }} style={{
                background: isEditCancelHovered ? '#1a1208' : 'transparent',
                color: isEditCancelHovered ? '#e5e7eb' : '#9ca3af',
                border: `2px solid ${isEditCancelHovered ? '#FF6B004d' : '#2a1a0a'}`,
                borderRadius: '8px',
                padding: '10px 20px', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
                transform: isEditCancelPressed
                  ? 'translateY(1px) scale(0.99)'
                  : isEditCancelHovered
                    ? 'translateY(-1px) scale(1.01)'
                    : 'translateY(0) scale(1)',
                boxShadow: isEditCancelPressed
                  ? 'inset 0 0 0 1px #FF6B0077'
                  : isEditCancelHovered
                    ? '0 6px 16px #FF6B001a'
                    : 'none',
                transition: 'all 0.12s ease',
              }}
                onMouseEnter={() => setIsEditCancelHovered(true)}
                onMouseDown={() => setIsEditCancelPressed(true)}
                onMouseUp={() => setIsEditCancelPressed(false)}
                onMouseLeave={() => {
                  setIsEditCancelHovered(false)
                  setIsEditCancelPressed(false)
                }}
              >Cancelar</button>
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
          {['Campanha', 'Anexo', 'Canais', 'Status', 'Total', 'Sucesso', 'Disparar', ''].map(h => (
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
                isImageUrl(c.image_url) ? (
                  <img src={c.image_url} alt="img" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                ) : (
                  <a
                    href={c.image_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#FF6B00', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}
                  >
                    📄 arquivo
                  </a>
                )
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
              <button
                onClick={() => handleSend(c.id)}
                disabled={sending === c.id || c.status === 'running'}
                style={{
                  background: sending === c.id ? '#2a1a0a' : '#FF6B0022',
                  color: '#FF6B00', border: '1px solid #FF6B0044',
                  borderRadius: '6px', padding: '4px 12px',
                  fontSize: '11px', fontWeight: '600',
                  cursor: sending === c.id || c.status === 'running' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.12s ease',
                  opacity: c.status === 'running' ? 0.5 : 1,
                  fontFamily: "'Space Mono', monospace",
                  transform: sending === c.id ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)',
                  boxShadow: sending === c.id ? 'inset 0 0 0 1px #FF6B0077' : 'none',
                }}
                onMouseEnter={e => {
                  if (sending === c.id || c.status === 'running') return
                  e.currentTarget.style.background = '#FF6B0033'
                  e.currentTarget.style.borderColor = '#FF6B00'
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 4px 12px #FF6B0022'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = sending === c.id ? '#2a1a0a' : '#FF6B0022'
                  e.currentTarget.style.borderColor = '#FF6B0044'
                  e.currentTarget.style.transform = sending === c.id ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = sending === c.id ? 'inset 0 0 0 1px #FF6B0077' : 'none'
                }}
                onMouseDown={e => {
                  if (sending === c.id || c.status === 'running') return
                  e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'
                  e.currentTarget.style.boxShadow = 'inset 0 0 0 1px #FF6B0077'
                }}
                onMouseUp={e => {
                  if (sending === c.id || c.status === 'running') return
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 4px 12px #FF6B0022'
                }}
              >
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
              {`Selecionar contatos para disparar${selectedCampaignName ? ` ➜ ${selectedCampaignName}` : ''}`}
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
                onMouseEnter={() => setIsIntervalHovered(true)}
                onMouseLeave={() => setIsIntervalHovered(false)}
                onFocus={() => setIsIntervalFocused(true)}
                onBlur={() => setIsIntervalFocused(false)}
                style={{
                  ...inputStyle,
                  border: isIntervalFocused || isIntervalHovered ? '2px solid #FF6B00' : '2px solid #2a1a0a',
                  boxShadow: isIntervalFocused
                    ? '0 0 0 3px #FF6B0033, 0 8px 24px #FF6B001f'
                    : isIntervalHovered
                      ? '0 0 0 2px #FF6B0022, 0 5px 16px #FF6B0017'
                      : 'none',
                  transform: isIntervalFocused || isIntervalHovered ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'border-color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease',
                }}
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
              <button
                onClick={confirmSendWithContacts}
                style={{
                  background: '#FF6B00', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '10px 16px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', flex: 1,
                  fontFamily: "'Space Mono', monospace",
                  transform: isModalSendPressed
                    ? 'translateY(1px) scale(0.99)'
                    : isModalSendHovered
                      ? 'translateY(-1px) scale(1.01)'
                      : 'translateY(0) scale(1)',
                  boxShadow: isModalSendPressed
                    ? 'inset 0 0 0 2px #ff9a3d66'
                    : isModalSendHovered
                      ? '0 8px 22px #FF6B0042'
                      : '0 6px 18px #FF6B0033',
                  transition: 'transform 0.1s ease, box-shadow 0.14s ease',
                }}
                onMouseEnter={() => setIsModalSendHovered(true)}
                onMouseDown={() => setIsModalSendPressed(true)}
                onMouseUp={() => setIsModalSendPressed(false)}
                onMouseLeave={() => {
                  setIsModalSendHovered(false)
                  setIsModalSendPressed(false)
                }}
              >
                ▶ Disparar ({selectedContacts.size})
              </button>
              <button onClick={() => {
                setShowSelectContacts(false)
                setSendInterval(0)
              }} style={{
                background: isModalCancelHovered ? '#1a1208' : 'transparent',
                color: isModalCancelHovered ? '#e5e7eb' : '#9ca3af',
                border: `2px solid ${isModalCancelHovered ? '#FF6B004d' : '#2a1a0a'}`,
                borderRadius: '8px',
                padding: '10px 16px', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
                transform: isModalCancelPressed
                  ? 'translateY(1px) scale(0.99)'
                  : isModalCancelHovered
                    ? 'translateY(-1px) scale(1.01)'
                    : 'translateY(0) scale(1)',
                boxShadow: isModalCancelPressed
                  ? 'inset 0 0 0 1px #FF6B0077'
                  : isModalCancelHovered
                    ? '0 6px 16px #FF6B001a'
                    : 'none',
                transition: 'all 0.12s ease',
              }}
                onMouseEnter={() => setIsModalCancelHovered(true)}
                onMouseDown={() => setIsModalCancelPressed(true)}
                onMouseUp={() => setIsModalCancelPressed(false)}
                onMouseLeave={() => {
                  setIsModalCancelHovered(false)
                  setIsModalCancelPressed(false)
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}