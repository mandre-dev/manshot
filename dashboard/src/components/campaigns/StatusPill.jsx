export default function StatusPill({ status }) {
  const colors = {
    done: { bg: '#064e3b', color: '#10b981' },
    running: { bg: '#2a1a0a', color: '#FF8C00' },
    failed: { bg: '#4c1d24', color: '#f87171' },
    pending: { bg: '#1f2937', color: '#9ca3af' },
  }
  const current = colors[status] || colors.pending

  return (
    <span
      style={{
        background: current.bg,
        color: current.color,
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontWeight: '500',
      }}
    >
      {status}
    </span>
  )
}