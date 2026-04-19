const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']

export function isImageUrl(url) {
  if (!url) return false
  const lower = url.split('?')[0].toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function getFileNameFromUrl(url) {
  if (!url) return 'arquivo'
  const clean = url.split('?')[0]
  const parts = clean.split('/')
  const rawName = decodeURIComponent(parts[parts.length - 1] || 'arquivo')

  const withoutShortPrefix = rawName.replace(/^[0-9a-f]{8}_/i, '')
  const legacyHashOnlyMatch = withoutShortPrefix.match(/^([0-9a-f]{32})(\.[^.]+)$/i)
  if (legacyHashOnlyMatch) {
    return `arquivo${legacyHashOnlyMatch[2]}`
  }

  return withoutShortPrefix || 'arquivo'
}

export function getAttachmentKind(attachment) {
  if (!attachment) return 'file'
  if (attachment.kind === 'image' || attachment.kind === 'file') return attachment.kind
  return isImageUrl(attachment.url) ? 'image' : 'file'
}

export function normalizeCampaignAttachments(campaign) {
  const attachments = Array.isArray(campaign?.attachments) ? campaign.attachments : []
  if (attachments.length > 0) {
    return attachments
      .filter((attachment) => attachment?.url)
      .map((attachment) => ({
        url: attachment.url,
        filename: attachment.filename || getFileNameFromUrl(attachment.url),
        kind: getAttachmentKind(attachment),
      }))
  }

  if (campaign?.image_url) {
    return [{
      url: campaign.image_url,
      filename: getFileNameFromUrl(campaign.image_url),
      kind: isImageUrl(campaign.image_url) ? 'image' : 'file',
    }]
  }

  return []
}

export function normalizeUploadedAttachment(uploadData, file) {
  const isImage = uploadData.kind === 'image' || (file.type || '').startsWith('image/')
  return {
    url: uploadData.url,
    filename: uploadData.filename || file.name,
    kind: uploadData.kind || (isImage ? 'image' : 'file'),
  }
}