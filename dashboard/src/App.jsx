// App.jsx — Manshot Cyber Tech

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Campaigns from './pages/Campaigns'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a' }}>
        <Navbar />
        <main style={{ marginLeft: '180px', flex: 1, padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/campaigns" element={<Campaigns />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
