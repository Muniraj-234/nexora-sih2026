import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Demo quick login
  const demoLogin = async () => {
    setLoading(true)
    setError('')
    // Try signing in as demo collector
    const { error: err } = await supabase.auth.signInWithPassword({
      email: 'collector@nexora.demo',
      password: 'nexora123'
    })
    if (err) {
      // Create demo account
      await supabase.auth.signUp({ email: 'collector@nexora.demo', password: 'nexora123' })
      const { error: err2 } = await supabase.auth.signInWithPassword({
        email: 'collector@nexora.demo', password: 'nexora123'
      })
      if (err2) setError(err2.message)
    }
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--nexora-dark)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #10b981, transparent)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #0d9488, transparent)' }}></div>
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            <Truck size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Nexora</h1>
          <p className="text-slate-400 mt-1">Collector App · SIH 2026</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Collector Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-10" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-10 pr-10" type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-xs text-emerald-400 font-semibold mb-2">🚛 Demo Collector Login</p>
            <p className="text-xs text-slate-400 mb-2">Use demo seeded collector account:</p>
            <p className="text-xs text-slate-300">Email: <span className="text-emerald-400">collector@nexora.demo</span></p>
            <p className="text-xs text-slate-300">Password: <span className="text-emerald-400">nexora123</span></p>
            <button onClick={demoLogin} disabled={loading} className="mt-3 text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>
              Quick Demo Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
