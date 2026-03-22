// Dashboard.jsx — Manshot
// Tela inicial com métricas gerais

import { useEffect, useState } from 'react'
import { getCampaigns, getContacts } from '../services/api'

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [c, co] = await Promise.all([getCampaigns(), getContacts()])
        setCampaigns(c.data)
        setContacts(co.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalDispatched = campaigns.reduce((acc, c) => acc + c.total, 0)
  const totalSuccess = campaigns.reduce((acc, c) => acc + c.success, 0)
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failed, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Carregando...
    </div>
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Campanhas</p>
          <p className="text-3xl font-bold text-indigo-400">{campaigns.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Contatos</p>
          <p className="text-3xl font-bold text-indigo-400">{contacts.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Disparos</p>
          <p className="text-3xl font-bold text-indigo-400">{totalDispatched}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Sucesso</p>
          <p className="text-3xl font-bold text-green-400">{totalSuccess}</p>
        </div>
      </div>

      {/* Últimas campanhas */}
      <h2 className="text-lg font-semibold text-white mb-4">Últimas campanhas</h2>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Canais</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Sucesso</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
