// Contacts.jsx — Manshot
// Página de gerenciamento de contatos

import { useEffect, useState } from 'react'
import { getContacts, createContact, deleteContact } from '../services/api'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', telegram_id: ''
  })

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

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await createContact(form)
      setForm({ name: '', email: '', phone: '', telegram_id: '' })
      load()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover contato?')) return
    await deleteContact(id)
    load()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Contatos</h1>

      {/* Formulário */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Novo contato</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <input
            className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm"
            placeholder="Nome *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm"
            placeholder="Telefone (ex: 5521999999999)"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm"
            placeholder="Telegram ID"
            value={form.telegram_id}
            onChange={e => setForm({ ...form, telegram_id: e.target.value })}
          />
          <button
            type="submit"
            className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium transition"
          >
            Adicionar contato
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Telefone</th>
              <th className="text-left p-4">Telegram ID</th>
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Carregando...</td></tr>
            ) : contacts.map(c => (
              <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                <td className="p-4 text-white">{c.name}</td>
                <td className="p-4 text-gray-300">{c.email || '—'}</td>
                <td className="p-4 text-gray-300">{c.phone || '—'}</td>
                <td className="p-4 text-gray-300">{c.telegram_id || '—'}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 hover:text-red-300 text-xs transition"
                  >
                    Remover
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
