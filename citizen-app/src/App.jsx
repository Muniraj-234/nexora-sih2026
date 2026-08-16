import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import RequestPickup from './pages/RequestPickup'
import LiveTracking from './pages/LiveTracking'
import MyRequests from './pages/MyRequests'
import Layout from './components/Layout'

import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
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
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nexora-dark)' }}>
        <div className="text-center animate-slide-up">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Nexora...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout user={user} profile={profile} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard profile={profile} />} />
          <Route path="scanner" element={<Scanner profile={profile} />} />
          <Route path="request-pickup" element={<RequestPickup profile={profile} />} />
          <Route path="tracking" element={<LiveTracking />} />
          <Route path="my-requests" element={<MyRequests profile={profile} />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
