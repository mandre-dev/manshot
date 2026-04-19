// Campaigns.jsx — Manshot Orange Theme + Image Upload + Menu

import { useEffect, useState, useRef } from 'react'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, pinCampaign, resetCampaignStatus, sendCampaign, uploadAttachment, getContacts } from '../services/api'
import AlertToast from '../components/AlertToast'
import { Mail, MessageSquare, Send, X, Paperclip, Pin } from 'lucide-react'
import RichEditor from '../components/RichEditor'
import StatusPill from '../components/campaigns/StatusPill'
import ChannelCheckbox from '../components/campaigns/ChannelCheckbox'
import CampaignDropdownMenu from '../components/campaigns/CampaignDropdownMenu'
import SendingModal from '../components/campaigns/SendingModal'

import FieldTooltip from '../components/FieldTooltip'
import { getAttachmentKind, normalizeCampaignAttachments, normalizeUploadedAttachment } from '../components/campaigns/attachmentUtils'


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

export default function Campaigns() {
  const [alert, setAlert] = useState("")
  const [campaigns, setCampaigns] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const messageRef = useRef()
  const emailRef = useRef()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)
  const [sendingModalStatus, setSendingModalStatus] = useState(null) // null | 'loading' | 'success'
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '',
    use_email: false, use_sms: false, use_telegram: false,
    attachments: [],
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
  const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.innerWidth <= 1100)

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

  function syncAttachments(nextAttachments) {
    const safeAttachments = nextAttachments.filter(Boolean)
    setAttachments(safeAttachments)
    setForm((current) => ({
      ...current,
      attachments: safeAttachments,
      image_url: safeAttachments[0]?.url || null,
    }))
  }

  function removeAttachment(index) {
    const nextAttachments = attachments.filter((_, currentIndex) => currentIndex !== index)
    syncAttachments(nextAttachments)
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
    const onResize = () => setIsNarrowScreen(window.innerWidth <= 1100)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadedAttachments = []

      for (const file of files) {
        try {
          const res = await uploadAttachment(file)
          uploadedAttachments.push(normalizeUploadedAttachment(res.data, file))
        } catch (err) {
          console.error(err)
          alert(`Erro ao fazer upload do arquivo: ${file.name}`)
        }
      }

      if (uploadedAttachments.length > 0) {
        syncAttachments([...attachments, ...uploadedAttachments])
      }
    } catch (err) {
      alert('Erro ao fazer upload do arquivo')
    } finally {
      e.target.value = ''
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Validação obrigatória visual
    const errors = {}
    if (!form.name.trim()) {
      setAlert('Preencha o nome da campanha.')
      return
    }
    if (!form.message || !form.message.replace(/<[^>]+>/g, '').trim()) {
      errors.message = 'Preencha este campo.'
    } else if (!form.use_email && !form.use_sms && !form.use_telegram) {
      errors.channels = 'Selecione pelo menos um canal.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      setFieldErrors({})
      if (editingId) {
        await updateCampaign(editingId, form)
        setEditingId(null)
      } else {
        await createCampaign(form)
      }
      setForm({ name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '', use_email: false, use_sms: false, use_telegram: false, attachments: [] })
      setAttachments([])
      load()
    } catch (err) {
      console.error(err)
    }
  }

  function handleEdit(campaign) {
    setEditingId(campaign.id)
    const normalizedAttachments = normalizeCampaignAttachments(campaign)
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
      attachments: normalizedAttachments,
    })
    setAttachments(normalizedAttachments)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Excluir campanha?')) return
    await deleteCampaign(id)
    load()
  }

  async function handleResetCampaign(id) {
    if (!confirm('Destravar esta campanha e voltar para pendente?')) return
    await resetCampaignStatus(id)
    load()
  }

  async function handleTogglePinCampaign(campaign) {
    await pinCampaign(campaign.id, !campaign.pinned)
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

    const selectedCampaign = campaigns.find((campaign) => campaign.id === campaignToSend)
    if (selectedCampaign?.use_telegram) {
      const selectedContactList = contacts.filter((contact) => selectedContacts.has(contact.id))
      const contactsWithoutTelegramId = selectedContactList.filter((contact) => !String(contact.telegram_id || '').trim())

      if (
        selectedCampaign.use_telegram
        && !selectedCampaign.use_email
        && !selectedCampaign.use_sms
        && contactsWithoutTelegramId.length === selectedContactList.length
      ) {
        alert('Nenhum contato selecionado possui telegram_id para disparo via Telegram.')
        return
      }

      const confirmTelegramActivation = window.confirm(
        contactsWithoutTelegramId.length > 0
          ? `Atencao: ${contactsWithoutTelegramId.length} contato(s) nao possuem telegram_id e podem nao receber via Telegram.\n\nLembrete: o usuario precisa abrir o bot e clicar em /start antes do disparo.\n\nDeseja continuar?`
          : 'Lembrete Telegram: o usuario precisa abrir o bot e clicar em /start antes do disparo.\n\nDeseja continuar?'
      )

      if (!confirmTelegramActivation) {
        return
      }
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
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const pinnedA = a.pinned ? 1 : 0
    const pinnedB = b.pinned ? 1 : 0
    if (pinnedA !== pinnedB) {
      return pinnedB - pinnedA
    }

    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()

    if (dateA !== dateB) return dateB - dateA
    return (b.id || 0) - (a.id || 0)
  })

  return (
    <div>
      <AlertToast message={alert} onClose={() => setAlert("")} />
      {/* Modal de loading/sucesso */}
      {sendingModalStatus && <SendingModal status={sendingModalStatus} />}

      <div style={{ marginBottom: isNarrowScreen ? '16px' : '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontFamily: "'Space Mono', monospace" }}>Gerenciamento</div>
        <div style={{ color: '#fff', fontSize: '22px', fontFamily: "'Fira Code', monospace", fontWeight: '700', letterSpacing: '1.0px' }}>CAMPANHAS</div>
      </div>

      {/* Formulário */}
      <div style={{ background: '#111827', border: `2px solid ${editingId ? '#FF6B00' : '#2a1a0a'}`, borderRadius: '10px', padding: isNarrowScreen ? '14px' : '20px', marginBottom: '20px' }}>
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

            <div style={{ position: 'relative' }}>
              <RichEditor
                ref={messageRef}
                value={form.message}
                onChange={(html) => {
                  setForm({ ...form, message: html })
                  if (fieldErrors.message && html.replace(/<[^>]+>/g, '').trim()) setFieldErrors(f => ({ ...f, message: undefined }))
                }}
                placeholder="Mensagem da campanha *"
              />
              <FieldTooltip show={!!fieldErrors.message} message={fieldErrors.message} anchorRef={messageRef} />
              {/* Alerta visual igual ao dos canais */}
              {fieldErrors.message && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: 12,
                  background: '#fff',
                  color: '#222',
                  border: '2px solid #FF6B00',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 15,
                  fontWeight: 500,
                  zIndex: 9999,
                  boxShadow: '0 8px 32px #FF6B0033',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 180,
                  maxWidth: 260,
                  pointerEvents: 'none',
                  letterSpacing: '0.01em',
                }}>
                  <span style={{ color: '#FF6B00', fontSize: 20, marginRight: 8 }}>⚠️</span>
                  <span>{fieldErrors.message}</span>
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    left: 24,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '10px solid #fff',
                    filter: 'drop-shadow(0 -2px 0 #FF6B00)'
                  }} />
                </div>
              )}
            </div>

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
              <>
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
              </>
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
            <div style={{ border: '1px dashed #2a1a0a', borderRadius: '8px', padding: isNarrowScreen ? '12px' : '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6b7280', fontSize: '12px', marginBottom: '10px', fontFamily: "'Space Mono', monospace", width: '100%' }}>
                <Paperclip size={14} />
                <span>{uploading ? 'Enviando anexos...' : 'Adicionar anexo(s) opcional(is)'}</span>
              </div>

              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', width: '100%' }}>
                  {attachments.map((attachment, index) => {
                    const kind = getAttachmentKind(attachment)
                    return (
                      <div key={`${attachment.url}-${index}`} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', background: '#1a1208',
                        border: '1px solid #2a1a0a', borderRadius: '8px'
                      }}>
                        {kind === 'image' ? (
                          <img src={attachment.url} alt={attachment.filename} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#2a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', flexShrink: 0, fontSize: '18px' }}>
                            📄
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#e5e7eb', fontSize: '12px', fontFamily: "'Space Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attachment.filename}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '10px', fontFamily: "'Space Mono', monospace" }}>
                            {kind === 'image' ? 'Imagem' : 'Arquivo'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          style={{
                            background: 'transparent', border: 'none', color: '#f87171',
                            cursor: 'pointer', fontSize: '12px', fontFamily: "'Space Mono', monospace"
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar" onChange={handleAttachmentUpload}
                style={{ display: 'none' }} id="attachment-upload" disabled={uploading} />
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
                  marginTop: attachments.length > 0 ? '4px' : 0,
                }}
                  onMouseEnter={() => !uploading && setIsUploadHovered(true)}
                  onMouseLeave={() => {
                    setIsUploadHovered(false)
                    setIsUploadPressed(false)
                  }}
                  onMouseDown={() => !uploading && setIsUploadPressed(true)}
                  onMouseUp={() => setIsUploadPressed(false)}
                >Escolher arquivos</label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: isNarrowScreen ? '10px' : '24px', marginBottom: '14px', flexWrap: isNarrowScreen ? 'wrap' : 'nowrap' }}>
            <div ref={emailRef} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <ChannelCheckbox label="Email" icon="email" checked={form.use_email}
                onChange={() => {
                  const next = !form.use_email;
                  setForm({ ...form, use_email: next })
                  if (next || form.use_sms || form.use_telegram) setFieldErrors(f => ({ ...f, channels: undefined }))
                }} />
            </div>
            <ChannelCheckbox label="SMS" icon="sms" checked={form.use_sms}
              onChange={() => {
                const next = !form.use_sms;
                setForm({ ...form, use_sms: next })
                if (form.use_email || next || form.use_telegram) setFieldErrors(f => ({ ...f, channels: undefined }))
              }} />
            <ChannelCheckbox label="Telegram" icon="telegram" checked={form.use_telegram}
              onChange={() => {
                const next = !form.use_telegram;
                setForm({ ...form, use_telegram: next })
                if (form.use_email || form.use_sms || next) setFieldErrors(f => ({ ...f, channels: undefined }))
              }} />
            <FieldTooltip show={!!fieldErrors.channels} message={fieldErrors.channels} anchorRef={emailRef} />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: isNarrowScreen ? 'wrap' : 'nowrap' }}>
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
                setForm({ name: '', message: '', image_url: null, email_subject: '', sms_from: '', telegram_signature: '', use_email: false, use_sms: false, use_telegram: false, attachments: [] })
                setAttachments([])
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
      <div style={{ background: '#111827', border: '2px solid #2a1a0a', borderRadius: '10px', overflow: 'visible' }}>
        <div style={{ padding: isNarrowScreen ? '12px' : '16px', borderBottom: '2px solid #2a1a0a' }}>
          <div>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', fontFamily: "'Space Mono', monospace" }}>Campanhas</span>
            <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px', fontFamily: "'Space Mono', monospace" }}>({campaigns.length} total)</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrowScreen
            ? '2fr 1.15fr 0.75fr 0.85fr 0.45fr 0.45fr minmax(76px, 0.95fr) minmax(54px, 0.45fr)'
            : 'minmax(180px, 2fr) minmax(220px, 1.6fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr) minmax(120px, 0.9fr) minmax(56px, 0.3fr)',
          padding: isNarrowScreen ? '8px 10px' : '10px 16px',
          borderBottom: '2px solid #2a1a0a',
          gap: isNarrowScreen ? '8px' : '12px',
          alignItems: 'center',
        }}>
          {['Campanha', 'Anexo', 'Canais', 'Status', 'Total', 'Sucesso', 'Disparar', ''].map(h => (
            <div key={h} style={{ color: '#4b5563', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#FF6B00', fontFamily: "'Space Mono', monospace" }}>Carregando...</div>
        ) : sortedCampaigns.map(c => (
          <div key={c.id} style={{
            display: 'grid',
            gridTemplateColumns: isNarrowScreen
              ? '2fr 1.15fr 0.75fr 0.85fr 0.45fr 0.45fr minmax(76px, 0.95fr) minmax(54px, 0.45fr)'
              : 'minmax(180px, 2fr) minmax(220px, 1.6fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr) minmax(120px, 0.9fr) minmax(56px, 0.3fr)',
            alignItems: 'center',
            padding: isNarrowScreen ? '10px' : '12px 16px', borderBottom: '2px solid #2a1a0a',
            gap: isNarrowScreen ? '8px' : '12px',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1208'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#FF6B00' }} />
              <span style={{ color: '#e5e7eb', fontSize: '13px', fontFamily: "'Space Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              {c.pinned && (
                <span title="Campanha fixada" style={{ display: 'inline-flex', alignItems: 'center', color: '#fbbf24', flexShrink: 0 }}>
                  <Pin size={13} />
                </span>
              )}
            </div>
            {(() => {
              const campaignAttachments = normalizeCampaignAttachments(c)
              return (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  {campaignAttachments.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: '#e5e7eb', fontSize: '11px', fontFamily: "'Space Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📎 {campaignAttachments[0].filename}
                      </span>
                      {campaignAttachments.length > 1 && (
                        <span style={{ color: '#6b7280', fontSize: '10px', fontFamily: "'Space Mono', monospace" }}>
                          +{campaignAttachments.length - 1} anexos
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#4b5563', fontSize: '11px', fontFamily: "'Space Mono', monospace" }}>—</span>
                  )}
                </div>
              )
            })()}
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              {c.use_email && <Mail size={16} color="#FF6B00" />}
              {c.use_sms && <MessageSquare size={16} color="#FF6B00" />}
              {c.use_telegram && <Send size={16} color="#FF6B00" />}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}><StatusPill status={c.status} /></div>
            <div style={{ minWidth: 0, color: '#9ca3af', fontSize: '13px', fontFamily: "'Space Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.total}</div>
            <div style={{ minWidth: 0, color: '#10b981', fontSize: '13px', fontFamily: "'Space Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.success}</div>
            <div style={{ minWidth: 0, overflow: 'visible' }}>
              <button
                onClick={() => handleSend(c.id)}
                disabled={sending === c.id || c.status === 'running'}
                style={{
                  background: sending === c.id ? '#2a1a0a' : '#FF6B0022',
                  color: '#FF6B00', border: '1px solid #FF6B0044',
                  borderRadius: '6px', padding: isNarrowScreen ? '3px 6px' : '4px 12px',
                  fontSize: isNarrowScreen ? '10px' : '11px', fontWeight: '600',
                  minWidth: isNarrowScreen ? '72px' : 'auto',
                  whiteSpace: isNarrowScreen ? 'normal' : 'nowrap',
                  lineHeight: isNarrowScreen ? '1.05' : '1.2',
                  textAlign: 'center',
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
                {sending === c.id ? '...' : (isNarrowScreen ? <>▶<br />Disparar</> : '▶ Disparar')}
              </button>
            </div>
            <div style={{ minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
              <CampaignDropdownMenu campaign={c} onEdit={handleEdit} onDelete={handleDelete} onReset={handleResetCampaign} onTogglePin={handleTogglePinCampaign} />
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