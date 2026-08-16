import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import AdminLayout from './components/AdminLayout'
import Overview from './pages/Overview'
import FleetMap from './pages/FleetMap'
import Complaints from './pages/Complaints'
import Collectors from './pages/Collectors'
import Citizens from './pages/Citizens'
import Analytics from './pages/Analytics'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nexora-dark)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400">Loading Nexora Municipal...</p>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <AdminLayout profile={profile} /> : <Navigate to="/login" />}>
        <Route index element={<Overview />} />
        <Route path="fleet" element={<FleetMap />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="collectors" element={<Collectors />} />
        <Route path="citizens" element={<Citizens />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}
