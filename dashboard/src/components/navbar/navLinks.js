import { Fingerprint } from 'lucide-react'

export const NAV_LINKS = [
  { path: '/', icon: '⚡', label: 'Dashboard' },
  { path: '/contacts', icon: '👥', label: 'Contatos' },
  { path: '/campaigns', icon: '📡', label: 'Campanhas' },
  { path: '/credentials', icon: Fingerprint, label: 'Credenciais', iconKind: 'component' },
]