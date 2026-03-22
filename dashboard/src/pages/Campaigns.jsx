// Campaigns.jsx — Manshot
// Página de gerenciamento e disparo de campanhas

import { useEffect, useState } from 'react'
import { getCampaigns, createCampaign, sendCampaign } from '../services/api'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null)
  const [form, setForm] = useState({
    name: '',
    message: '',
    use_email: false,
    use_sms: false,
    use_telegram: false,
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Campanhas</h1>

      {/* Formulário */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Nova campanha</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <input
            className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm"
            placeholder="Nome da campanha *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm h-24 resize-none"
            placeholder="Mensagem — use {name} para personalizar"
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            required
          />

          {/* Canais */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.use_email}
                onChange={e => setForm({ ...form, use_email: e.target.checked })}
                className="accent-indigo-500"
              />
              📧 Email
            </label>
            <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.use_sms}
                onChange={e => setForm({ ...form, use_sms: e.target.checked })}
                className="accent-indigo-500"
              />
              📱 SMS
            </label>
            <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.use_telegram}
                onChange={e => setForm({ ...form, use_telegram: e.target.checked })}
                className="accent-indigo-500"
              />
              ✈️ Telegram
            </label>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium transition"
          >
            Criar campanha
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Canais</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Sucesso</th>
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">Carregando...</td></tr>
            ) : campaigns.map(c => (
              <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                <td className="p-4 text-white">{c.name}</td>
                <td className="p-4 text-gray-300">
                  {c.use_email && <span className="mr-1">📧</span>}
                  {c.use_sms && <span className="mr-1">📱</span>}
                  {c.use_telegram && <span>✈️</span>}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.status === 'done' ? 'bg-green-900 text-green-400' :
                    c.status === 'running' ? 'bg-yellow-900 text-yellow-400' :
                    c.status === 'failed' ? 'bg-red-900 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{c.total}</td>
                <td className="p-4 text-green-400">{c.success}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleSend(c.id)}
                    disabled={sending === c.id || c.status === 'running'}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs transition"
                  >
                    {sending === c.id ? 'Disparando...' : 'Disparar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
