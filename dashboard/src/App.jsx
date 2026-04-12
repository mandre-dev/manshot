// App.jsx — Manshot Cyber Tech

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Campaigns from './pages/Campaigns'
import Credentials from './pages/Credentials'
import Login from './pages/Login'


function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a' }}>
      <Navbar />
      <main style={{
        marginLeft: '180px',
        width: 'calc(100% - 180px)',
        maxWidth: 'calc(100% - 180px)',
        boxSizing: 'border-box',
        flex: 1,
        padding: '16px',
        overflowX: 'hidden',
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/credentials" element={<Credentials />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={(
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  )
}
