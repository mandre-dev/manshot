import { Fingerprint, Shield, KeyRound } from 'lucide-react'

const cardStyle = {
  background: '#111827',
  border: '2px solid #2a1a0a',
  borderRadius: '12px',
  padding: '20px',
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#1a1208',
  border: '1px solid #FF6B0033',
  color: '#FFB066',
  fontSize: '12px',
  fontWeight: '600',
}

export default function Credentials() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
          Configuração da conta
        </div>
        <div style={{ color: '#fff', fontSize: '22px', fontFamily: "'Fira Code', monospace", fontWeight: '700' }}>
          CREDENCIAIS
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={cardStyle}>
          <div style={badgeStyle}>
            <Fingerprint size={16} />
            Login admin
          </div>
          <div style={{ color: '#e5e7eb', fontSize: '13px', marginTop: '14px' }}>
            A autenticação administrativa é feita com a conta local configurada no backend.
          </div>
        </div>

        <div style={cardStyle}>
          <div style={badgeStyle}>
            <Shield size={16} />
            Email
          </div>
          <div style={{ color: '#FF6B00', fontSize: '20px', fontWeight: '700', marginTop: '14px', fontFamily: "'Fira Code', monospace" }}>
            admin@manshot.local
          </div>
        </div>

        <div style={cardStyle}>
          <div style={badgeStyle}>
            <KeyRound size={16} />
            Senha
          </div>
          <div style={{ color: '#FF6B00', fontSize: '20px', fontWeight: '700', marginTop: '14px', fontFamily: "'Fira Code', monospace" }}>
            admin123
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#1a1208', border: '1px solid #FF6B0033', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00' }}>
          <Fingerprint size={22} />
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Acesso protegido
          </div>
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>
            Se você trocar as credenciais no backend, esta seção deve ser atualizada para refletir o novo login.
          </div>
        </div>
      </div>
    </div>
  )
}