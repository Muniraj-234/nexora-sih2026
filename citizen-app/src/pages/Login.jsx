import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Leaf, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        role: 'citizen',
        name,
        phone,
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 relative overflow-hidden">
      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <Leaf size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Nexora</h1>
          <p className="text-slate-500 mt-1">Smart Waste Management</p>
        </div>

        <div className="card shadow-xl shadow-slate-200/50 border-white bg-white p-6 md:p-8 rounded-2xl">
          <div className="flex rounded-xl mb-6 p-1 bg-slate-100">
            <button
              onClick={() => setMode('login')}
              className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
              style={mode === 'login' ? { background: 'white', color: '#10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } : { color: '#64748b' }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
              style={mode === 'register' ? { background: 'white', color: '#10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } : { color: '#64748b' }}
            >
              Register
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input w-full bg-slate-50" style={{ paddingLeft: '44px' }} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input w-full bg-slate-50" style={{ paddingLeft: '44px' }} placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </>
            )}
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input w-full bg-slate-50" style={{ paddingLeft: '44px' }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pr-10 w-full bg-slate-50" style={{ paddingLeft: '44px' }} type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold mb-1">🎯 Demo — Quick Login</p>
            <p className="text-xs text-emerald-600/80">Register with any email/password to try as a citizen</p>
          </div>
        </div>
      </div>
    </div>
  )
}
